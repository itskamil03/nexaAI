import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Users,
  Coins,
  Wallet,
  Clock,
  Sparkles,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Investments', path: '/investments', icon: Layers },
    { name: 'Referral Team', path: '/referrals', icon: Users },
    { name: 'Daily ROI Ledger', path: '/roi', icon: Coins },
    { name: 'Wallet & Audit', path: '/wallet', icon: Wallet },
    { name: 'Cron Simulator', path: '/cron-test', icon: Clock },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-white/10 bg-[#0B0F19] p-4 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top Header with Close Button for Mobile */}
          <div className="flex items-center justify-between px-2 py-3 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-neon-blue">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-black tracking-tight text-white">
                NexaChain AI
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Referral Card Widget */}
        <div className="p-4 rounded-xl border border-white/10 bg-gradient-to-br from-blue-900/20 to-indigo-900/10 text-xs">
          <div className="flex items-center gap-2 text-blue-400 font-bold mb-1">
            <Users className="w-4 h-4" />
            <span>Referral Uplink</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
            Earn 5% (L1), 3% (L2), and 2% (L3) recurring commissions on downline investments.
          </p>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5 font-mono text-center text-slate-200 font-bold text-xs select-all">
            {user?.referralCode || 'NEXACHAIN'}
          </div>
        </div>
      </aside>
    </>
  );
}
