import { request } from '@stacks/connect';
import { Result, ok, err, NetworkMode } from '@stackagent/types';
import { getNetworkConfig } from './network';

export interface SignContractCallOptions {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: any[];
  networkMode?: NetworkMode;
  postConditions?: any[];
}

export const signContractCall = async (
  options: SignContractCallOptions
): Promise<Result<{ txId: string }, Error>> => {
  const network = getNetworkConfig(options.networkMode || NetworkMode.Mainnet);
  
  try {
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

export const signMessage = async (message: string, networkMode?: NetworkMode): Promise<Result<{ signature: string }, Error>> => {
  const network = getNetworkConfig(networkMode || NetworkMode.Mainnet);
  
  try {
    const result = await request('stx_signMessage', {
      message,
    });
    
    return ok({ signature: (result as any).signature || 'unknown_signature' });
  } catch (error) {
    return err(error instanceof Error ? error : new Error('User cancelled message signature or request failed.'));
  }
};
