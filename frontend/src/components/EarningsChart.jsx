import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const fullDate = payload[0]?.payload?.fullDate || label;
    return (
      <div className="bg-[#111827]/95 border border-white/10 p-3.5 rounded-xl shadow-glass backdrop-blur-md text-xs">
        <p className="font-semibold text-slate-300 mb-2 border-b border-white/5 pb-1">
          Date: {fullDate}
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-slate-400 capitalize">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name === 'roi' ? 'Daily ROI' : 'Referral Income'}:
            </span>
            <span className="font-mono font-bold text-slate-100">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
        {payload.length > 1 && (
          <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between font-bold text-white">
            <span>Total Earned:</span>
            <span className="text-blue-400">
              {formatCurrency(
                payload.reduce((sum, item) => sum + (item.value || 0), 0)
              )}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function EarningsChart({ data = [] }) {
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'

  const hasData = data && data.length > 0 && data.some((d) => d.total > 0);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-glass">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Earnings Analytics Trajectory</h3>
          <p className="text-xs text-slate-400">
            Daily automated ROI accrual vs. multi-tier referral income
          </p>
        </div>

        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-white/5 self-start">
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              chartType === 'area'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Area Trend
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Bars
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
            <p>No earnings accrued during the past 7 days yet.</p>
            <p className="text-xs text-slate-600 mt-1">
              Active investments yield automated daily returns starting at midnight.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="refGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="roi"
                  name="Daily ROI"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#roiGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="referral"
                  name="Referral Commission"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#refGradient)"
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="roi" name="Daily ROI" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="referral"
                  name="Referral Commission"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
