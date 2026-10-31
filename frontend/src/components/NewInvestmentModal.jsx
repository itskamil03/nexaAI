import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, ArrowRight, Wallet, Sparkles } from 'lucide-react';
import { getPlans, createInvestment } from '../api/investments';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export default function NewInvestmentModal({ isOpen, onClose, onSuccess, onOpenDeposit }) {
  const { user, refreshUser } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingPlans, setFetchingPlans] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const loadPlans = async () => {
        try {
          const res = await getPlans();
          if (res.success && res.data.plans.length > 0) {
            setPlans(res.data.plans);
            setSelectedPlanId(res.data.plans[0].planId);
            setAmount(String(res.data.plans[0].minAmount));
          }
        } catch (err) {
          toastError('Failed to load investment plans');
        } finally {
          setFetchingPlans(false);
        }
      };
      loadPlans();
    }
  }, [isOpen, toastError]);

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.planId === selectedPlanId) || plans[0];
  const numAmount = parseFloat(amount) || 0;
  const walletBalance = user?.walletBalance || 0;
  const isInsufficient = numAmount > walletBalance;

  // Real-time projected calculations
  const dailyYield = selectedPlan
    ? (numAmount * selectedPlan.dailyRoiPercentage) / 100
    : 0;
  const totalTenureYield = selectedPlan
    ? dailyYield * selectedPlan.durationDays
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (numAmount < selectedPlan.minAmount || numAmount > selectedPlan.maxAmount) {
      toastError(
        `Amount must be between ${formatCurrency(selectedPlan.minAmount)} and ${formatCurrency(
          selectedPlan.maxAmount
        )}`
      );
      return;
    }

    if (isInsufficient) {
      toastError('Insufficient wallet balance. Please fund your wallet first.');
      return;
    }

    setLoading(true);
    try {
      const res = await createInvestment({
        planId: selectedPlan.planId,
        amount: numAmount,
      });

      if (res.success) {
        toastSuccess('Investment activated successfully! Daily returns scheduled.');
        await refreshUser();
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      toastError(err.message || 'Failed to create investment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#111827] shadow-glass p-6 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create New Investment</h3>
              <p className="text-xs text-slate-400">
                Deploy capital to automated AI yield vaults
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {fetchingPlans ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Fetching active algorithmic yield plans...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Plan Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Select Investment Plan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plans.map((p) => {
                  const isSelected = p.planId === selectedPlanId;
                  return (
                    <div
                      key={p.planId}
                      onClick={() => {
                        setSelectedPlanId(p.planId);
                        setAmount(String(p.minAmount));
                      }}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/15 shadow-neon-blue'
                          : 'border-white/5 bg-slate-900/40 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-bold text-white mb-0.5">{p.name}</div>
                      <div className="text-sm font-extrabold text-blue-400">
                        {formatPercentage(p.dailyRoiPercentage)} / day
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {p.durationDays} Days • Min {formatCurrency(p.minAmount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <label className="font-semibold uppercase tracking-wider text-slate-400">
                  Principal Amount ($)
                </label>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Wallet className="w-3.5 h-3.5 text-blue-400" />
                  <span>Wallet:</span>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(walletBalance)}
                  </span>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base">
                  $
                </span>
                <input
                  type="number"
                  min={selectedPlan?.minAmount}
                  max={selectedPlan?.maxAmount}
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white font-mono text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Allowed: {formatCurrency(selectedPlan?.minAmount)} – {formatCurrency(selectedPlan?.maxAmount)}
                </span>
                {isInsufficient && (
                  <span className="text-rose-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    Insufficient balance
                  </span>
                )}
              </div>
            </div>

            {/* Projection Summary Box */}
            <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Daily Expected Return:</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{formatCurrency(dailyYield)} / day
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Total Expected Yield ({selectedPlan?.durationDays} days):</span>
                <span className="font-mono font-bold text-blue-400">
                  +{formatCurrency(totalTenureYield)}
                </span>
              </div>
            </div>

            {/* Insufficient Balance Action */}
            {isInsufficient && onOpenDeposit && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-200">
                <span>Need more capital? Add test funds instantly:</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDeposit();
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors"
                >
                  Deposit Funds
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || isInsufficient || numAmount <= 0}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                {loading ? 'Activating...' : 'Confirm & Deploy'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
