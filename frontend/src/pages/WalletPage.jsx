import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import { getWalletTransactions } from '../api/wallet';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function WalletPage() {
  const { onOpenDeposit } = useOutletContext();
  const { user } = useAuth();
  const { toastError } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async (page = 1, type = '') => {
    try {
      const params = { page, limit: 15 };
      if (type) params.type = type;

      const res = await getWalletTransactions(params);
      if (res.success) {
        setTransactions(res.data.transactions || []);
        if (res.meta) setPagination(res.meta);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load wallet ledger');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchTransactions(1, typeFilter);
  }, [fetchTransactions, typeFilter]);

  if (loading) {
    return <LoadingSpinner text="Retrieving verified financial ledger records..." />;
  }

  const txTypes = [
    { label: 'All Operations', value: '' },
    { label: 'ROI Yield', value: 'ROI_CREDIT' },
    { label: 'Referral Rewards', value: 'REFERRAL_CREDIT' },
    { label: 'Investments', value: 'INVESTMENT_DEBIT' },
    { label: 'Deposits', value: 'WALLET_DEPOSIT' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Wallet & Financial Ledger</h1>
          <p className="text-xs text-slate-400">
            Immutable, double-entry audit trail of every credit and debit transaction
          </p>
        </div>

        <button
          onClick={onOpenDeposit}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-neon-green transition-all flex items-center gap-2 self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Funds (Deposit)</span>
        </button>
      </div>

      {/* Balance Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl border border-white/10 bg-[#111827]/80 backdrop-blur-md shadow-glass">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <span>Spendable Balance</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {formatCurrency(user?.walletBalance || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-2">Instant internal liquidity</div>
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-[#111827]/80 backdrop-blur-md shadow-glass">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <span>Cumulative ROI Earned</span>
            <ArrowDownLeft className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-blue-400 font-mono">
            {formatCurrency(user?.totalRoiEarned || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-2">Daily automated yield</div>
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-[#111827]/80 backdrop-blur-md shadow-glass">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <span>Cumulative Level Income</span>
            <ArrowDownLeft className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400 font-mono">
            {formatCurrency(user?.totalLevelIncomeEarned || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-2">Multi-tier team commissions</div>
        </div>
      </div>

      {/* Filter and Ledger Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Cryptographic Transaction Ledger</h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/5">
            {txTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  typeFilter === t.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]/70 backdrop-blur-md shadow-glass">
          {transactions.length === 0 ? (
            <EmptyState
              title="No wallet transactions found"
              description="Your credits and debits will appear here with permanent idempotency verification."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-4 px-5">Type / Narrative</th>
                    <th className="py-4 px-5">Amount</th>
                    <th className="py-4 px-5">Balance Checkpoint</th>
                    <th className="py-4 px-5">Idempotency Key</th>
                    <th className="py-4 px-5">Timestamp</th>
                    <th className="py-4 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {transactions.map((tx) => {
                    const isCredit = tx.direction === 'CREDIT';
                    return (
                      <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-xl border ${
                                isCredit
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs">{tx.description}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {tx.transactionType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-mono font-bold">
                          <span className={isCredit ? 'text-emerald-400' : 'text-rose-400'}>
                            {isCredit ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono text-xs text-slate-300">
                          {tx.balanceAfter !== null ? formatCurrency(tx.balanceAfter) : '—'}
                        </td>
                        <td className="py-4 px-5 font-mono text-[11px] text-slate-400 truncate max-w-[180px]">
                          {tx.idempotencyKey}
                        </td>
                        <td className="py-4 px-5 text-xs text-slate-400">
                          {formatDateTime(tx.timestamp || tx.createdAt)}
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchTransactions(pagination.page - 1, typeFilter)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchTransactions(pagination.page + 1, typeFilter)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
