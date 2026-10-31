import React from 'react';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';
import EmptyState from './EmptyState';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

export default function InvestmentTable({
  investments = [],
  pagination = null,
  onPageChange = null,
  onOpenInvestModal = null,
}) {
  if (!investments || investments.length === 0) {
    return (
      <EmptyState
        title="No active or past investments"
        description="Choose a high-yield algorithmic plan to start accumulating automated daily ROI."
        action={
          onOpenInvestModal && (
            <button
              onClick={onOpenInvestModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
            >
              Explore Plans
            </button>
          )
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]/70 backdrop-blur-md shadow-glass">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-white/5">
            <tr>
              <th className="py-4 px-5">Plan</th>
              <th className="py-4 px-5">Principal Amount</th>
              <th className="py-4 px-5">Daily ROI Rate</th>
              <th className="py-4 px-5">Tenure / Period</th>
              <th className="py-4 px-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {investments.map((inv) => {
              const statusColors = {
                Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                Completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                Cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
              };

              return (
                <tr key={inv._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white">
                          {inv.planDetails?.planName || 'Standard Plan'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {inv.planDetails?.durationDays || 30} Days Tenure
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 font-mono font-bold text-white">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="py-4 px-5">
                    <span className="font-semibold text-emerald-400">
                      {formatPercentage(inv.dailyRoiPercentage)} / day
                    </span>
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-400">
                    <div>Start: {formatDate(inv.startDate)}</div>
                    <div>End: {formatDate(inv.endDate)}</div>
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        statusColors[inv.status] || statusColors.Active
                      }`}
                    >
                      {inv.status}
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
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
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
