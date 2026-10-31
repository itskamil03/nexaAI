import React from 'react';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import EmptyState from './EmptyState';
import { ChevronLeft, ChevronRight, Coins } from 'lucide-react';

export default function RoiTable({
  roiHistory = [],
  pagination = null,
  onPageChange = null,
}) {
  if (!roiHistory || roiHistory.length === 0) {
    return (
      <EmptyState
        title="No Daily ROI History Yet"
        description="Daily ROI is processed automatically each midnight for your active investments."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]/70 backdrop-blur-md shadow-glass">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-white/5">
            <tr>
              <th className="py-4 px-5">Cycle Date</th>
              <th className="py-4 px-5">Source Investment</th>
              <th className="py-4 px-5">ROI Amount Credited</th>
              <th className="py-4 px-5">Processed At</th>
              <th className="py-4 px-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {roiHistory.map((item) => {
              const plan = item.investmentId?.planDetails;
              return (
                <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-5 font-mono text-slate-200">
                    {item.date}
                  </td>
                  <td className="py-4 px-5">
                    <div className="text-white font-semibold">
                      {plan?.planName || 'Investment'}
                    </div>
                    {item.investmentId?.amount && (
                      <div className="text-xs text-slate-400">
                        Principal: {formatCurrency(item.investmentId.amount)}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-5 font-mono font-bold text-emerald-400">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      +{formatCurrency(item.roiAmount)}
                    </div>
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-400">
                    {formatDateTime(item.processedAt)}
                  </td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
