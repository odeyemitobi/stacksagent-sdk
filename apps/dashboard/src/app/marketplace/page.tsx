import React from 'react';
import { CloneButton } from './clone-button';

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

// Next.js Server Component
export default async function MarketplacePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  let agents: PublishedAgentDto[] = [];
  let error: string | null = null;

  try {
    const res = await fetch(`${apiUrl}/v1/marketplace/agents`, { 
      cache: 'no-store' // MVP: always fetch fresh list
    });
    
    if (!res.ok) {
      error = 'Failed to load marketplace (API returned an error).';
    } else {
      const data = await res.json();
      agents = data.items || [];
    }
  } catch (err) {
    error = 'Failed to load marketplace (Could not reach API).';
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Marketplace</h1>
        <p className="text-gray-500 mt-2">Discover and clone specialized AI agents built by the community.</p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <p className="text-sm mt-2">Make sure the NestJS API is running on {apiUrl}.</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No agents found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Be the first to publish an agent to the marketplace!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {agent.configPayload.role}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                  {agent.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {agent.configPayload.allowedProtocols?.map(protocol => (
                    <span key={protocol} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {protocol}
                    </span>
                  ))}
                  {(!agent.configPayload.allowedProtocols || agent.configPayload.allowedProtocols.length === 0) && (
                    <span className="text-xs text-gray-400 italic">No protocols required</span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <div className="text-sm text-gray-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {agent.downloads.toLocaleString()}
                  </div>
                  <CloneButton agentId={agent.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
