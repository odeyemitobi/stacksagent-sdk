import { create } from 'zustand';
import { WalletState, NetworkMode } from '@stackagent/types';

interface WalletStore extends WalletState {
  setConnection: (state: Partial<WalletState>) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  isConnected: false,
  address: null,
  publicKey: null,
  networkMode: NetworkMode.Mainnet,
  
  setConnection: (state) => set((prev) => ({ ...prev, ...state })),
  disconnect: () => set({
    isConnected: false,
    address: null,
    publicKey: null,
  })
}));
