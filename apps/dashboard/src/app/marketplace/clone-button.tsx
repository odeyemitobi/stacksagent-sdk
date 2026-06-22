'use client';

import React, { useState } from 'react';

interface CloneButtonProps {
  agentId: string;
}

export function CloneButton({ agentId }: CloneButtonProps) {
  const [cloning, setCloning] = useState<boolean>(false);

  const handleClone = async () => {
    setCloning(true);
    try {
      // In production, NEXT_PUBLIC_API_URL should be used
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/v1/marketplace/agents/${agentId}/clone`, {
        method: 'POST',
      });

      if (res && res.ok) {
        alert('Agent cloned successfully! Check your dashboard.');
      } else {
        alert('Failed to clone agent.');
      }
    } catch (err) {
      alert('Failed to clone agent.');
    } finally {
      setCloning(false);
    }
  };

  return (
    <button
      onClick={handleClone}
      disabled={cloning}
      className="inline-flex justify-center items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {cloning ? 'Cloning...' : 'Clone Agent'}
    </button>
  );
}
