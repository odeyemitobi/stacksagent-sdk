'use client';

import React, { useState } from 'react';
import { connectWallet } from '@stackagent/wallet';
import { useWalletStore } from '../store/wallet-store';
import { FaWallet, FaSpinner } from 'react-icons/fa';
import { NetworkMode } from '@stackagent/types';

const DEFAULT_NETWORK =
  (process.env.NEXT_PUBLIC_STACKS_NETWORK as NetworkMode | undefined) ?? NetworkMode.Testnet;

export const ConnectWallet = () => {
  const { isConnected, address, setConnection } = useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      const result = await connectWallet({
        appName: 'StackAgent SDK',
        appIcon: `${typeof window !== 'undefined' ? window.location.origin : ''}/favicon.ico`,
        networkMode: DEFAULT_NETWORK,
      });

      if (!result.ok) {
        throw result.error;
      }

      setConnection({
        isConnected: true,
        address: result.value.address,
        publicKey: result.value.publicKey,
        networkMode: result.value.networkMode,
      });
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`;
  };

  if (isConnected && address) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white font-medium rounded-lg border border-neutral-700"
        title={address}
        aria-label={`Connected wallet ${address}`}
      >
        <FaWallet className="text-green-400" aria-hidden="true" />
        <span className="font-mono text-sm">{formatAddress(address)}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg transition-colors border border-neutral-700 disabled:opacity-50 cursor-pointer"
    >
      {isConnecting ? (
        <FaSpinner className="animate-spin" aria-hidden="true" />
      ) : (
        <FaWallet aria-hidden="true" />
      )}
      <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
    </button>
  );
};
