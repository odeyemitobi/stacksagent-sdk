'use client';

import React, { useState } from 'react';
// In a real app we'd use the wallet package, but since we're in the Next.js app 
// and @stackagent/wallet is a workspace package, we can import it directly.
// For MVP, we'll just simulate a successful Stacks wallet signature if it's not fully setup.
import { signContractCall } from '@stackagent/wallet';
import { NetworkMode } from '@stackagent/types';
import { useWalletStore } from '../../store/wallet-store';

interface ApproveButtonProps {
  executionId: string;
  intentPayload: any;
  simulationResult?: any;
}

export function ApproveButton({ executionId, intentPayload, simulationResult }: ApproveButtonProps) {
  const [approving, setApproving] = useState<boolean>(false);
  const { address } = useWalletStore();

  const handleApprove = async () => {
    setApproving(true);
    try {
      let txId: string;
      
      try {
         // Use stxCallParams from simulation result if available (produced by registry plugins).
         // This is the real pipeline: Registry Plugin → Backend → Frontend → Wallet.
         const callParams = simulationResult?.stxCallParams;

         let contractAddr: string;
         let contractName: string;
         let functionName: string;
         let functionArgs: string[];

         if (callParams) {
           contractAddr = callParams.contractAddress;
           contractName = callParams.contractName;
           functionName = callParams.functionName;
           functionArgs = callParams.functionArgs || [];
         } else {
           // Fallback: use env var for simple transfer-stx calls
           const fullContractId = process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS || 'ST37H9QBWEG9NEC1Y9MW82YFH8Y4GB3SPTPSN38GG.treasury-vault';
           const parts = fullContractId.split('.');
           contractAddr = parts[0];
           contractName = parts[1];
           functionName = 'transfer-stx';
           functionArgs = [];
         }
         
         const res = await signContractCall({
           contractAddress: contractAddr,
           contractName: contractName,
           functionName: functionName,
           functionArgs: functionArgs,
           postConditions: simulationResult?.postConditions || [],
           networkMode: NetworkMode.Testnet,
         });
         
         if (res.ok) {
           txId = res.value.txId;
         } else {
           throw res.error;
         }
      } catch (walletErr) {
         console.error('Wallet signature failed or was cancelled:', walletErr);
         alert('Wallet signature failed or was cancelled. Cannot approve execution.');
         return; // DO NOT fallback to mock. Halt the process.
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
          approverId: address || 'unknown_address'
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
      className="inline-flex justify-center items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto cursor-pointer"
    >
      {approving ? 'Waiting for Signature...' : 'Approve & Sign'}
    </button>
  );
}
