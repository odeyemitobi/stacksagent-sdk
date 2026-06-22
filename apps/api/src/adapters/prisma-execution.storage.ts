// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaExecutionStorage {
  constructor(private prisma: PrismaService) {}

  async create(data: { agentId: string; intentPayload: any; simulationResult?: any; status: string }) {
    return this.prisma.execution.create({
      data: {
        agentId: data.agentId,
        intentPayload: data.intentPayload,
        simulationResult: data.simulationResult,
        status: data.status,
      },
    });
  }

  async findPending(cursor?: string, limit: number = 20) {
    const args: any = {
      where: { status: 'PENDING_APPROVAL' },
      take: limit + 1, // Fetch one extra to determine nextCursor
      include: {
        agent: {
          select: { name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    };

    if (cursor) {
      args.cursor = { id: cursor };
    }

    const items = await this.prisma.execution.findMany(args);
    let nextCursor: string | null = null;
    
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem!.id;
    }

    return { items, nextCursor };
  }

  async updateStatus(id: string, status: string, approvedBy?: string) {
    return this.prisma.execution.update({
      where: { id },
      data: { status, approvedBy },
    });
  }

  async logAudit(agentId: string, intent: any, outcome: string, policyEvaluation?: any) {
    return this.prisma.auditLog.create({
      data: {
        agentId,
        actorId: 'agent', // The system actor proposing
        intent,
        outcome,
        policyEvaluation: policyEvaluation || {},
      },
    });
  }
}
