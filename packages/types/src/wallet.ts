/**
 * Supported Stacks network modes.
 */
export enum NetworkMode {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Devnet = 'devnet',
}

/**
 * State of the connected wallet.
 */
export interface WalletState {
  /**
   * Whether the wallet is currently connected.
   */
  isConnected: boolean;
  /**
   * The Stacks address for the current network.
   */
  address: string | null;
  /**
   * The public key of the connected account.
   */
  publicKey: string | null;
  /**
   * The network mode the wallet is currently operating on.
   */
  networkMode: NetworkMode;
}
