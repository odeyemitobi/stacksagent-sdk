import { NetworkMode } from '@stackagent/types';

export interface StacksNetworkConfig {
  mode: NetworkMode;
  hiroApiBaseUrl: string;
  treasuryContractId: string;
}

function parseNetworkMode(value: string | undefined): NetworkMode {
  switch (value?.toLowerCase()) {
    case 'mainnet':
      return NetworkMode.Mainnet;
    case 'devnet':
      return NetworkMode.Devnet;
    case 'testnet':
    default:
      return NetworkMode.Testnet;
  }
}

export function getStacksNetworkConfig(): StacksNetworkConfig {
  const mode = parseNetworkMode(process.env.STACKS_NETWORK ?? process.env.NEXT_PUBLIC_STACKS_NETWORK);
  const hiroApiBaseUrl =
    process.env.HIRO_API_BASE_URL ??
    (mode === NetworkMode.Mainnet
      ? 'https://api.hiro.so'
      : mode === NetworkMode.Devnet
        ? 'http://localhost:3999'
        : 'https://api.testnet.hiro.so');

  const treasuryContractId =
    process.env.TREASURY_CONTRACT_ADDRESS ??
    process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS ??
    'ST37H9QBWEG9NEC1Y9MW82YFH8Y4GB3SPTPSN38GG.treasury-vault-v2';

  return { mode, hiroApiBaseUrl, treasuryContractId };
}
