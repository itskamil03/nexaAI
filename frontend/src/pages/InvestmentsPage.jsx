import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Layers, PlusCircle, Check, ArrowRight, Sparkles } from 'lucide-react';
import { getPlans, getInvestments } from '../api/investments';
import InvestmentTable from '../components/InvestmentTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export default function InvestmentsPage() {
  const { onOpenInvest } = useOutletContext();
  const { toastError } = useToast();

  const [plans, setPlans] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInvestments = useCallback(async (page = 1, status = '') => {
    try {
      const params = { page, limit: 10 };
      if (status) params.status = status;

      const [plansRes, invRes] = await Promise.all([
        getPlans(),
        getInvestments(params),
      ]);

      if (plansRes.success) {
        setPlans(plansRes.data.plans || []);
      }
      if (invRes.success) {
        setInvestments(invRes.data.investments || []);
        if (invRes.meta) {
          setPagination(invRes.meta);
        }
      }
    } catch (err) {
      toastError(err.message || 'Failed to load investments');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchInvestments(1, statusFilter);
  }, [fetchInvestments, statusFilter]);

  if (loading) {
    return <LoadingSpinner text="Loading investment plans and portfolio records..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Investment Portfolios</h1>
          <p className="text-xs text-slate-400">
            Explore AI-driven yield packages and monitor your capital history
          </p>
        </div>
        <button
          onClick={onOpenInvest}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-neon-blue transition-all flex items-center gap-2 self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Investment</span>
        </button>
      </div>

      {/* Available Plans Cards Section */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          Active Algorithmic Yield Strategies
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div
              key={p.planId}
              className="glass-card p-6 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>
                  </div>
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Layers className="w-5 h-5" />
                  </span>
                </div>

                <div className="py-4 my-2 border-y border-white/5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Daily Return:</span>
                    <span className="text-xl font-extrabold text-emerald-400">
                      {formatPercentage(p.dailyRoiPercentage)} / day
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs text-slate-400">
                    <span>Tenure Duration:</span>
                    <span className="font-semibold text-slate-200">{p.durationDays} Days</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs text-slate-400">
                    <span>Deposit Limits:</span>
                    <span className="font-semibold text-slate-200">
                      {formatCurrency(p.minAmount)} – {formatCurrency(p.maxAmount)}
                    </span>
                  </div>
                </div>

                {p.features && (
                  <ul className="space-y-2 my-4 text-xs text-slate-300">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={onOpenInvest}
                className="w-full mt-4 py-2.5 px-4 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-400 font-bold text-xs transition-all flex items-center justify-center gap-2 group"
              >
                <span>Select & Invest</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* User Investment History Table */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Your Investment Ledger</h2>
            <p className="text-xs text-slate-400">
              Verified cryptographic deployments associated with your account
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/5 self-start">
            {['', 'Active', 'Completed', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status || 'All Status'}
              </button>
            ))}
          </div>
        </div>

        <InvestmentTable
          investments={investments}
          pagination={pagination}
          onPageChange={(page) => fetchInvestments(page, statusFilter)}
          onOpenInvestModal={onOpenInvest}
        />
      </div>
    </div>
  );
}
