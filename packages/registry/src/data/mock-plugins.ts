import { Protocol, ExecutionIntent, Result, TransactionPayload, ok } from '@stackagent/types';
import { BasePlugin } from '../plugin';
import { mockProtocols } from './mock-protocols';

/**
 * Mock ALEX plugin for development and testing.
 * Returns structurally valid TransactionPayloads without hitting the real
 * @stacks/transactions contract-call builder (which would require a valid key pair).
 */
class MockAlexPlugin extends BasePlugin {
  public readonly protocol: Protocol = mockProtocols[0]!; // Alex

  public async buildTransaction(intent: ExecutionIntent): Promise<Result<TransactionPayload, Error>> {
    if (intent.actionId !== 'swap') {
      return this.rejectUnsupportedAction(intent.actionId);
    }

    const amount = Number(intent.parameters['amount'] || 0);
    const asset = (intent.parameters['token'] as string | undefined) || 'STX';
    const estimatedFee = 2500; // micro-STX

    return ok({
      // A real plugin would call makeUnsignedContractCall here.
      // The mock uses an empty object cast because no valid key pair is available.
      transaction: {} as TransactionPayload['transaction'],
      postConditions: [],
      estimatedFee,
      humanReadableDiff: amount > 0
        ? [{ asset, amount, direction: 'OUT' as const }]
        : [],
    });
  }
}

/**
 * Mock Zest plugin for development and testing.
 */
class MockZestPlugin extends BasePlugin {
  public readonly protocol: Protocol = mockProtocols[1]!; // Zest

  public async buildTransaction(intent: ExecutionIntent): Promise<Result<TransactionPayload, Error>> {
    if (intent.actionId !== 'lend') {
      return this.rejectUnsupportedAction(intent.actionId);
    }

    const amount = Number(intent.parameters['amount'] || 0);
    const asset = (intent.parameters['token'] as string | undefined) || 'STX';
    const estimatedFee = 3000; // micro-STX

    return ok({
      transaction: {} as TransactionPayload['transaction'],
      postConditions: [],
      estimatedFee,
      humanReadableDiff: amount > 0
        ? [{ asset, amount, direction: 'OUT' as const }]
        : [],
    });
  }
}

export const mockAlexPlugin = new MockAlexPlugin();
export const mockZestPlugin = new MockZestPlugin();

