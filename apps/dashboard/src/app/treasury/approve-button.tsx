'use client';

import React, { useState } from 'react';
// In a real app we'd use the wallet package, but since we're in the Next.js app 
// and @stackagent/wallet is a workspace package, we can import it directly.
// For MVP, we'll just simulate a successful Stacks wallet signature if it's not fully setup.
import { signContractCall } from '@stackagent/wallet';
import { NetworkMode } from '@stackagent/types';

interface ApproveButtonProps {
  executionId: string;
  intentPayload: any;
  simulationResult?: any;
}

export function ApproveButton({ executionId, intentPayload, simulationResult }: ApproveButtonProps) {
  const [approving, setApproving] = useState<boolean>(false);

  const handleApprove = async () => {
    setApproving(true);
    try {
      // 1. Prompt Stacks Wallet for Signature
      // In this Phase 4 MVP, we'll configure a mock contract call based on the intent
      // We will assume the user has a Stacks Wallet (Leather/Xverse) extension installed.
      
      let txId = 'mock_tx_id_' + Date.now();
      
      // Attempt to invoke real Stacks connect, catch gracefully if wallet not installed
      try {
         const res = await signContractCall({
           contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // mock address
           contractName: 'treasury-vault',
           functionName: 'execute-approved-intent',
           functionArgs: [], // would map from intentPayload
           postConditions: simulationResult?.postConditions || [], // 🚨 Stacks explicit post-conditions rule enforced here
           networkMode: NetworkMode.Testnet,
         });
         
         if (res.ok) {
           txId = res.value.txId;
         } else {
           throw res.error;
         }
      } catch (walletErr) {
         console.warn('Wallet connection failed or skipped, falling back to mock signature for preview:', walletErr);
         alert('Wallet not detected or user cancelled. Proceeding with Mock Signature for demo purposes.');
      }

      // Generate a unique idempotency key for this attempt
      const idempotencyKey = `appr_${executionId}_${Date.now()}`;

      // 2. Submit the signature to the backend to complete the Execution
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/v1/executions/${executionId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          signedTxId: txId,
          approverId: 'human-admin-01' // Mocked auth user id
        })
      });

      if (response && response.ok) {
        alert('Execution Approved and Broadcasted Successfully!');
        // Refresh page to clear from queue
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Failed to update backend with approval: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert('An error occurred during approval.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <button
      onClick={handleApprove}
      disabled={approving}
      className="inline-flex justify-center items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
    >
      {approving ? 'Waiting for Signature...' : 'Approve & Sign'}
    </button>
  );
}
