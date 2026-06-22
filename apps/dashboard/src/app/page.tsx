'use client';

import dynamic from 'next/dynamic';

const ConnectWallet = dynamic(() => import('@/components/connect-wallet').then(mod => mod.ConnectWallet), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-black text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-neutral-800 bg-gradient-to-b from-zinc-900 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-neutral-900 lg:p-4">
          StackAgent SDK
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-black via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <ConnectWallet />
        </div>
      </div>

      <div className="relative flex place-items-center">
        <h1 className="text-6xl font-bold tracking-tighter sm:text-7xl">
          Build Bitcoin DeFi.
        </h1>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left text-neutral-400">
        <a
          href="#"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-neutral-700 hover:bg-neutral-800/30"
        >
          <h2 className="mb-3 text-2xl font-semibold text-neutral-200">
            Agents <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Deploy autonomous agents that manage treasury and execute yield strategies.
          </p>
        </a>
      </div>
    </main>
  );
}
