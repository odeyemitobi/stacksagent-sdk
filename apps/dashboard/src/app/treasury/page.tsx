import React from 'react';
import { ApproveButton } from './approve-button';

// Next.js Server Component
export default async function TreasuryPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  let pendingExecutions: any[] = [];
  let error: string | null = null;

  try {
    const res = await fetch(`${apiUrl}/v1/executions/pending`, { 
      cache: 'no-store' // Always fetch fresh queue
    });
    
    if (!res.ok) {
      error = 'Failed to load treasury queue (API returned an error).';
    } else {
      pendingExecutions = await res.json();
    }
  } catch (err) {
    error = 'Failed to load treasury queue (Could not reach API).';
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Institutional Treasury
          </h1>
          <p className="text-gray-500 mt-2">Review and sign off on high-value autonomous agent executions.</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center rounded-md bg-yellow-50 px-2.5 py-1.5 text-sm font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
            {pendingExecutions.length} Pending Approvals
          </span>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <p className="text-sm mt-2">Make sure the NestJS API is running on {apiUrl}.</p>
        </div>
      ) : pendingExecutions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">All caught up</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">There are no agent executions awaiting your signature.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {pendingExecutions.map((exec) => (
            <div key={exec.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
              <div className="p-6 flex-grow border-b md:border-b-0 md:border-r border-gray-100 dark:border-zinc-800">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
                    {exec.agent?.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{exec.agent?.name || 'Unknown Agent'}</h3>
                    <p className="text-sm text-gray-500">{exec.agent?.role || 'Autonomous Actor'}</p>
                  </div>
                  <span className="ml-auto inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                    Awaiting Signature
                  </span>
                </div>
                
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 font-mono text-sm text-gray-800 dark:text-gray-300">
                  <div className="mb-2"><strong className="text-gray-900 dark:text-white">Action:</strong> {exec.intentPayload?.actionId} on {exec.intentPayload?.protocolId}</div>
                  <div className="mb-2"><strong className="text-gray-900 dark:text-white">Amount:</strong> {exec.intentPayload?.parameters?.amount || 'N/A'} STX</div>
                  
                  {exec.simulationResult && exec.simulationResult.predictedBalanceChanges && (
                    <div className="mt-4 border-t border-gray-200 dark:border-zinc-700 pt-3">
                      <strong className="text-gray-900 dark:text-white flex items-center text-xs mb-2 uppercase tracking-wide">
                        <svg className="w-3 h-3 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                        Simulated Outcome
                      </strong>
                      <div className="bg-zinc-900 text-green-400 p-2 rounded text-xs overflow-x-auto">
                        <pre>{JSON.stringify(exec.simulationResult.predictedBalanceChanges, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 border-t border-gray-200 dark:border-zinc-700 pt-2 text-xs text-gray-500 flex justify-between">
                    <span>Policy Trigger: Threshold Exceeded</span>
                    {exec.simulationResult && <span>Fee: {exec.simulationResult.estimatedFee}</span>}
                  </div>
                </div>
              </div>
              
              <div className="p-6 md:w-64 bg-gray-50 dark:bg-zinc-800/20 flex flex-col justify-center items-center">
                <div className="text-sm text-gray-500 mb-4 text-center">
                  Review the execution intent carefully. Signing this will broadcast the transaction to the Stacks network.
                </div>
                <ApproveButton 
                  executionId={exec.id} 
                  intentPayload={exec.intentPayload} 
                  simulationResult={exec.simulationResult} 
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
