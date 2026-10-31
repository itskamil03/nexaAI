import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'No transaction or investment history is available yet.',
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-white/10 bg-slate-900/30">
      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
        <Inbox className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
