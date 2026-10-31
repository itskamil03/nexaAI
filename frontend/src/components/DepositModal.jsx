import React, { useState } from 'react';
import { X, Wallet, CheckCircle, ArrowRight } from 'lucide-react';
import { simulateDeposit } from '../api/wallet';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';

export default function DepositModal({ isOpen, onClose, onSuccess }) {
  const { refreshUser } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickAmounts = [250, 500, 1000, 2500, 5000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toastError('Please enter a valid deposit amount greater than $0');
      return;
    }

    setLoading(true);
    try {
      const res = await simulateDeposit(numAmount, 'Test wallet deposit');
      if (res.success) {
        toastSuccess(`Successfully added ${formatCurrency(numAmount)} to your wallet!`);
        await refreshUser();
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      toastError(err.message || 'Deposit simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] shadow-glass p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Deposit Capital</h3>
              <p className="text-xs text-slate-400">
                Top up your internal wallet for investments
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Deposit Amount ($)
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base">
                $
              </span>
              <input
                type="number"
                min="10"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white font-mono text-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="1000"
                required
              />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Selection:
            </span>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(val))}
                  className={`py-1.5 px-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                    amount === String(val)
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm'
                      : 'border-white/5 bg-slate-900/40 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-white/5 bg-slate-900/50 text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300">Development Mode:</span> This simulates
            cleared blockchain liquidity deposit and directly updates your verified wallet ledger.
          </div>

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
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              {loading ? 'Processing...' : 'Credit Wallet'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
