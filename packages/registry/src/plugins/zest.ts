import { IPlugin, Protocol, TransactionPayload } from '@stackagent/types';
import { Result, ok, err } from '@stackagent/types';
import { mockProtocols } from '../data/mock-protocols';

export class ZestPlugin implements IPlugin {
  public readonly protocol: Protocol = mockProtocols.find(p => p.id === 'zest') || mockProtocols[1]!;

  async buildTransaction(intent: any): Promise<Result<TransactionPayload, Error>> {
    try {
      const amount = intent.parameters?.amount || 0;
      const treasuryAddress = (globalThis as any).process?.env?.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS || 'ST37H9QBWEG9NEC1Y9MW82YFH8Y4GB3SPTPSN38GG.treasury-vault-v2';
      const [contractAddr, contractName] = treasuryAddress.split('.');
      
      // We haven't built a mock-zest-action yet in clarinet, but we can reuse the alex one for the MVP simulation,
      // or specify a zest one assuming it exists in the future.
      const actionContractPrincipal = `${contractAddr}.mock-alex-action`; // Placeholder

      const payload: TransactionPayload = {
        transaction: { serialize: () => new Uint8Array(2) } as any,
        postConditions: [],
        estimatedFee: 6000, 
        humanReadableDiff: [
          { asset: 'STX', amount: amount, direction: 'OUT' },
          { asset: 'stSTX', amount: amount * 0.98, direction: 'IN' },
        ],
        stxCallParams: {
          contractAddress: contractAddr,
          contractName: contractName,
          functionName: 'execute-approved-intent',
          functionArgs: [actionContractPrincipal], 
        }
      };

      return ok(payload);
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to build Zest transaction'));
    }
  }
}

export const zestPlugin = new ZestPlugin();
