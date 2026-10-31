import React, { useEffect, useState, useCallback } from 'react';
import { Coins, Sparkles } from 'lucide-react';
import { getRoiHistory } from '../api/roi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RoiTable from '../components/RoiTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';

export default function RoiHistoryPage() {
  const { user } = useAuth();
  const { toastError } = useToast();

  const [roiHistory, setRoiHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchRoi = useCallback(async (page = 1) => {
    try {
      const res = await getRoiHistory({ page, limit: 15 });
      if (res.success) {
        setRoiHistory(res.data.history || []);
        if (res.meta) setPagination(res.meta);
      }
    } catch (err) {
      toastError(err.message || 'Failed to fetch ROI history');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchRoi(1);
  }, [fetchRoi]);

  if (loading) {
    return <LoadingSpinner text="Fetching daily ROI ledger entries..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Daily ROI Accrual Ledger</h1>
          <p className="text-xs text-slate-400">
            Immutable calendar records of automated daily earnings credited to your spendable wallet
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-2xl border border-white/10">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">
              Total Lifetime ROI Earned
            </div>
            <div className="text-lg font-mono font-extrabold text-emerald-400">
              {formatCurrency(user?.totalRoiEarned || 0)}
            </div>
          </div>
        </div>
      </div>

      <RoiTable
        roiHistory={roiHistory}
        pagination={pagination}
        onPageChange={(page) => fetchRoi(page)}
      />
    </div>
  );
}
