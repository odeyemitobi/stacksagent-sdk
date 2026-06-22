import { Controller, Get, Post, Body, Param, Query, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaMarketplaceStorage } from '../adapters/prisma-marketplace.storage';
import { PrismaAgentStorage } from '../adapters/prisma-agent.storage';
import type { PublishAgentRequest, CloneAgentResponse, PaginatedMarketplaceResponse, PublishedAgentDto } from '@stackagent/types';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';



const PublishAgentDto = z.object({
  name: z.string(),
  description: z.string(),
  configPayload: z.any(), // Assuming AgentConfig validation happens downstream if needed
});

@Controller('v1/marketplace/agents')
export class MarketplaceController {
  constructor(
    private readonly marketplaceStorage: PrismaMarketplaceStorage,
    private readonly agentStorage: PrismaAgentStorage,
  ) {}

  @Get()
  async listAgents(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedMarketplaceResponse> {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.marketplaceStorage.list(cursor, parsedLimit);
  }

  @Get(':id')
  async getAgent(@Param('id') id: string): Promise<PublishedAgentDto> {
    const agent = await this.marketplaceStorage.get(id);
    if (!agent) {
      throw new NotFoundException(`Published agent with ID ${id} not found.`);
    }
    return agent;
  }

  @Post()
  async publishAgent(@Body() body: unknown): Promise<PublishedAgentDto> {
    const parsed = PublishAgentDto.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(parsed.error.issues, HttpStatus.BAD_REQUEST);
    }
    
    // In a real app, authorId would come from the authenticated JWT.
    // For MVP, we use a stub.
    const authorId = 'default-user-id';
    return this.marketplaceStorage.publish(authorId, parsed.data.name, parsed.data.description, parsed.data.configPayload as any);
  }

  @Post(':id/clone')
  async cloneAgent(@Param('id') id: string): Promise<CloneAgentResponse> {
    const publishedAgent = await this.marketplaceStorage.get(id);
    if (!publishedAgent) {
      throw new NotFoundException(`Published agent with ID ${id} not found.`);
    }

    // Create a new local agent from the published template
    const newAgentId = uuidv4();
    const now = Date.now();

    await this.agentStorage.save({
      id: newAgentId,
      config: {
        name: `Clone of ${publishedAgent.name}`,
        role: publishedAgent.configPayload.role,
        systemPrompt: publishedAgent.configPayload.systemPrompt,
        allowedProtocols: publishedAgent.configPayload.allowedProtocols,
      },
      status: 'IDLE',
      createdAt: now,
      updatedAt: now,
    });

    // Increment download count for the template
    await this.marketplaceStorage.incrementDownloads(id);

    return { success: true, newAgentId };
  }
}
