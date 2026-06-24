'use client';

import React, { useState } from 'react';
import { signContractCall } from '@stackagent/wallet';
import { NetworkMode } from '@stackagent/types';
import { useWalletStore } from '../../store/wallet-store';
import { fetchJson, SimulationResultPayload } from '@/lib/api';

interface ApproveButtonProps {
  executionId: string;
  simulationResult?: SimulationResultPayload;
}

export function ApproveButton({ executionId, simulationResult }: ApproveButtonProps) {
  const [approving, setApproving] = useState<boolean>(false);
  const { address, networkMode } = useWalletStore();

  const stacksNetwork =
    networkMode ??
    (process.env.NEXT_PUBLIC_STACKS_NETWORK as NetworkMode | undefined) ??
    NetworkMode.Testnet;

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
           const fullContractId = process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS || 'ST37H9QBWEG9NEC1Y9MW82YFH8Y4GB3SPTPSN38GG.treasury-vault-v2';
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
           networkMode: stacksNetwork,
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

      await fetchJson<{ success: boolean; status: string }>(`/v1/executions/${executionId}/approve`, {
        method: 'PATCH',
        headers: {
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          signedTxId: txId,
          approverId: address || 'unknown_address',
        }),
      });

      alert('Execution Approved and Broadcasted Successfully!');
      window.location.reload();
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
