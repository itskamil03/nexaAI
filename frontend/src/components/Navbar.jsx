import React, { useState } from 'react';
import {
  Wallet,
  PlusCircle,
  Copy,
  Check,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';

export default function Navbar({ onOpenInvest, onOpenDeposit, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { toastSuccess } = useToast();
  const [copied, setCopied] = useState(false);

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      toastSuccess(`Referral code "${user.referralCode}" copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left Section: Mobile toggle and Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-neon-blue">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                NexaChain
              </span>
              <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                AI
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right Section: Balances & Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Wallet Balance Pill */}
          <div
            onClick={onOpenDeposit}
            className="cursor-pointer group flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-white/10 bg-slate-900/60 hover:border-emerald-500/40 transition-all shadow-glass"
            title="Click to add funds"
          >
            <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-semibold text-slate-400 leading-tight">
                Wallet Balance
              </div>
              <div className="text-sm font-mono font-bold text-white group-hover:text-emerald-300 transition-colors">
                {formatCurrency(user?.walletBalance || 0)}
              </div>
            </div>
          </div>

          {/* Quick Action: New Investment */}
          <button
            onClick={onOpenInvest}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-neon-blue transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Invest</span>
          </button>

          {/* Referral Code Quick Copy Pill */}
          {user?.referralCode && (
            <button
              onClick={copyReferralCode}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/40 hover:bg-white/5 text-xs text-slate-300 font-mono transition-colors"
              title="Click to copy your referral sponsor code"
            >
              <span className="text-slate-400 font-sans">Ref:</span>
              <span className="font-bold text-blue-400">{user.referralCode}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          )}

          {/* User Profile Avatar & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/15 flex items-center justify-center font-bold text-xs text-blue-300">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-200 leading-tight">
                  {user?.fullName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  {user?.email}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
