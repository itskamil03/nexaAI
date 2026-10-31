import React from 'react';

export default function LoadingSpinner({ text = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping"></div>
        <div className="w-12 h-12 rounded-full border-2 border-t-blue-500 border-r-blue-400 border-b-transparent border-l-transparent animate-spin"></div>
      </div>
      <p className="text-slate-400 text-sm font-medium tracking-wide">{text}</p>
    </div>
  );
}
