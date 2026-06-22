import { showConnect } from '@stacks/connect';
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
  
  return new Promise((resolve) => {
    showConnect({
      appDetails: {
        name: options.appName,
        icon: options.appIcon,
      },
      onFinish: () => {
        // The user successfully connected. We can extract details from the window provider.
        try {
          const userSession = (window as any).StacksProvider?.authenticationRequest;
          const addresses = (window as any).StacksProvider?.productInfo?.addresses;
          // Note: In a real app, you would use @stacks/connect UserSession
          // but we abstract it here to keep dependencies light and decoupled.
          
          const provider = (window as any).StacksProvider;
          if (!provider) {
             resolve(err(new Error('StacksProvider not found after connection.')));
             return;
          }
          
          // Get the address from the provider or the session if available
          // For Stacks connect, after finish, addresses are available or we can query them.
          // Due to the abstraction, let's keep it simple for MVP.
          resolve(ok({
            isConnected: true,
            address: 'SP_MVP_CONNECTED_ADDRESS', // Placeholder until UserSession is fully integrated
            publicKey: '0x_MVP_PUBKEY',
            networkMode: mode,
          }));
        } catch (e) {
          resolve(err(e instanceof Error ? e : new Error('Unknown connection error')));
        }
      },
      onCancel: () => {
        resolve(err(new Error('User cancelled wallet connection.')));
      },
    });
  });
};
