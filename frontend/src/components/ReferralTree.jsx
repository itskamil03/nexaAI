import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Users, UserCheck, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

const TreeNode = ({ node, isRoot = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const levelStyles = {
    0: { border: 'border-blue-500/40', badge: 'bg-blue-500/20 text-blue-400' },
    1: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-400' },
    2: { border: 'border-purple-500/30', badge: 'bg-purple-500/15 text-purple-400' },
    3: { border: 'border-amber-500/30', badge: 'bg-amber-500/15 text-amber-400' },
  };

  const currentLevelStyle = levelStyles[node.level] || levelStyles[1];

  return (
    <div className="relative pl-6 py-2">
      {/* Hierarchy Connector Lines */}
      {!isRoot && (
        <>
          <div className="absolute left-0 top-6 w-6 h-px bg-white/15" />
          <div className="absolute left-0 top-0 bottom-0 w-px bg-white/15" />
        </>
      )}

      {/* Node Card */}
      <div
        className={`inline-block min-w-[280px] sm:min-w-[340px] p-4 rounded-xl border ${currentLevelStyle.border} bg-[#111827]/80 backdrop-blur-md shadow-glass transition-all duration-200 hover:border-blue-400/50 hover:shadow-neon-blue`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${currentLevelStyle.badge} border border-white/10`}
            >
              {isRoot ? (
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </div>

            <div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                {node.fullName}
                {isRoot && (
                  <span className="text-[10px] uppercase font-extrabold bg-blue-600/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                    You
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Code: <span className="text-blue-300 font-semibold">{node.referralCode}</span>
              </div>
            </div>
          </div>

          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title={isExpanded ? 'Collapse team' : 'Expand team'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <div>
            Joined: <span className="text-slate-300">{formatDate(node.joinedAt)}</span>
          </div>
          {node.totalInvested !== undefined && (
            <div className="font-semibold text-slate-200">
              Invested: <span className="text-emerald-400">{formatCurrency(node.totalInvested)}</span>
            </div>
          )}
        </div>

        {hasChildren && (
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            <span>
              {node.children.length} direct {node.children.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        )}
      </div>

      {/* Render Nested Children */}
      {hasChildren && isExpanded && (
        <div className="ml-2 relative">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} isRoot={false} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ReferralTree({ treeData = null }) {
  if (!treeData) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        No referral tree data available.
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-glass overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">Hierarchical Referral Network</h3>
        <p className="text-xs text-slate-400">
          Interactive multi-tier downline structure. Click arrows to expand or collapse branches.
        </p>
      </div>

      <div className="py-2 min-w-[360px]">
        <TreeNode node={treeData} isRoot={true} />
      </div>
    </div>
  );
}
