import { ExecutionIntent } from './execution';
import { PolicyEvaluation } from './security';
import { SimulationResult } from './simulation';

export type AuditOutcome =
  | 'PENDING'
  | 'REJECTED_BY_POLICY'
  | 'SIMULATION_FAILED'
  | 'USER_REJECTED'
  | 'BROADCASTED';

export interface AuditLog {
  id: string;
  actorId: string;
  intent: ExecutionIntent;
  policyEvaluation?: PolicyEvaluation;
  simulationResult?: SimulationResult;
  outcome: AuditOutcome;
  timestamp: string;
}
