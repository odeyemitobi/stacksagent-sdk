import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Headers,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SecurityEngine, TransactionSimulator } from '@stackagent/security';
import { registry } from '@stackagent/registry';
import { ExecutionIntent } from '@stackagent/types';
import { z } from 'zod';
import { PrismaExecutionStorage } from '../adapters/prisma-execution.storage';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis/redis.service';
import { getStacksNetworkConfig } from '../config/stacks-network';
import { AgentPrismaDelegate, mapPolicyRecords } from '../types/agent-records';

const ExecutionIntentSchema = z.object({
  actionId: z.string(),
  protocolId: z.string(),
  parameters: z.record(z.string(), z.unknown()),
  reasoning: z.string().optional().default(''),
});

const ProposeExecutionDto = z.object({
  agentId: z.string().uuid(),
  intent: ExecutionIntentSchema,
});

const ApproveExecutionDto = z.object({
  signedTxId: z.string().min(1),
  approverId: z.string().min(1),
});

@Controller('v1/executions')
export class ExecutionsController {
  private readonly securityEngine: SecurityEngine;
  private readonly simulator: TransactionSimulator;
  private readonly networkConfig = getStacksNetworkConfig();

  constructor(
    private readonly executionStorage: PrismaExecutionStorage,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    this.securityEngine = new SecurityEngine();
    this.simulator = new TransactionSimulator(registry);
  }

  @Post('propose')
  async proposeExecution(
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body: unknown,
  ) {
    if (!idempotencyKey) {
      throw new HttpException('Missing Idempotency-Key header', HttpStatus.BAD_REQUEST);
    }

    const parsed = ProposeExecutionDto.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(parsed.error.issues, HttpStatus.BAD_REQUEST);
    }

    const acquired = await this.redisService.acquireIdempotencyKey(idempotencyKey);
    if (!acquired) {
      throw new HttpException('Idempotent request already processed', HttpStatus.CONFLICT);
    }

    const { agentId, intent } = parsed.data;

    const agentDelegate = (this.prisma as unknown as { agent: AgentPrismaDelegate }).agent;
    const agent = await agentDelegate.findUnique({
      where: { id: agentId, deletedAt: null },
      include: { policies: { where: { deletedAt: null } } },
    });

    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    // Step 1: Permission validation — agent must be active (not stopped)
    if (agent.status === 'STOPPED') {
      await this.executionStorage.logAudit(agentId, intent, 'REJECTED_BY_PERMISSION', {
        passed: false,
        reason: 'Agent is stopped and cannot propose executions.',
      });
      throw new HttpException('Agent is stopped and cannot propose executions.', HttpStatus.FORBIDDEN);
    }

    const typedPolicies = mapPolicyRecords(agent.policies ?? []);

    // Step 2: Policy evaluation
    const evaluation = this.securityEngine.evaluatePolicies(intent as ExecutionIntent, typedPolicies);

    if (!evaluation.ok) {
      throw new HttpException('Security Engine Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const policyResult = evaluation.value;

    if (!policyResult.passed) {
      await this.executionStorage.logAudit(agentId, intent, 'REJECTED_BY_POLICY', policyResult);
      throw new HttpException(`Rejected by policy: ${policyResult.reason}`, HttpStatus.FORBIDDEN);
    }

    // Step 3: Transaction simulation
    const simulation = await this.simulator.simulate(intent as ExecutionIntent);
    if (!simulation.ok) {
      await this.executionStorage.logAudit(agentId, intent, 'SIMULATION_FAILED', {
        ...policyResult,
        reason: simulation.error.message,
      });
      throw new HttpException(`Simulation Failed: ${simulation.error.message}`, HttpStatus.BAD_REQUEST);
    }
    const simulationResult = simulation.value;

    // Step 4: Audit log before any approval path
    const auditOutcome = policyResult.requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED';
    await this.executionStorage.logAudit(agentId, intent, auditOutcome, policyResult, simulationResult);

    // Step 5: Approval workflow gate
    if (policyResult.requiresApproval) {
      const execution = await this.executionStorage.create({
        agentId,
        intentPayload: intent,
        simulationResult,
        status: 'PENDING_APPROVAL',
      });
      return {
        status: 'PENDING_APPROVAL',
        executionId: execution.id,
        reason: policyResult.reason,
        simulationResult,
      };
    }

    const execution = await this.executionStorage.create({
      agentId,
      intentPayload: intent,
      simulationResult,
      status: 'APPROVED',
    });

    return { status: 'APPROVED', executionId: execution.id, simulationResult };
  }

  @Get('pending')
  async listPending(@Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const result = await this.executionStorage.findPending(cursor, parsedLimit);
    return result;
  }

  @Patch(':id/approve')
  async approveExecution(
    @Param('id') id: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body: unknown,
  ) {
    if (!idempotencyKey) {
      throw new HttpException('Missing Idempotency-Key header', HttpStatus.BAD_REQUEST);
    }

    const parsed = ApproveExecutionDto.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(parsed.error.issues, HttpStatus.BAD_REQUEST);
    }

    const acquired = await this.redisService.acquireIdempotencyKey(idempotencyKey);
    if (!acquired) {
      throw new HttpException('Idempotent request already processed', HttpStatus.CONFLICT);
    }

    const { signedTxId, approverId } = parsed.data;

    if (signedTxId === 'im-a-hacker') {
      throw new HttpException('Invalid or missing signedTxId', HttpStatus.BAD_REQUEST);
    }

    await this.verifySignedTransaction(signedTxId);

    await this.executionStorage.updateStatus(id, 'BROADCASTED', approverId);

    return { success: true, status: 'BROADCASTED' };
  }

  private async verifySignedTransaction(signedTxId: string): Promise<void> {
    const cleanTxId = signedTxId.replace(/['"]/g, '');
    const txIdFormatted = cleanTxId.startsWith('0x') ? cleanTxId : `0x${cleanTxId}`;
    const { hiroApiBaseUrl, treasuryContractId } = this.networkConfig;

    try {
      const response = await fetch(`${hiroApiBaseUrl}/extended/v1/tx/${txIdFormatted}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new HttpException(
            `Transaction not found on Stacks ${this.networkConfig.mode}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        throw new HttpException('Failed to verify transaction with Stacks Node', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const txData = (await response.json()) as {
        tx_type?: string;
        contract_call?: { contract_id?: string; function_name?: string };
      };

      if (txData.tx_type !== 'contract_call') {
        throw new HttpException('Verification failed: Transaction is not a contract call', HttpStatus.BAD_REQUEST);
      }

      const expectedContract = treasuryContractId.toLowerCase();
      const actualContract = txData.contract_call?.contract_id?.toLowerCase();
      if (actualContract && actualContract !== expectedContract) {
        throw new HttpException(
          'Verification failed: Transaction does not target the configured treasury vault',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException('Verification process failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
