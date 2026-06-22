'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWalletStore } from '../store/wallet-store';
import { ConnectWallet } from './connect-wallet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, 
  FaRobot, 
  FaStore, 
  FaLandmark, 
  FaBars, 
  FaTimes,
  FaSignOutAlt
} from 'react-icons/fa';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isConnected, disconnect } = useWalletStore();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If not connected and on the homepage, render the full-screen landing page layout
  if (!isConnected && pathname === '/') {
    return <>{children}</>;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FaHome },
    { name: 'Your Agents', href: '/agents', icon: FaRobot },
    { name: 'Marketplace', href: '/marketplace', icon: FaStore },
    { name: 'Treasury', href: '/treasury', icon: FaLandmark },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden font-sans">
      <AnimatePresence>
        {/* Mobile sidebar backdrop */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-neutral-950/80 backdrop-blur-xl border-r border-white/5 
        transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:w-64 flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-white/5 justify-between bg-black/20">
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-neutral-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              <div className="w-4 h-4 bg-black rounded-[4px]" />
            </div>
            <span className="font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">StackAgent</span>
          </Link>
          <button 
            className="lg:hidden text-neutral-500 hover:text-white transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <nav className="flex flex-1 flex-col p-4 overflow-y-auto">
          <ul role="list" className="flex flex-col gap-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  {item.disabled ? (
                    <div className="group flex items-center gap-x-3 rounded-xl p-2.5 text-sm font-medium leading-6 text-neutral-600 cursor-not-allowed">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.name}
                      <span className="ml-auto text-[9px] uppercase tracking-widest font-bold border border-white/5 px-2 py-0.5 rounded-full text-neutral-500 bg-white/[0.02]">Soon</span>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        relative group flex items-center gap-x-3 rounded-xl p-2.5 text-sm font-medium leading-6 transition-all duration-300
                        ${isActive 
                          ? 'text-white' 
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                        }
                      `}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="sidebar-active" 
                          className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon 
                        className={`h-4 w-4 shrink-0 transition-colors relative z-10 ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-neutral-500 group-hover:text-neutral-300'}`} 
                        aria-hidden="true" 
                      />
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          
          {isConnected && (
            <div className="mt-auto pt-4 border-t border-white/5">
              <button 
                onClick={disconnect}
                className="w-full group flex items-center gap-x-3 rounded-xl p-2.5 text-sm font-medium leading-6 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
              >
                <FaSignOutAlt className="h-4 w-4 shrink-0 transition-colors group-hover:text-red-400" aria-hidden="true" />
                Disconnect
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-black relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-900 opacity-20 blur-[100px] pointer-events-none" />

        {/* Topbar */}
        <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/5 bg-black/40 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8 justify-between">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-neutral-400 hover:text-white lg:hidden transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <FaBars className="h-5 w-5" aria-hidden="true" />
          </button>
          
          <div className="flex flex-1 justify-end gap-x-4 self-stretch lg:gap-x-6 items-center relative z-10">
            <ConnectWallet />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
