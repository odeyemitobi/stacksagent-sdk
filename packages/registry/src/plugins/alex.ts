import { IPlugin, Protocol, TransactionPayload } from '@stackagent/types';
import { Result, ok, err } from '@stackagent/types';
import { mockProtocols } from '../data/mock-protocols';

export class AlexPlugin implements IPlugin {
  public readonly protocol: Protocol = mockProtocols.find(p => p.id === 'alex') || mockProtocols[0]!;

  async buildTransaction(intent: any): Promise<Result<TransactionPayload, Error>> {
    try {
      // In a real plugin, this would build a true @stacks/transactions StacksTransactionWire
      // using the intent.parameters. For now, we return a structural mock of the transaction wire
      // but return real stxCallParams for the frontend to sign.

      const amount = intent.parameters?.amount || 0;
      const treasuryAddress = (globalThis as any).process?.env?.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS || 'ST37H9QBWEG9NEC1Y9MW82YFH8Y4GB3SPTPSN38GG.treasury-vault-v2';
      const [contractAddr, contractName] = treasuryAddress.split('.');
      
      // The action contract to pass as the <executor-trait> argument
      const actionContractPrincipal = `${contractAddr}.mock-alex-action`;

      const payload: TransactionPayload = {
        transaction: { serialize: () => new Uint8Array(2) } as any, // Mocked for the demo backend without Buffer
        postConditions: [],
        estimatedFee: 4500, // 0.0045 STX
        humanReadableDiff: [
          { asset: 'STX', amount: amount, direction: 'OUT' },
          { asset: 'ALEX', amount: amount * 0.025, direction: 'IN' }, // Simulated swap rate
        ],
        stxCallParams: {
          contractAddress: contractAddr,
          contractName: contractName,
          functionName: 'execute-approved-intent',
          functionArgs: [actionContractPrincipal], // The principal to cast as <executor-trait>
        }
      };

      return ok(payload);
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to build ALEX transaction'));
    }
  }
}

export const alexPlugin = new AlexPlugin();
