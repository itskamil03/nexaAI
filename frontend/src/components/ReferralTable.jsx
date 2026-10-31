import React from 'react';
import { formatCurrency, formatDateTime, formatPercentage } from '../utils/formatters';
import EmptyState from './EmptyState';
import { ChevronLeft, ChevronRight, Award } from 'lucide-react';

export default function ReferralTable({
  records = [],
  pagination = null,
  onPageChange = null,
}) {
  if (!records || records.length === 0) {
    return (
      <EmptyState
        title="No Referral Commission History"
        description="Share your personal referral code to build a downline team and earn multi-tier commissions."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]/70 backdrop-blur-md shadow-glass">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-white/5">
            <tr>
              <th className="py-4 px-5">Downline Member</th>
              <th className="py-4 px-5">Tier Level</th>
              <th className="py-4 px-5">Commission Rate</th>
              <th className="py-4 px-5">Income Credited</th>
              <th className="py-4 px-5">Date</th>
              <th className="py-4 px-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {records.map((item) => {
              const levelStyles = {
                1: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                2: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                3: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              };

              return (
                <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-5">
                    <div className="font-bold text-white">
                      {item.sourceUserId?.fullName || 'Downline Member'}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {item.sourceUserId?.email || '—'}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        levelStyles[item.level] || 'bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      <Award className="w-3 h-3" />
                      Level {item.level}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-semibold text-slate-300">
                    {formatPercentage(item.commissionPercentage)}
                  </td>
                  <td className="py-4 px-5 font-mono font-bold text-emerald-400">
                    +{formatCurrency(item.incomeAmount)}
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-400">
                    {formatDateTime(item.date || item.createdAt)}
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
