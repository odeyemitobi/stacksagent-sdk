import { openContractCall, openSignatureRequestPopup } from '@stacks/connect';
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
  
  return new Promise((resolve) => {
    openContractCall({
      network,
      contractAddress: options.contractAddress,
      contractName: options.contractName,
      functionName: options.functionName,
      functionArgs: options.functionArgs,
      postConditions: options.postConditions,
      onFinish: (data) => {
        resolve(ok({ txId: data.txId }));
      },
      onCancel: () => {
        resolve(err(new Error('User cancelled transaction signature.')));
      },
    });
  });
};

export const signMessage = async (message: string, networkMode?: NetworkMode): Promise<Result<{ signature: string }, Error>> => {
  const network = getNetworkConfig(networkMode || NetworkMode.Mainnet);
  
  return new Promise((resolve) => {
    openSignatureRequestPopup({
      message,
      network,
      onFinish: (data) => {
        resolve(ok({ signature: data.signature }));
      },
      onCancel: () => {
        resolve(err(new Error('User cancelled message signature.')));
      },
    });
  });
};
