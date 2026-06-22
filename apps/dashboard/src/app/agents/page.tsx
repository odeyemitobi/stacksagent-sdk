'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause, FaCog, FaChartLine, FaChevronDown } from 'react-icons/fa';

// Mock data representing the user's cloned/active agents
interface UserAgent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'paused';
  healthScore: number;
  lastActive: string;
  dailyYield: string;
}

const mockUserAgents: UserAgent[] = [];

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

export default function YourAgentsPage() {
  const [agents, setAgents] = useState<UserAgent[]>(mockUserAgents);
  const [isCreating, setIsCreating] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', role: '', strategy: '' });
  
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const roles = ['Yield Farming', 'Arbitrage', 'Treasury Manager', 'Security Monitor'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleStatus = (agentId: string) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        return { ...agent, status: agent.status === 'active' ? 'paused' : 'active' };
      }
      return agent;
    }));
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.name || !newAgent.role) return;

    const agent: UserAgent = {
      id: `ua-${Date.now()}`,
      name: newAgent.name,
      role: newAgent.role,
      status: 'active',
      healthScore: 100,
      lastActive: 'Just now',
      dailyYield: 'N/A',
    };

    setAgents([agent, ...agents]);
    setIsCreating(false);
    setNewAgent({ name: '', role: '', strategy: '' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 border-b border-white/5 pb-6 flex justify-between items-end"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Your Agents</h1>
          <p className="text-neutral-400 text-lg">Manage and monitor your active autonomous agents.</p>
        </div>
        
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] text-white font-medium rounded-xl transition-all border border-white/10 hover:border-white/20 backdrop-blur-md cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <span className="text-lg leading-none">+</span>
            Create Agent
          </button>
        )}
      </motion.div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create Custom Agent</h2>
            <form onSubmit={handleCreateAgent} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Agent Name</label>
                <input 
                  type="text" 
                  required
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({...newAgent, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-neutral-600"
                  placeholder="e.g. DeFi Maxi Bot"
                />
              </div>
              
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Primary Role</label>
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className={`w-full bg-black/40 border rounded-xl px-4 py-3 text-left transition-all flex justify-between items-center cursor-pointer ${
                    isRoleDropdownOpen ? 'border-white/30 ring-1 ring-white/30' : 'border-white/10'
                  } ${!newAgent.role ? 'text-neutral-600' : 'text-white'}`}
                >
                  {newAgent.role || 'Select a role...'}
                  <motion.div animate={{ rotate: isRoleDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <FaChevronDown className="text-neutral-500 text-xs" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isRoleDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 w-full mt-2 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                      {roles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            setNewAgent({...newAgent, role});
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/[0.06] cursor-pointer ${
                            newAgent.role === role ? 'text-white bg-white/[0.04]' : 'text-neutral-400'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Strategy Prompt (Optional)</label>
                <textarea 
                  value={newAgent.strategy}
                  onChange={(e) => setNewAgent({...newAgent, strategy: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-neutral-600 min-h-[100px] resize-y"
                  placeholder="Describe exactly what this agent should do..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold rounded-xl transition-all cursor-pointer shadow-lg backdrop-blur-md"
                >
                  Deploy Agent
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-3 bg-transparent text-neutral-400 font-medium rounded-xl hover:bg-white/[0.02] hover:text-white transition-colors border border-transparent hover:border-white/5 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {!isCreating && agents.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 bg-white/[0.02] rounded-3xl border border-dashed border-white/10"
        >
          <h3 className="text-xl font-medium text-white">No agents deployed</h3>
          <p className="mt-2 text-neutral-500">Go to the Marketplace to clone your first agent, or create a custom one.</p>
        </motion.div>
      ) : !isCreating && (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {agents.map((agent) => (
            <motion.div 
              variants={item}
              key={agent.id} 
              className={`group relative border rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-sm ${
                agent.status === 'active' 
                  ? 'bg-white/[0.02] border-white/10 hover:border-blue-500/30' 
                  : 'bg-white/[0.01] border-white/5 opacity-75 grayscale-[0.5]'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${
                agent.status === 'active' ? 'from-blue-500/5 to-transparent' : 'from-neutral-500/5 to-transparent'
              }`} />
              
              <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-white tracking-tight">{agent.name}</h3>
                    <p className="text-sm text-neutral-400 mt-1">{agent.role}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide border ${
                    agent.status === 'active' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${agent.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-neutral-400'}`} />
                    {agent.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-black/20 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider font-semibold">Health</p>
                    <p className="text-lg text-white font-mono">{agent.healthScore}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider font-semibold">Daily Yield</p>
                    <p className="text-lg text-green-400 font-mono flex items-center">
                      {agent.dailyYield !== 'N/A' && <FaChartLine className="mr-1 text-xs" />}
                      {agent.dailyYield}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider font-semibold">Last Active</p>
                    <p className="text-sm text-white font-mono mt-1">{agent.lastActive}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer text-neutral-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                  >
                    <FaCog className="text-neutral-500" />
                    Configure
                  </button>
                  <button 
                    onClick={() => toggleStatus(agent.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                      agent.status === 'active' 
                        ? 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border-neutral-700 hover:text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-500 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                    }`}
                  >
                    {agent.status === 'active' ? (
                      <>
                        <FaPause className="text-xs" />
                        Pause Agent
                      </>
                    ) : (
                      <>
                        <FaPlay className="text-xs" />
                        Resume Agent
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
