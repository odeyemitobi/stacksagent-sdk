import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { WalletState, NetworkMode } from '@stackagent/types';

interface WalletStore extends WalletState {
  setConnection: (state: Partial<WalletState>) => void;
  disconnect: () => void;
}

const cookieStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=31536000; path=/`;
  },
  removeItem: (name: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; max-age=-1; path=/`;
  },
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() => cookieStorage),
    }
  )
);
