'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Next.js caught error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white font-mono">
      <h2 className="text-2xl font-bold text-red-500 mb-4">Client Error Caught!</h2>
      <div className="bg-red-950 p-6 rounded-lg max-w-3xl w-full border border-red-800">
        <p className="font-bold mb-2">Error Message:</p>
        <code className="block mb-4 p-2 bg-black rounded text-red-300">{error.message}</code>
        <p className="font-bold mb-2">Stack Trace:</p>
        <pre className="text-xs text-red-400 overflow-x-auto p-2 bg-black rounded">{error.stack}</pre>
      </div>
      <button
        className="mt-8 px-4 py-2 bg-white text-black font-bold rounded"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
