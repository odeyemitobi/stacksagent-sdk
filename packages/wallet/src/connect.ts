import { connect } from '@stacks/connect';
import { Result, ok, err, WalletState, NetworkMode } from '@stackagent/types';
import { getNetworkConfig } from './network';

export interface ConnectWalletOptions {
  appName: string;
  appIcon: string;
  networkMode?: NetworkMode;
}

/**
 * Initiates the wallet connection flow using @stacks/connect.
 */
export const connectWallet = async (
  options: ConnectWalletOptions
): Promise<Result<WalletState, Error>> => {
  const mode = options.networkMode || NetworkMode.Mainnet;
  
  try {
    // The modern API uses connect() instead of showConnect
    await connect();

    const provider = (window as any).StacksProvider;
    if (!provider) {
       return err(new Error('StacksProvider not found after connection.'));
    }
    
    // Get the address from the provider or the session if available
    // Due to the abstraction, let's keep it simple for MVP.
    return ok({
      isConnected: true,
      address: 'SP_MVP_CONNECTED_ADDRESS', // Placeholder until UserSession is fully integrated
      publicKey: '0x_MVP_PUBKEY',
      networkMode: mode,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown connection error'));
  }
};
