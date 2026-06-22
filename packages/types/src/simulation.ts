import type { PostCondition } from '@stacks/transactions';

export interface StateChangeDiff {
  asset: string;
  amount: number;
  direction: 'IN' | 'OUT';
}

export interface SimulationResult {
  success: boolean;
  predictedFee: number;
  postConditions: PostCondition[];
  humanReadableDiff: StateChangeDiff[];
  rawOutput?: string;
}

