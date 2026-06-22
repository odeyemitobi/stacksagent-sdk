'use client';

import React, { useState, useEffect } from 'react';
import { CloneButton } from './clone-button';
import { motion } from 'framer-motion';

// Using types mapped from API
interface PublishedAgentDto {
  id: string;
  authorId: string;
  name: string;
  description: string;
  configPayload: {
    role: string;
    allowedProtocols?: string[];
  };
  downloads: number;
}

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

export default function MarketplacePage() {
  const [agents, setAgents] = useState<PublishedAgentDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAgents() {
      setIsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      try {
        const res = await fetch(`${apiUrl}/v1/marketplace/agents`, { 
          cache: 'no-store' 
        });
        
        if (!res.ok) {
          throw new Error('API returned an error');
        }
        
        const data = await res.json();
        setAgents(data.items || []);
      } catch (err) {
        console.error('Failed to load marketplace from API:', err);
        setAgents([]);
        // We could set an explicit error state here, but clearing the agents 
        // will show the empty state natively.
      } finally {
        setIsLoading(false);
      }
    }

    loadAgents();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 border-b border-white/5 pb-6"
      >
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Agent Marketplace</h1>
        <p className="text-neutral-400 text-lg">Discover and clone specialized AI agents built by the community.</p>
      </motion.div>

      {error ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl" 
          role="alert"
        >
          <strong className="font-bold block mb-1">Error Loading Marketplace</strong>
          <span className="block mb-2">{error}</span>
          <p className="text-sm opacity-80 font-mono">Make sure the NestJS API is running locally.</p>
        </motion.div>
      ) : agents.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 bg-white/[0.02] rounded-3xl border border-dashed border-white/10"
        >
          <h3 className="text-xl font-medium text-white">No agents found</h3>
          <p className="mt-2 text-neutral-500">Be the first to publish an agent to the marketplace!</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {agents.map((agent) => (
            <motion.div 
              variants={item}
              key={agent.id} 
              className="group relative bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-500 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="p-8 h-full flex flex-col relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-semibold text-white tracking-tight">{agent.name}</h3>
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-blue-400 border border-blue-500/20">
                    {agent.configPayload.role}
                  </span>
                </div>
                
                <p className="text-sm text-neutral-400 mb-8 flex-grow leading-relaxed">
                  {agent.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {agent.configPayload.allowedProtocols?.map((protocol: string) => (
                    <span key={protocol} className="inline-flex items-center rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 border border-white/10 shadow-sm font-mono">
                      {protocol}
                    </span>
                  ))}
                  {(!agent.configPayload.allowedProtocols || agent.configPayload.allowedProtocols.length === 0) && (
                    <span className="text-xs text-neutral-600 italic px-1">No protocol dependencies</span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                  <div className="text-sm text-neutral-500 flex items-center font-mono">
                    <svg className="w-4 h-4 mr-1.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {agent.downloads.toLocaleString()}
                  </div>
                  <CloneButton agentId={agent.id} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
