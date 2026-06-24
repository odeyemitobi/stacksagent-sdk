const MICRO_STX_PER_STX = 1_000_000;

export function getHiroApiBaseUrl(network?: string): string {
  switch (network?.toLowerCase()) {
    case 'mainnet':
      return 'https://api.mainnet.hiro.so';
    case 'devnet':
      return 'http://localhost:3999';
    default:
      return 'https://api.testnet.hiro.so';
  }
}

export function formatStxAmount(microStx: number): string {
  const stx = microStx / MICRO_STX_PER_STX;
  return stx.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** Fetches the connected wallet's STX balance from the Hiro API. */
export async function fetchWalletStxBalance(
  address: string,
  network?: string,
): Promise<number | null> {
  const baseUrl = getHiroApiBaseUrl(network ?? process.env.NEXT_PUBLIC_STACKS_NETWORK);
  const response = await fetch(`${baseUrl}/extended/v1/address/${address}/stx`);

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { balance?: string };
  const microStx = Number(data.balance ?? 0);

  if (Number.isNaN(microStx)) {
    return null;
  }

  return microStx;
}
