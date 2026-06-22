import { Result, ok, err, NetworkMode } from '@stackagent/types';

export interface SignContractCallOptions {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: any[];
  networkMode?: NetworkMode;
  postConditions?: any[];
}

/**
 * Signs and submits a contract call transaction.
 * Uses dynamic import to avoid Turbopack module factory issues on Vercel.
 */
export const signContractCall = async (
  options: SignContractCallOptions
): Promise<Result<{ txId: string }, Error>> => {
  try {
    const { request } = await import('@stacks/connect');
    const result = await request('stx_callContract', {
      contract: `${options.contractAddress}.${options.contractName}`,
      functionName: options.functionName,
      functionArgs: options.functionArgs,
      postConditions: options.postConditions,
    });
    
    return ok({ txId: (result as any).txid || (result as any).txId || 'unknown_tx_id' });
  } catch (error) {
    return err(error instanceof Error ? error : new Error('User cancelled transaction signature or request failed.'));
  }
};

/**
 * Signs a message using the connected wallet.
 * Uses dynamic import to avoid Turbopack module factory issues on Vercel.
 */
export const signMessage = async (message: string, networkMode?: NetworkMode): Promise<Result<{ signature: string }, Error>> => {
  try {
    const { request } = await import('@stacks/connect');
    const result = await request('stx_signMessage', {
      message,
    });
    
    return ok({ signature: (result as any).signature || 'unknown_signature' });
  } catch (error) {
    return err(error instanceof Error ? error : new Error('User cancelled message signature or request failed.'));
  }
};
