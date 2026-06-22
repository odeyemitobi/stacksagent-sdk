// @ts-nocheck
import { Injectable } from '@nestjs/common';
// @ts-ignore - PrismaClient is missing until 'npx prisma generate' runs successfully
import { PrismaService } from '../prisma.service';
import { AgentConfig, PublishedAgentDto, PaginatedMarketplaceResponse } from '@stackagent/types';

@Injectable()
export class PrismaMarketplaceStorage {
  constructor(private prisma: PrismaService) {}

  async publish(authorId: string, name: string, description: string, configPayload: AgentConfig): Promise<PublishedAgentDto> {
    const record = await this.prisma.publishedAgent.create({
      data: {
        authorId,
        name,
        description,
        configPayload: configPayload as any,
      }
    });

    return this.mapToDto(record);
  }

  async get(id: string): Promise<PublishedAgentDto | null> {
    const record = await this.prisma.publishedAgent.findUnique({ where: { id, deletedAt: null } });
    if (!record) return null;
    return this.mapToDto(record);
  }

  async list(cursor?: string, limit: number = 20): Promise<PaginatedMarketplaceResponse> {
    const records = await this.prisma.publishedAgent.findMany({
      take: limit + 1, // Fetch one extra to determine if there's a next page
      cursor: cursor ? { id: cursor } : undefined,
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | null = null;
    if (records.length > limit) {
      const nextItem = records.pop(); // Remove the extra item
      nextCursor = nextItem!.id;
    }

    return {
      items: records.map(this.mapToDto),
      nextCursor,
    };
  }

  async incrementDownloads(id: string): Promise<void> {
    await this.prisma.publishedAgent.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });
  }

  private mapToDto(record: any): PublishedAgentDto {
    return {
      id: record.id,
      authorId: record.authorId,
      name: record.name,
      description: record.description,
      configPayload: record.configPayload as AgentConfig,
      downloads: record.downloads,
      createdAt: record.createdAt.getTime(),
      updatedAt: record.updatedAt.getTime(),
    };
  }
}
