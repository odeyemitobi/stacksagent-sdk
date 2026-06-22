import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionsController } from './executions.controller';
import { PrismaExecutionStorage } from '../adapters/prisma-execution.storage';
import { PrismaService } from '../prisma.service';
import { HttpException } from '@nestjs/common';

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
}));

jest.mock('@stackagent/security', () => {
  const original = jest.requireActual('@stackagent/security');
  return {
    ...original,
    TransactionSimulator: class {
      simulate = jest.fn().mockResolvedValue({ ok: true, value: { predictedFee: 1, postConditions: [], humanReadableDiff: {} } });
    }
  };
});

describe('ExecutionsController', () => {
  let controller: ExecutionsController;
  let mockExecutionStorage: Partial<PrismaExecutionStorage>;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockExecutionStorage = {
      create: jest.fn().mockResolvedValue({ id: 'exec-1' }),
      findPending: jest.fn().mockResolvedValue([]),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      logAudit: jest.fn().mockResolvedValue(undefined),
    };

    mockPrismaService = {
      agent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'agent-1',
          policies: [
            {
              id: 'pol-1',
              type: 'APPROVAL_THRESHOLD',
              parameters: { thresholdAmount: 100 }
            }
          ]
        })
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionsController],
      providers: [
        { provide: PrismaExecutionStorage, useValue: mockExecutionStorage },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<ExecutionsController>(ExecutionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('proposeExecution', () => {
    it('should create a pending execution if threshold is exceeded', async () => {
      const intent = { actionId: 'swap', protocolId: 'alex', parameters: { amount: 500 } };
      
      const result = await controller.proposeExecution('idemp-1', { agentId: 'agent-1', intent });
      
      expect(result.status).toBe('PENDING_APPROVAL');
      expect(mockExecutionStorage.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING_APPROVAL' })
      );
      expect(mockExecutionStorage.logAudit).toHaveBeenCalledWith(
        'agent-1', intent, 'PENDING_APPROVAL', expect.anything()
      );
    });

    it('should auto-approve if under threshold', async () => {
      const intent = { actionId: 'swap', protocolId: 'alex', parameters: { amount: 50 } };
      
      const result = await controller.proposeExecution('idemp-2', { agentId: 'agent-1', intent });
      
      expect(result.status).toBe('APPROVED');
      expect(mockExecutionStorage.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'APPROVED' })
      );
    });

    it('should throw if idempotency key is missing', async () => {
      const intent = { actionId: 'swap', protocolId: 'alex', parameters: { amount: 50 } };
      await expect(controller.proposeExecution('', { agentId: 'agent-1', intent })).rejects.toThrow(HttpException);
    });
  });

  describe('approveExecution', () => {
    it('should mark execution as broadcasted with a valid signed tx', async () => {
      const result = await controller.approveExecution('exec-1', 'idemp-3', { signedTxId: 'mock_tx_id_123', approverId: 'human-1' });
      
      expect(result.success).toBe(true);
      expect(result.status).toBe('BROADCASTED');
      expect(mockExecutionStorage.updateStatus).toHaveBeenCalledWith('exec-1', 'BROADCASTED', 'human-1');
    });

    it('should throw if signedTxId is missing or invalid', async () => {
      await expect(controller.approveExecution('exec-1', 'idemp-4', { signedTxId: 'im-a-hacker', approverId: 'human-1' }))
        .rejects.toThrow(HttpException);
    });
  });
});
