import { STACKS_MAINNET, STACKS_TESTNET, STACKS_MOCKNET } from '@stacks/network';
import { NetworkMode } from '@stackagent/types';

/**
 * Returns the Stacks network configuration based on the provided mode.
 * Throws an error if an invalid mode is provided.
 */
export const getNetworkConfig = (mode: NetworkMode) => {
  switch (mode) {
    case NetworkMode.Mainnet:
      return STACKS_MAINNET;
    case NetworkMode.Testnet:
      return STACKS_TESTNET;
    case NetworkMode.Devnet:
      return STACKS_MOCKNET;
    default:
      const _exhaustiveCheck: never = mode;
      throw new Error(`Unsupported network mode: ${_exhaustiveCheck}`);
  }
};
