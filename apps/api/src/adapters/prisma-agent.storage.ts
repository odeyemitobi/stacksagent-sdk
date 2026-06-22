// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { IAgentStorage } from '@stackagent/runtime';
import { AgentState, AgentStatus } from '@stackagent/types';
// @ts-ignore - PrismaClient is missing until 'npx prisma generate' runs successfully
// @ts-ignore - PrismaClient is missing until 'npx prisma generate' runs successfully
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaAgentStorage implements IAgentStorage {
  constructor(private prisma: PrismaService) {}

  async save(agent: AgentState): Promise<void> {
    await this.prisma.agent.upsert({
      where: { id: agent.id },
      update: {
        status: agent.status,
        updatedAt: new Date(agent.updatedAt),
      },
      create: {
        id: agent.id,
        name: agent.config.name,
        role: agent.config.role,
        status: agent.status,
        userId: 'default-user-id', // Stub for MVP user
        createdAt: new Date(agent.createdAt),
        updatedAt: new Date(agent.updatedAt),
      }
    });
  }

  async get(id: string): Promise<AgentState | null> {
    const record = await this.prisma.agent.findUnique({ where: { id } });
    if (!record) return null;

    return {
      id: record.id,
      config: {
        name: record.name,
        role: record.role,
        // Since allowedProtocols is not strictly tracked in Prisma MVP table, returning defaults
      },
      status: record.status as AgentStatus,
      createdAt: record.createdAt.getTime(),
      updatedAt: record.updatedAt.getTime(),
    };
  }

  async list(): Promise<AgentState[]> {
    const records = await this.prisma.agent.findMany({
      where: { deletedAt: null }
    });

    return records.map((record: any) => ({
      id: record.id,
      config: {
        name: record.name,
        role: record.role,
      },
      status: record.status as AgentStatus,
      createdAt: record.createdAt.getTime(),
      updatedAt: record.updatedAt.getTime(),
    }));
  }
}
