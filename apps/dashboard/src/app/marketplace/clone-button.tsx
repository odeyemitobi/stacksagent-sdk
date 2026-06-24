'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CloneButtonProps {
  agentId: string;
}

export function CloneButton({ agentId }: CloneButtonProps) {
  const [cloning, setCloning] = useState<boolean>(false);
  const router = useRouter();

  const handleClone = async () => {
    setCloning(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/v1/marketplace/agents/${agentId}/clone`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = (await res.json()) as { newAgentId?: string };
        router.push('/agents');
        if (data.newAgentId) {
          router.refresh();
        }
      } else {
        alert('Failed to clone agent.');
      }
    } catch {
      alert('Failed to clone agent. Is the API running?');
    } finally {
      setCloning(false);
    }
  };

  return (
    <button
      onClick={handleClone}
      disabled={cloning}
      className="inline-flex justify-center items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
    >
      {cloning ? 'Cloning...' : 'Clone Agent'}
    </button>
  );
}
