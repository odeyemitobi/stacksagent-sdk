'use client';

import React, { useState } from 'react';
import { connectWallet } from '@stackagent/wallet';
import { useWalletStore } from '../store/wallet-store';
import { FaWallet, FaSpinner } from 'react-icons/fa';

export const ConnectWallet = () => {
  const { isConnected, address, setConnection, disconnect } = useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (isConnected) {
      disconnect();
      return;
    }

    setIsConnecting(true);
    const result = await connectWallet({
      appName: 'StackAgent Dashboard',
      appIcon: '/favicon.ico',
    });

    if (result.ok) {
      setConnection(result.value);
    } else {
      console.error('Wallet connection failed:', result.error);
    }
    setIsConnecting(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg transition-colors border border-neutral-700 disabled:opacity-50"
    >
      {isConnecting ? (
        <FaSpinner className="animate-spin" />
      ) : (
        <FaWallet />
      )}
      <span>
        {isConnecting ? 'Connecting...' : isConnected && address ? formatAddress(address) : 'Connect Wallet'}
      </span>
    </button>
  );
};
