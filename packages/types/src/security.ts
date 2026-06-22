export type PolicyType = 'ALLOWLIST' | 'DENYLIST' | 'SPENDING_LIMIT' | 'TIME_WINDOW' | 'APPROVAL_THRESHOLD';

export interface Policy {
  id: string;
  type: PolicyType;
  targetActionId?: string; // e.g., "swap" (if undefined, applies globally)
  targetProtocolId?: string; // e.g., "alex" (if undefined, applies globally)
  parameters: Record<string, unknown>; // Data-driven config
}

export interface PolicyEvaluation {
  passed: boolean;
  reason?: string;
  failedPolicyId?: string;
  requiresApproval?: boolean;
}
