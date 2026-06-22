import { Injectable } from '@nestjs/common';
import { IAuditStorage } from '@stackagent/security';
import { AuditLog, AuditOutcome, ExecutionIntent, Result, ok, err } from '@stackagent/types';
// @ts-ignore - PrismaClient is missing until 'npx prisma generate' runs successfully
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaAuditStorage implements IAuditStorage {
  constructor(private prisma: PrismaClient) {}

  async insert(log: AuditLog): Promise<Result<void, Error>> {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: log.id,
          agentId: log.actorId, // Mapping actorId to agentId based on schema
          actorId: log.actorId,
          intent: log.intent as any,
          policyEvaluation: log.policyEvaluation as any,
          outcome: log.outcome,
          createdAt: new Date(log.timestamp),
        },
      });
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to insert audit log'));
    }
  }

  async getLogs(): Promise<Result<AuditLog[], Error>> {
    try {
      const logs = await this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'asc' }
      });
      
      const mapped: AuditLog[] = logs.map((l: any) => ({
        id: l.id,
        actorId: l.actorId,
        intent: l.intent as unknown as ExecutionIntent,
        policyEvaluation: l.policyEvaluation,
        outcome: l.outcome as AuditOutcome,
        timestamp: l.createdAt.toISOString()
      }));
      return ok(mapped);
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to fetch audit logs'));
    }
  }
}
