"use client";

import { motion } from "framer-motion";
import { Terminal, ShieldCheck, Zap, Layers, ChevronRight, Lock } from "lucide-react";

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  return (
    <div className="flex flex-col items-center justify-start w-full relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-500/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="w-full max-w-6xl px-4 pt-32 pb-20 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-medium mb-8"
        >
          <Zap size={14} />
          <span>v0.1.0 MVP Released</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-bold tracking-tighter mb-6"
        >
          Build <span className="text-gradient">Bitcoin AI Agents</span> <br className="hidden md:block" />
          With Confidence
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed"
        >
          The production-grade, open-source infrastructure for AI-powered Bitcoin Finance applications on Stacks. Non-custodial, policy-driven, and seamlessly secure.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <a href="#" className="flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-zinc-200 transition-colors">
            Read Documentation <ChevronRight size={18} />
          </a>
          <a href="#" className="flex items-center justify-center gap-2 glass-panel px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-colors">
            <Terminal size={18} /> View Architecture
          </a>
        </motion.div>
      </section>

      {/* Terminal Mockup */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="w-full max-w-5xl px-4 mb-32"
      >
        <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl glass-panel">
          <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="mx-auto text-xs font-mono text-zinc-400">stackagent-sdk</div>
          </div>
          <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto text-zinc-300">
            <div className="flex gap-4">
              <span className="text-orange-400">const</span>
              <span className="text-blue-300">agent</span>
              <span className="text-zinc-500">=</span>
              <span className="text-purple-300">new</span>
              <span className="text-yellow-200">Agent</span><span>{`({`}</span>
            </div>
            <div className="pl-4 flex gap-4">
              <span className="text-zinc-400">model:</span>
              <span className="text-green-300">'gpt-4o-mini'</span><span>,</span>
            </div>
            <div className="pl-4 flex gap-4">
              <span className="text-zinc-400">wallet:</span>
              <span className="text-yellow-200">clientWallet</span><span>,</span>
            </div>
            <div className="pl-4 flex gap-4">
              <span className="text-zinc-400">policies:</span>
              <span>[</span>
            </div>
            <div className="pl-8 flex gap-4">
              <span className="text-zinc-400">allowlist</span><span>(</span><span className="text-green-300">['alex', 'zest']</span><span>),</span>
            </div>
            <div className="pl-8 flex gap-4">
              <span className="text-zinc-400">spendingLimit</span><span>(</span><span className="text-blue-300">1000</span><span>,</span> <span className="text-green-300">'STX'</span><span>)</span>
            </div>
            <div className="pl-4">]</div>
            <div>{`});`}</div>
            <br />
            <div className="text-zinc-500">{'// Execute a task securely'}</div>
            <div className="flex gap-4">
              <span className="text-purple-300">await</span>
              <span className="text-blue-300">agent</span><span>.</span><span className="text-yellow-200">executeTask</span><span>(</span><span className="text-green-300">"Swap 50 STX for sBTC on ALEX"</span><span>);</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <section id="features" className="w-full max-w-6xl px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise-Grade Architecture</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">Built from the ground up for strict security, composability, and clear developer ergonomics.</p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <motion.div variants={item} className="p-6 rounded-2xl glass-panel group hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Immutable Security Engine</h3>
            <p className="text-zinc-400 leading-relaxed">
              Every LLM execution intent is intercepted and evaluated against strict data-driven policies and spending limits.
            </p>
          </motion.div>

          <motion.div variants={item} className="p-6 rounded-2xl glass-panel group hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">100% Non-Custodial</h3>
            <p className="text-zinc-400 leading-relaxed">
              The framework never stores private keys or seed phrases. All transactions are securely routed to the user's connected wallet.
            </p>
          </motion.div>

          <motion.div variants={item} className="p-6 rounded-2xl glass-panel group hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Protocol Registry</h3>
            <p className="text-zinc-400 leading-relaxed">
              Dynamically discover and integrate Bitcoin DeFi protocols on Stacks with built-in risk profiling and standard interfaces.
            </p>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
