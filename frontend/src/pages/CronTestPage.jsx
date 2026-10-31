import React, { useState } from 'react';
import { Clock, Play, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';

export default function CronTestPage() {
  const { refreshUser } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];
  const [processingDate, setProcessingDate] = useState(todayStr);
  const [adminSecret, setAdminSecret] = useState(
    () => localStorage.getItem('nexachain_admin_secret') || ''
  );
  const [loading, setLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  const handleRunBatch = async () => {
    setLoading(true);
    setExecutionResult(null);

    try {
      if (adminSecret) {
        localStorage.setItem('nexachain_admin_secret', adminSecret.trim());
      }
      const headers = adminSecret ? { 'x-admin-secret': adminSecret.trim() } : {};
      const res = await client.post(
        '/admin/roi/process',
        { processingDate, adminSecret: adminSecret.trim() },
        { headers }
      );
      if (res.success) {
        setExecutionResult(res.data);
        await refreshUser();
        toastSuccess(`Daily ROI processed for date: ${res.data.date}`);
      }
    } catch (err) {
      toastError(err.message || 'Error executing ROI batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white">Cron Scheduler & Batch Simulator</h1>
        <p className="text-xs text-slate-400">
          Task 5 Assessment Verification Console — Test daily 12:00 AM automation and idempotency
        </p>
      </div>

      {/* Scheduler Configuration Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-glass space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Automated node-cron Configuration</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              In production, the backend daemon triggers at <span className="text-blue-300 font-semibold font-mono">00:00 AM</span> daily in the configured timezone (<span className="text-slate-300 font-mono">Asia/Kolkata</span>).
              Using this console, you can manually trigger execution for any target calendar date to inspect idempotency and ledger entries.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Standard Cron Schedule:</span>
            <span className="font-mono font-bold text-slate-200">0 0 * * * (Midnight)</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Configured Timezone:</span>
            <span className="font-mono font-bold text-slate-200">Asia/Kolkata</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Distributed Locking:</span>
            <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              JobLock Active
            </span>
          </div>
        </div>

        {/* Date Selector, Admin Secret & Trigger Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Processing Date:
            </label>
            <input
              type="date"
              value={processingDate}
              onChange={(e) => setProcessingDate(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Admin Secret Key:</span>
              <span className="text-[10px] text-blue-400 normal-case">x-admin-secret</span>
            </label>
            <input
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Render ADMIN_SECRET_KEY"
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleRunBatch}
            disabled={loading || !processingDate}
            className="w-full py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-neon-blue transition-all flex items-center justify-center gap-2 h-[42px]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Batch...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute ROI Batch Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Execution Results View */}
      {executionResult && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 shadow-glass space-y-4 animate-slide-in">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Batch Execution Completed Successfully</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Completed in {executionResult.durationMs}ms
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-slate-400 block mb-1">Target Date</span>
              <span className="font-mono font-bold text-white text-sm">
                {executionResult.date}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-slate-400 block mb-1">Processed & Credited</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {executionResult.processedCount}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-slate-400 block mb-1">Skipped (Idempotent)</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {executionResult.skippedCount}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-slate-400 block mb-1">Total ROI Yield</span>
              <span className="font-mono font-bold text-white text-sm">
                {formatCurrency(executionResult.totalRoiAmount)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Idempotency Verification:</span> If you click
            "Execute ROI Batch Now" again for the same date, the system safely recognizes existing records
            and reports <span className="text-amber-400 font-semibold">{executionResult.totalActiveInvestments} skipped</span>, guaranteeing zero duplicate payouts.
          </div>
        </div>
      )}
    </div>
  );
}
