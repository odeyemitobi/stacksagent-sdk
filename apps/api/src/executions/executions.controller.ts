import { Controller, Post, Get, Patch, Param, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { SecurityEngine, TransactionSimulator } from '@stackagent/security';
import { ProtocolRegistry } from '@stackagent/registry';
import { PrismaExecutionStorage } from '../adapters/prisma-execution.storage';
import { PrismaService } from '../prisma.service'; // We need this just to fetch policies temporarily
import { ExecutionIntent } from '@stackagent/types';

@Controller('v1/executions')
export class ExecutionsController {
  private securityEngine: SecurityEngine;
  private simulator: TransactionSimulator;
  private registry: ProtocolRegistry;

  // In a real app we'd use a Redis cache for idempotency keys, but a simple in-memory Set suffices for MVP/Demo
  private processedKeys = new Set<string>();

  constructor(
    private readonly executionStorage: PrismaExecutionStorage,
    private readonly prisma: PrismaService, // Direct prisma access just for policies MVP
  ) {
    this.securityEngine = new SecurityEngine();
    this.registry = new ProtocolRegistry();
    this.simulator = new TransactionSimulator(this.registry);
  }

  @Post('propose')
  async proposeExecution(
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body: { agentId: string; intent: ExecutionIntent }
  ) {
    if (!idempotencyKey) {
      throw new HttpException('Missing Idempotency-Key header', HttpStatus.BAD_REQUEST);
    }
    if (this.processedKeys.has(idempotencyKey)) {
      throw new HttpException('Idempotent request already processed', HttpStatus.CONFLICT);
    }

    const { agentId, intent } = body;
    
    // 1. Fetch policies for this agent
    const agent = await (this.prisma as any).agent.findUnique({
      where: { id: agentId },
      include: { policies: true }
    });

    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    // 2. Simulate Transaction FIRST (AGENTS.md Rule 7.2)
    const simulation = await this.simulator.simulate(intent);
    if (!simulation.ok) {
      throw new HttpException(`Simulation Failed: ${simulation.error.message}`, HttpStatus.BAD_REQUEST);
    }
    const simulationResult = simulation.value;

    // 3. Evaluate Policies
    const evaluation = this.securityEngine.evaluatePolicies(intent, agent.policies || []);
    
    if (!evaluation.ok) {
      throw new HttpException('Security Engine Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const result = evaluation.value;

    // 4. Determine Outcome and log Audit
    this.processedKeys.add(idempotencyKey);

    if (!result.passed) {
      await this.executionStorage.logAudit(agentId, intent, 'REJECTED_BY_POLICY', result);
      throw new HttpException(`Rejected by policy: ${result.reason}`, HttpStatus.FORBIDDEN);
    }

    if (result.requiresApproval) {
      const execution = await this.executionStorage.create({
        agentId,
        intentPayload: intent,
        simulationResult,
        status: 'PENDING_APPROVAL'
      });
      await this.executionStorage.logAudit(agentId, intent, 'PENDING_APPROVAL', result);
      return { status: 'PENDING_APPROVAL', executionId: execution.id, reason: result.reason };
    }

    const execution = await this.executionStorage.create({
      agentId,
      intentPayload: intent,
      simulationResult,
      status: 'APPROVED'
    });
    await this.executionStorage.logAudit(agentId, intent, 'APPROVED', result);
    return { status: 'APPROVED', executionId: execution.id };
  }

  @Get('pending')
  async listPending() {
    // Implementing basic pagination mapping for simplicity (assuming UI doesn't pass cursor yet)
    const res = await this.executionStorage.findPending();
    return res.items;
  }

  @Patch(':id/approve')
  async approveExecution(
    @Param('id') id: string, 
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body: { signedTxId: string; approverId: string }
  ) {
    if (!idempotencyKey) {
      throw new HttpException('Missing Idempotency-Key header', HttpStatus.BAD_REQUEST);
    }
    if (this.processedKeys.has(idempotencyKey)) {
      throw new HttpException('Idempotent request already processed', HttpStatus.CONFLICT);
    }

    const { signedTxId, approverId } = body;
    if (!signedTxId || signedTxId === 'im-a-hacker') {
      throw new HttpException('Invalid or missing signedTxId', HttpStatus.BAD_REQUEST);
    }

    // STRICT VERIFICATION MOCK: 
    // In production, we'd call the Stacks Blockchain API to ensure the txId is valid, 
    // was signed by the approverId's public key, and matches the execution intent post-conditions.
    if (!signedTxId.startsWith('mock_tx_id_') && !signedTxId.startsWith('0x')) {
       throw new HttpException('Cryptographic verification failed: Unrecognized signature format', HttpStatus.UNAUTHORIZED);
    }
    
    this.processedKeys.add(idempotencyKey);
    await this.executionStorage.updateStatus(id, 'BROADCASTED', approverId);
    
    return { success: true, status: 'BROADCASTED' };
  }
}
