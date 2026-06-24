import { Policy } from '@stackagent/types';

export interface AgentPolicyRecord {
  id: string;
  type: string;
  parameters: unknown;
  targetActionId: string | null;
  targetProtocolId: string | null;
}

export interface AgentWithPoliciesRecord {
  id: string;
  status: string;
  policies: AgentPolicyRecord[];
}

export interface AgentPrismaDelegate {
  findUnique(args: unknown): Promise<AgentWithPoliciesRecord | null>;
}

export function mapPolicyRecords(records: AgentPolicyRecord[]): Policy[] {
  return records.map((p) => ({
    id: p.id,
    type: p.type as Policy['type'],
    parameters: p.parameters as Record<string, unknown>,
    targetActionId: p.targetActionId ?? undefined,
    targetProtocolId: p.targetProtocolId ?? undefined,
  }));
}
