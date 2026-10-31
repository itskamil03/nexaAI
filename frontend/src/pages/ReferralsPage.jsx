import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Copy,
  Check,
  Award,
  Layers,
  Sparkles,
  GitFork,
  Coins,
} from 'lucide-react';
import { getDirectReferrals, getReferralTree, getReferralIncomeHistory } from '../api/referrals';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ReferralTree from '../components/ReferralTree';
import ReferralTable from '../components/ReferralTable';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function ReferralsPage() {
  const { user } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'direct' | 'income'
  const [treeData, setTreeData] = useState(null);
  const [directReferrals, setDirectReferrals] = useState([]);
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [incomePagination, setIncomePagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchReferralData = useCallback(async () => {
    try {
      const [treeRes, directRes, incRes] = await Promise.all([
        getReferralTree(3),
        getDirectReferrals(),
        getReferralIncomeHistory({ page: 1, limit: 10 }),
      ]);

      if (treeRes.success) setTreeData(treeRes.data.tree);
      if (directRes.success) setDirectReferrals(directRes.data.directReferrals || []);
      if (incRes.success) {
        setIncomeRecords(incRes.data.records || []);
        if (incRes.meta) setIncomePagination(incRes.meta);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load referral hierarchy data');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const copyReferralLink = () => {
    if (user?.referralCode) {
      const link = `${window.location.origin}/register?ref=${user.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      toastSuccess('Personal referral invitation link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Traversing hierarchical referral graph..." />;
  }

  const referralLink = user?.referralCode
    ? `${window.location.origin}/register?ref=${user.referralCode}`
    : '';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-white">Referral Team & Network</h1>
        <p className="text-xs text-slate-400">
          Multi-tier affiliate tree structure: Level 1 (5%), Level 2 (3%), Level 3 (2%)
        </p>
      </div>

      {/* Referral Link Sharing Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900/60 p-6 shadow-glass">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Sponsor Code Active
            </span>
            <h3 className="text-lg font-bold text-white">Your Personal Invitation Link</h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-lg">
              New partners signing up through your link are automatically linked to your downline.
            </p>
          </div>

          <div className="flex items-center gap-2 max-w-md w-full">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-slate-300 select-all focus:outline-none"
            />
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-neon-blue transition-all flex items-center gap-1.5 shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('tree')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tree'
              ? 'bg-blue-600 text-white shadow-neon-blue'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>Nested Tree Hierarchy</span>
        </button>

        <button
          onClick={() => setActiveTab('direct')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'direct'
              ? 'bg-blue-600 text-white shadow-neon-blue'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Direct Sponsors ({directReferrals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('income')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'income'
              ? 'bg-blue-600 text-white shadow-neon-blue'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Commission History</span>
        </button>
      </div>

      {/* Tab 1: Interactive Nested Tree */}
      {activeTab === 'tree' && (
        <ReferralTree treeData={treeData} />
      )}

      {/* Tab 2: Direct Referrals Table */}
      {activeTab === 'direct' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]/70 backdrop-blur-md shadow-glass">
            {directReferrals.length === 0 ? (
              <EmptyState
                title="No direct referrals yet"
                description="Share your referral code to recruit Level 1 team partners."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-white/5">
                    <tr>
                      <th className="py-4 px-5">Partner Name</th>
                      <th className="py-4 px-5">Contact Details</th>
                      <th className="py-4 px-5">Joined Date</th>
                      <th className="py-4 px-5">Total Deployed</th>
                      <th className="py-4 px-5">Commission Earned</th>
                      <th className="py-4 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {directReferrals.map((member) => (
                      <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-white">{member.fullName}</div>
                          <div className="text-xs text-blue-400 font-mono">
                            Ref: {member.referralCode}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-xs text-slate-400">
                          <div>{member.email}</div>
                          <div>{member.mobileNumber}</div>
                        </td>
                        <td className="py-4 px-5 text-xs text-slate-300">
                          {formatDate(member.joinedAt)}
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-white">
                          {formatCurrency(member.totalInvested)}
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-emerald-400">
                          +{formatCurrency(member.commissionGenerated)}
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {member.accountStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Commission Income History */}
      {activeTab === 'income' && (
        <ReferralTable
          records={incomeRecords}
          pagination={incomePagination}
          onPageChange={async (page) => {
            const res = await getReferralIncomeHistory({ page, limit: 10 });
            if (res.success) {
              setIncomeRecords(res.data.records);
              if (res.meta) setIncomePagination(res.meta);
            }
          }}
        />
      )}
    </div>
  );
}
