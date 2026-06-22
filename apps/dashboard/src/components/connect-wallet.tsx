'use client';

import React, { useState } from 'react';
import { connect } from '@stacks/connect';
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

    try {
      const response = await connect();
      
      const stxAddressInfo = response.addresses.find(a => a.symbol === 'STX') || response.addresses[0];
      const address = stxAddressInfo?.address || '';
      const publicKey = stxAddressInfo?.publicKey || '';

      setConnection({
        isConnected: true,
        address: address,
        publicKey: publicKey,
        networkMode: 'mainnet' as any,
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

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg transition-colors border border-neutral-700 disabled:opacity-50 cursor-pointer"
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

