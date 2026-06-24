'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useWalletStore } from '../store/wallet-store';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ApiAgent, fetchJson, PendingExecutionsResponse } from '@/lib/api';
import { fetchWalletStxBalance, formatStxAmount } from '@/lib/stacks-api';

const ConnectWallet = dynamic(() => import('@/components/connect-wallet').then(mod => mod.ConnectWallet), {
  ssr: false,
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Home() {
  const { isConnected, address, networkMode } = useWalletStore();
  const [agentCount, setAgentCount] = useState(0);
  const [runningCount, setRunningCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [stxBalanceMicro, setStxBalanceMicro] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState(false);

  const networkLabel =
    (networkMode ?? process.env.NEXT_PUBLIC_STACKS_NETWORK ?? 'testnet').toUpperCase();

  useEffect(() => {
    if (!isConnected) return;

    async function loadStats() {
      try {
        const [agents, pending] = await Promise.all([
          fetchJson<ApiAgent[]>('/v1/agents'),
          fetchJson<PendingExecutionsResponse>('/v1/executions/pending'),
        ]);
        setAgentCount(agents.length);
        setRunningCount(agents.filter((a) => a.status === 'RUNNING' || a.status === 'IDLE').length);
        setPendingCount(pending.items?.length ?? 0);
      } catch {
        setAgentCount(0);
        setRunningCount(0);
        setPendingCount(0);
      }
    }

    loadStats();
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected || !address) {
      setStxBalanceMicro(null);
      setBalanceError(false);
      return;
    }

    let cancelled = false;

    async function loadBalance() {
      if (!address) return;

      setBalanceLoading(true);
      setBalanceError(false);

      try {
        const microStx = await fetchWalletStxBalance(address, networkMode);
        if (cancelled) return;

        if (microStx === null) {
          setBalanceError(true);
          setStxBalanceMicro(null);
        } else {
          setStxBalanceMicro(microStx);
        }
      } catch {
        if (!cancelled) {
          setBalanceError(true);
          setStxBalanceMicro(null);
        }
      } finally {
        if (!cancelled) {
          setBalanceLoading(false);
        }
      }
    }

    loadBalance();

    return () => {
      cancelled = true;
    };
  }, [isConnected, address, networkMode]);

  if (isConnected) {
    return (
      <div className="p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Dashboard Overview</h1>
          <p className="text-neutral-400 text-lg">Welcome back. Manage your agents and institutional treasury.</p>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-3 mb-8"
        >
          <motion.div variants={item} className="relative group overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-neutral-400">Wallet Balance</h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                {networkLabel}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              {balanceLoading ? (
                <span className="text-4xl font-bold tracking-tight text-neutral-500 font-mono">—</span>
              ) : balanceError || stxBalanceMicro === null ? (
                <span className="text-lg font-medium text-neutral-400">Unable to load balance</span>
              ) : (
                <>
                  <span className="text-4xl font-bold tracking-tight text-white font-mono">
                    {formatStxAmount(stxBalanceMicro)}
                  </span>
                  <span className="text-lg text-blue-400 font-semibold font-mono">STX</span>
                </>
              )}
            </div>
            <div className="mt-4 text-xs text-neutral-500 font-mono truncate">
              {address ?? 'No address'}
            </div>
          </motion.div>

          <motion.div variants={item} className="relative group overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h3 className="text-sm font-medium text-neutral-400 mb-2">Active Agents</h3>
            <div className="text-4xl font-bold tracking-tight text-white font-mono">{agentCount}</div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {runningCount} active
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="relative group overflow-hidden rounded-2xl border border-yellow-500/30 bg-black/40 p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(234,179,8,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent" />
            <h3 className="text-sm font-medium text-yellow-500/80 mb-2">Pending Approvals</h3>
            <div className="text-4xl font-bold tracking-tight text-yellow-500 font-mono">{pendingCount}</div>
            <div className="mt-4">
              <Link href="/treasury" className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1">
                {pendingCount > 0 ? 'Requires your signature' : 'Treasury queue clear'} <span>→</span>
              </Link>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2"
        >
          <motion.div variants={item} className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-semibold text-lg text-white">Quick Actions</h3>
            </div>
            <div className="p-6 grid gap-4 flex-1">
              <Link href="/marketplace" className="group relative overflow-hidden flex items-center justify-between p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="font-medium text-white group-hover:text-blue-400 transition-colors mb-1">Deploy New Agent</div>
                  <div className="text-sm text-neutral-400">Browse the community marketplace</div>
                </div>
                <div className="relative z-10 text-neutral-600 group-hover:text-white group-hover:translate-x-1 transition-all">→</div>
              </Link>
              
              <Link href="/treasury" className="group relative overflow-hidden flex items-center justify-between p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-yellow-500/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="font-medium text-white group-hover:text-yellow-400 transition-colors mb-1">Review Treasury Queue</div>
                  <div className="text-sm text-neutral-400">Sign off on high-value executions</div>
                </div>
                <div className="relative z-10 text-neutral-600 group-hover:text-white group-hover:translate-x-1 transition-all">→</div>
              </Link>
            </div>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <h3 className="font-semibold text-lg text-white">Getting Started</h3>
            </div>
            <div className="p-6 flex-1 text-sm text-neutral-400 space-y-3">
              <p>1. Clone an agent from the Marketplace or create one under Your Agents.</p>
              <p>2. Run <code className="text-neutral-300 font-mono text-xs">pnpm --filter api seed</code> to populate a demo treasury approval.</p>
              <p>3. Open Treasury to review simulated outcomes and sign with your Stacks wallet.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Logged-out Landing Page State
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24 bg-black text-white relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-6xl items-center justify-between text-sm lg:flex"
      >
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-white/10 bg-black/50 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-2xl lg:border lg:bg-white/[0.03] lg:px-6 lg:py-3 shadow-2xl">
          <span className="font-bold mr-2 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">StackAgent SDK</span> 
          <span className="text-neutral-500 font-mono">v1.0.0</span>
        </p>
      </motion.div>

      <div className="relative flex flex-col items-center text-center max-w-4xl mt-24 lg:mt-0 z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-8 bg-gradient-to-br from-white via-white to-neutral-500 bg-clip-text text-transparent drop-shadow-sm"
        >
          Build Bitcoin DeFi.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          The standard infrastructure layer for AI-powered Bitcoin Finance applications on Stacks. Deploy autonomous agents, manage institutional treasuries, and automate yield.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex items-center gap-4 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
        >
          <ConnectWallet />
        </motion.div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-32 grid text-center lg:max-w-6xl lg:w-full lg:grid-cols-3 lg:text-left gap-6 z-10"
      >
        <motion.div variants={item} className="group relative rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.04] backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="mb-4 text-2xl font-bold text-white relative z-10">
            Agents <span className="inline-block transition-transform duration-300 group-hover:translate-x-2 motion-reduce:transform-none text-neutral-500 group-hover:text-blue-400">→</span>
          </h2>
          <p className="m-0 text-sm text-neutral-400 leading-relaxed relative z-10">
            Deploy autonomous AI agents that manage treasury and execute complex yield strategies on-chain with precision.
          </p>
        </motion.div>
        
        <motion.div variants={item} className="group relative rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.04] backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="mb-4 text-2xl font-bold text-white relative z-10">
            Security <span className="inline-block transition-transform duration-300 group-hover:translate-x-2 motion-reduce:transform-none text-neutral-500 group-hover:text-purple-400">→</span>
          </h2>
          <p className="m-0 text-sm text-neutral-400 leading-relaxed relative z-10">
            Enterprise-grade policy engine. Simulate every transaction before signing to prevent malicious execution and minimize risk.
          </p>
        </motion.div>
        
        <motion.div variants={item} className="group relative rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.04] backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="mb-4 text-2xl font-bold text-white relative z-10">
            Marketplace <span className="inline-block transition-transform duration-300 group-hover:translate-x-2 motion-reduce:transform-none text-neutral-500 group-hover:text-orange-400">→</span>
          </h2>
          <p className="m-0 text-sm text-neutral-400 leading-relaxed relative z-10">
            Discover and clone specialized agents built by the community to accelerate your customized DeFi operations.
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
