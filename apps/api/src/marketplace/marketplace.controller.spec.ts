import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceController } from './marketplace.controller';
import { PrismaMarketplaceStorage } from '../adapters/prisma-marketplace.storage';
import { PrismaAgentStorage } from '../adapters/prisma-agent.storage';
import { NotFoundException } from '@nestjs/common';

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('MarketplaceController', () => {
  let controller: MarketplaceController;
  let mockMarketplaceStorage: Partial<PrismaMarketplaceStorage>;
  let mockAgentStorage: Partial<PrismaAgentStorage>;

  beforeEach(async () => {
    mockMarketplaceStorage = {
      list: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      get: jest.fn(),
      publish: jest.fn(),
      incrementDownloads: jest.fn().mockResolvedValue(undefined),
    };

    mockAgentStorage = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketplaceController],
      providers: [
        { provide: PrismaMarketplaceStorage, useValue: mockMarketplaceStorage },
        { provide: PrismaAgentStorage, useValue: mockAgentStorage },
      ],
    }).compile();

    controller = module.get<MarketplaceController>(MarketplaceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAgent', () => {
    it('should return agent if found', async () => {
      const mockAgent = { id: '123', name: 'Test' } as any;
      (mockMarketplaceStorage.get as jest.Mock).mockResolvedValue(mockAgent);
      
      const result = await controller.getAgent('123');
      expect(result).toEqual(mockAgent);
      expect(mockMarketplaceStorage.get).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException if agent not found', async () => {
      (mockMarketplaceStorage.get as jest.Mock).mockResolvedValue(null);
      
      await expect(controller.getAgent('404')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cloneAgent', () => {
    it('should create a new local agent from a template and increment downloads', async () => {
      const mockTemplate = {
        id: 'tpl-1',
        name: 'My Template',
        configPayload: { role: 'Trader', systemPrompt: 'Be a good trader', allowedProtocols: ['alex'] }
      } as any;
      
      (mockMarketplaceStorage.get as jest.Mock).mockResolvedValue(mockTemplate);

      const result = await controller.cloneAgent('tpl-1');
      
      expect(result.success).toBe(true);
      expect(result.newAgentId).toBeDefined();
      
      expect(mockAgentStorage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: result.newAgentId,
          config: expect.objectContaining({
            name: 'Clone of My Template',
            role: 'Trader',
            systemPrompt: 'Be a good trader',
            allowedProtocols: ['alex']
          }),
          status: 'IDLE'
        })
      );
      
      expect(mockMarketplaceStorage.incrementDownloads).toHaveBeenCalledWith('tpl-1');
    });
  });
});
