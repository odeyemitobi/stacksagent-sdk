import type { StacksTransactionWire, PostCondition } from '@stacks/transactions';
import type { ExecutionIntent, Result } from './index';
import type { StateChangeDiff } from './simulation';

export interface ContractReference {
  address: string;
  contractName: string;
}

export interface RiskProfile {
  auditStatus: 'AUDITED' | 'UNAUDITED' | 'PARTIAL';
  tvlUsd: number;
  ageInDays: number;
  priorIncidents: boolean;
}

export interface ProtocolAction {
  id: string; // e.g., "swap", "stake", "lend"
  name: string;
  description: string;
}

export interface Protocol {
  id: string; // unique identifier, e.g., "alex"
  name: string;
  description: string;
  website: string;
  contracts: Record<string, ContractReference>;
  actions: ProtocolAction[];
  riskProfile: RiskProfile;
}

export interface TransactionPayload {
  transaction: StacksTransactionWire;
  postConditions: PostCondition[];
  /** Fee in micro-STX estimated by the plugin when constructing the transaction. */
  estimatedFee: number;
  /** Human-readable state changes predicted by this transaction — only the plugin knows this. */
  humanReadableDiff: StateChangeDiff[];
  /** Standard parameters to feed into stx_callContract for the frontend */
  stxCallParams?: {
    contractAddress: string;
    contractName: string;
    functionName: string;
    functionArgs: string[]; // Serialized CV as strings or principal addresses
  };
}

export interface IPlugin {
  protocol: Protocol;
  buildTransaction(intent: ExecutionIntent): Promise<Result<TransactionPayload, Error>>;
}

