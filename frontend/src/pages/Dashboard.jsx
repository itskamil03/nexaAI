import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  TrendingUp,
  Coins,
  Award,
  Wallet,
  Layers,
  ArrowUpRight,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { getDashboardSummary } from '../api/dashboard';
import { getInvestments } from '../api/investments';
import StatCard from '../components/StatCard';
import EarningsChart from '../components/EarningsChart';
import InvestmentTable from '../components/InvestmentTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const { onOpenInvest, onOpenDeposit } = useOutletContext();
  const { toastError, toastSuccess } = useToast();

  const [summaryData, setSummaryData] = useState(null);
  const [recentInvestments, setRecentInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [sumRes, invRes] = await Promise.all([
        getDashboardSummary(),
        getInvestments({ limit: 5 }),
      ]);

      if (sumRes.success) {
        setSummaryData(sumRes.data);
      }
      if (invRes.success) {
        setRecentInvestments(invRes.data.investments || []);
      }
    } catch (err) {
      toastError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return <LoadingSpinner text="Aggregating live portfolio metrics..." />;
  }

  const metrics = summaryData?.metrics || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-white/10 shadow-glass">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Algorithmic Arbitrage & Decentralized Yield
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Investment & Referral Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Track real-time capital deployment, automated daily ROI accruals, and hierarchical
              referral income from a single unified portal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-white/5 text-slate-300 transition-colors"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            <button
              onClick={onOpenDeposit}
              className="px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Deposit Funds</span>
            </button>

            <button
              onClick={onOpenInvest}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-neon-blue transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Deploy Capital</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Dashboard Cards (Task 4 Mandatory Requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Investments */}
        <StatCard
          title="Total Investments"
          value={formatCurrency(metrics.totalInvestments || 0)}
          subtitle={`${metrics.activeInvestmentsCount || 0} Active Deployments`}
          icon={Layers}
          colorScheme="blue"
          trend="Active"
        />

        {/* Card 2: Daily ROI */}
        <StatCard
          title="Daily ROI"
          value={formatCurrency(metrics.dailyExpectedRoi || 0)}
          subtitle={`Today Credited: ${formatCurrency(metrics.todayRoiEarned || 0)}`}
          icon={Coins}
          colorScheme="emerald"
          trend="Automated"
        />

        {/* Card 3: Total Level Income */}
        <StatCard
          title="Total Level Income"
          value={formatCurrency(metrics.totalLevelIncomeEarned || 0)}
          subtitle={`${metrics.directReferralsCount || 0} Direct Sponsors`}
          icon={Award}
          colorScheme="purple"
          trend="3-Tier MLM"
        />

        {/* Card 4: Wallet Balance */}
        <StatCard
          title="Wallet Balance"
          value={formatCurrency(metrics.walletBalance || 0)}
          subtitle="Available Spendable"
          icon={Wallet}
          colorScheme="amber"
          trend="Instant"
        />
      </div>

      {/* Recharts Analytics Visualization */}
      <EarningsChart data={summaryData?.earningsChartData || []} />

      {/* Recent Investments Preview Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Active & Recent Investments</h3>
            <p className="text-xs text-slate-400">
              Live algorithmic tenure and performance status
            </p>
          </div>
          <Link
            to="/investments"
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <InvestmentTable
          investments={recentInvestments}
          onOpenInvestModal={onOpenInvest}
        />
      </div>
    </div>
  );
}
