'use client';

import React, { useState, useEffect } from 'react';
import { ApproveButton } from './approve-button';
import { motion } from 'framer-motion';
import { fetchJson, PendingExecutionsResponse, formatApiError } from '@/lib/api';

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

export default function TreasuryPage() {
  const [pendingExecutions, setPendingExecutions] = useState<PendingExecutionsResponse['items']>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTreasury() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchJson<PendingExecutionsResponse>('/v1/executions/pending');
        setPendingExecutions(data.items ?? []);
      } catch (err) {
        setError(formatApiError(err));
        setPendingExecutions([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadTreasury();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-yellow-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 border-b border-white/5 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 flex items-center">
            <svg className="w-8 h-8 mr-3 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Institutional Treasury
          </h1>
          <p className="text-neutral-400 text-lg">Review and sign off on high-value autonomous agent executions.</p>
        </div>
        <div>
          <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
            {pendingExecutions.length} Pending Approvals
          </span>
        </div>
      </motion.div>

      {error ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl" 
          role="alert"
        >
          <strong className="font-bold block mb-1">Error Loading Treasury Queue</strong>
          <span className="block mb-2">{error}</span>
          <p className="text-sm opacity-80 font-mono">
            Ensure PostgreSQL is running (<code>docker compose up -d</code>) and the API is started (
            <code>pnpm --filter api start:dev</code>).
          </p>
        </motion.div>
      ) : pendingExecutions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 bg-white/[0.02] rounded-3xl border border-dashed border-white/10"
        >
          <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white">All caught up</h3>
          <p className="mt-2 text-neutral-500">There are no agent executions awaiting your signature.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6"
        >
          {pendingExecutions.map((exec) => (
            <motion.div 
              variants={item}
              key={exec.id} 
              className="group relative bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden flex flex-col md:flex-row hover:border-yellow-500/30 transition-all duration-500 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="p-8 flex-grow border-b md:border-b-0 md:border-r border-white/5 relative z-10">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-white font-bold text-xl mr-4 border border-white/10 shadow-inner">
                    {exec.agent?.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white tracking-tight">{exec.agent?.name || 'Unknown Agent'}</h3>
                    <p className="text-sm text-neutral-400">{exec.agent?.role || 'Autonomous Actor'}</p>
                  </div>
                  <span className="ml-auto inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-red-400 border border-red-500/20 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2" />
                    Awaiting Signature
                  </span>
                </div>
                
                <div className="bg-black/40 rounded-xl p-5 font-mono text-sm text-neutral-300 border border-white/5">
                  <div className="mb-3 flex flex-wrap gap-x-6 gap-y-2">
                    <div>
                      <span className="text-neutral-500 block text-xs uppercase tracking-wider mb-1">Action</span>
                      <span className="text-white font-semibold">{exec.intentPayload?.actionId}</span> on <span className="text-blue-400">{exec.intentPayload?.protocolId}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-xs uppercase tracking-wider mb-1">Amount</span>
                      <span className="text-white font-semibold">{exec.intentPayload?.parameters?.amount?.toLocaleString() || 'N/A'}</span> <span className="text-neutral-400">STX</span>
                    </div>
                  </div>
                  
                  {exec.simulationResult?.humanReadableDiff && exec.simulationResult.humanReadableDiff.length > 0 && (
                    <div className="mt-5 border-t border-white/5 pt-4">
                      <strong className="text-white flex items-center text-xs mb-3 uppercase tracking-wider">
                        Simulated Outcome
                      </strong>
                      <div className="bg-[#0a0a0a] text-green-400 p-4 rounded-lg text-xs overflow-x-auto border border-white/5 shadow-inner">
                        <pre className="!bg-transparent !p-0 !m-0">{JSON.stringify(exec.simulationResult.humanReadableDiff, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 border-t border-white/5 pt-3 text-xs text-neutral-500 flex justify-between items-center">
                    <span className="inline-flex items-center gap-1.5">
                      Policy: Threshold Exceeded
                    </span>
                    {exec.simulationResult && <span>Fee: <span className="text-white">{exec.simulationResult.predictedFee}</span> microSTX</span>}
                  </div>
                </div>
              </div>
              
              <div className="p-8 md:w-72 bg-black/20 flex flex-col justify-center items-center relative z-10 border-l border-white/5">
                <div className="text-sm text-neutral-400 mb-6 text-center leading-relaxed">
                  Review the execution intent carefully. Signing this will broadcast the transaction to the <strong className="text-white">Stacks network</strong>.
                </div>
                <div className="w-full">
                  <ApproveButton 
                    executionId={exec.id} 
                    simulationResult={exec.simulationResult} 
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
