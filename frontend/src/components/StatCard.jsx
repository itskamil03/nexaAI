import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'blue',
  trend = null,
}) {
  const schemeStyles = {
    blue: {
      gradient: 'from-blue-500/20 to-indigo-500/5',
      border: 'border-blue-500/20 group-hover:border-blue-500/40',
      iconBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      glow: 'group-hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]',
    },
    emerald: {
      gradient: 'from-emerald-500/20 to-teal-500/5',
      border: 'border-emerald-500/20 group-hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      glow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]',
    },
    purple: {
      gradient: 'from-purple-500/20 to-pink-500/5',
      border: 'border-purple-500/20 group-hover:border-purple-500/40',
      iconBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
      glow: 'group-hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]',
    },
    amber: {
      gradient: 'from-amber-500/20 to-orange-500/5',
      border: 'border-amber-500/20 group-hover:border-amber-500/40',
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]',
    },
  };

  const currentScheme = schemeStyles[colorScheme] || schemeStyles.blue;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentScheme.gradient} p-6 border ${currentScheme.border} backdrop-blur-xl transition-all duration-300 ${currentScheme.glow} hover:-translate-y-1`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl ${currentScheme.iconBg} shadow-inner`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium truncate">{subtitle}</span>

        {trend && (
          <span className="flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
