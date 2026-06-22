import { Result, ok, err, WalletState, NetworkMode } from '@stackagent/types';
import { connect } from '@stacks/connect';

export interface ConnectWalletOptions {
  appName: string;
  appIcon: string;
  networkMode?: NetworkMode;
}

/**
 * Initiates the wallet connection flow using @stacks/connect v8 API.
 * Uses the Promise return from connect() directly to get addresses.
 */
export const connectWallet = async (
  options: ConnectWalletOptions
): Promise<Result<WalletState, Error>> => {
  try {
    const mode = options.networkMode || NetworkMode.Mainnet;

    const response = await connect();
    const stxAddressInfo = response.addresses.find(a => a.symbol === 'STX') || response.addresses[0];

    return ok({
      isConnected: true,
      address: stxAddressInfo?.address || '',
      publicKey: stxAddressInfo?.publicKey || '',
      networkMode: mode,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown connection error'));
  }
};

