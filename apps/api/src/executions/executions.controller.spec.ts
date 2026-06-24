import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionsController } from './executions.controller';
import { PrismaExecutionStorage } from '../adapters/prisma-execution.storage';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis/redis.service';
import { HttpException } from '@nestjs/common';

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
}));

describe('ExecutionsController', () => {
  let controller: ExecutionsController;
  let mockExecutionStorage: Partial<PrismaExecutionStorage>;
  let mockPrismaService: {
    agent: { findUnique: jest.Mock };
  };
  let fetchMock: jest.Mock;

  const agentId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    mockExecutionStorage = {
      create: jest.fn().mockResolvedValue({ id: 'exec-1' }),
      findPending: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      logAudit: jest.fn().mockResolvedValue(undefined),
    };

    mockPrismaService = {
      agent: {
        findUnique: jest.fn().mockResolvedValue({
          id: agentId,
          status: 'RUNNING',
          policies: [
            {
              id: 'pol-1',
              type: 'APPROVAL_THRESHOLD',
              parameters: { thresholdAmount: 100 },
            },
          ],
        }),
      },
    };

    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionsController],
      providers: [
        { provide: PrismaExecutionStorage, useValue: mockExecutionStorage },
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: RedisService,
          useValue: { acquireIdempotencyKey: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    controller = module.get<ExecutionsController>(ExecutionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('proposeExecution', () => {
    it('should create a pending execution if threshold is exceeded', async () => {
      const intent = {
        actionId: 'swap',
        protocolId: 'alex',
        parameters: { amount: 500 },
        reasoning: 'High value swap',
      };

      const result = await controller.proposeExecution('idemp-1', { agentId, intent });

      expect(result.status).toBe('PENDING_APPROVAL');
      expect(mockExecutionStorage.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING_APPROVAL' }),
      );
      expect(mockExecutionStorage.logAudit).toHaveBeenCalledWith(
        agentId,
        intent,
        'PENDING_APPROVAL',
        expect.anything(),
        expect.anything(),
      );
    });

    it('should auto-approve if under threshold', async () => {
      const intent = {
        actionId: 'swap',
        protocolId: 'alex',
        parameters: { amount: 50 },
        reasoning: 'Small swap',
      };

      const result = await controller.proposeExecution('idemp-2', { agentId, intent });

      expect(result.status).toBe('APPROVED');
      expect(mockExecutionStorage.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'APPROVED' }),
      );
    });

    it('should throw if idempotency key is missing', async () => {
      const intent = {
        actionId: 'swap',
        protocolId: 'alex',
        parameters: { amount: 50 },
        reasoning: 'test',
      };
      await expect(controller.proposeExecution('', { agentId, intent })).rejects.toThrow(HttpException);
    });

    it('should reject stopped agents', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValueOnce({
        id: agentId,
        status: 'STOPPED',
        policies: [],
      });

      const intent = {
        actionId: 'swap',
        protocolId: 'alex',
        parameters: { amount: 50 },
        reasoning: 'test',
      };

      await expect(controller.proposeExecution('idemp-stop', { agentId, intent })).rejects.toThrow(HttpException);
    });
  });

  describe('approveExecution', () => {
    it('should mark execution as broadcasted with a valid signed tx', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          tx_type: 'contract_call',
          contract_call: {
            contract_id: 'st37h9qbweg9nec1y9mw82yfh8y4gb3sptpsn38gg.treasury-vault-v2',
            function_name: 'execute-approved-intent',
          },
        }),
      });

      const result = await controller.approveExecution('exec-1', 'idemp-3', {
        signedTxId: 'mock_tx_id_123',
        approverId: 'human-1',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('BROADCASTED');
      expect(mockExecutionStorage.updateStatus).toHaveBeenCalledWith('exec-1', 'BROADCASTED', 'human-1');
    });

    it('should throw if signedTxId is missing or invalid', async () => {
      await expect(
        controller.approveExecution('exec-1', 'idemp-4', {
          signedTxId: 'im-a-hacker',
          approverId: 'human-1',
        }),
      ).rejects.toThrow(HttpException);
    });
  });
});
