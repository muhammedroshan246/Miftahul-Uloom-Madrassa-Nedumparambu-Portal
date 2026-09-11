'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border border-slate-800 text-center space-y-4">
          <h2 className="text-lg font-bold">Mifthahul Uloom Higher Secondary Madrassa</h2>
          <p className="text-xs text-slate-400">A application refresh is required.</p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
