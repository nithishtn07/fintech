import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, AlertCircle } from 'lucide-react';
import type { TransactionStats, TransactionAnalyzeResponse } from '../../types';

interface RiskChartsProps {
  stats: TransactionStats | null;
  history: TransactionAnalyzeResponse[];
  loading: boolean;
  isLive: boolean;
}

const RISK_COLORS = {
  LOW: '#10b981', // emerald-500
  MEDIUM: '#f59e0b', // amber-500
  HIGH: '#f43f5e', // rose-500
};

export const RiskCharts: React.FC<RiskChartsProps> = ({
  stats,
  history,
  loading,
  isLive,
}) => {
  const total = stats?.total_transactions ?? 0;

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
      </div>
    );
  }

  // Handle empty dataset safely without crashing
  if (total === 0 && history.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
        <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
        <span className="font-semibold text-slate-300 text-sm">No Telemetry Chart Data Available</span>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Charts render dynamically as transactions are evaluated and recorded in the database.
        </p>
      </div>
    );
  }

  const pieData = [
    { name: 'Low Risk', value: stats?.low_risk_count ?? 0, color: RISK_COLORS.LOW },
    { name: 'Medium Risk', value: stats?.medium_risk_count ?? 0, color: RISK_COLORS.MEDIUM },
    { name: 'High Risk', value: stats?.high_risk_count ?? 0, color: RISK_COLORS.HIGH },
  ].filter((d) => d.value > 0);

  // Group history by payment rails for rail distribution
  const railMap: Record<string, { count: number; volume: number }> = {};
  history.forEach((h) => {
    const rail = h.payment_method || 'OTHER';
    if (!railMap[rail]) railMap[rail] = { count: 0, volume: 0 };
    railMap[rail].count += 1;
    railMap[rail].volume += h.amount;
  });

  const barData = Object.entries(railMap).map(([name, data]) => ({
    name,
    transactions: data.count,
    volume: Math.round(data.volume),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Risk Category Distribution Donut */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">Risk Tier Breakdown</h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
            {isLive ? 'LIVE DB METRICS' : 'MOCK METRICS'}
          </span>
        </div>

        <div className="h-56 pt-2">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs font-mono shadow-xl">
                          <span className="font-semibold text-white block">{d.name}</span>
                          <span className="text-slate-300">
                            {d.value} txns ({pct}%)
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Empty distribution
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 text-xs font-mono pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Low ({stats?.low_risk_count ?? 0})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-400">Med ({stats?.medium_risk_count ?? 0})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-400">High ({stats?.high_risk_count ?? 0})</span>
          </div>
        </div>
      </div>

      {/* Payment Rails Volume Breakdown Bar Chart */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">Payment Rail Frequency</h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
            DISTRIBUTION
          </span>
        </div>

        <div className="h-56 pt-2">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="JetBrains Mono, monospace"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={false}
                  fontFamily="JetBrains Mono, monospace"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs font-mono shadow-xl">
                          <span className="font-semibold text-white block">{d.name}</span>
                          <span className="text-cyan-400">{d.transactions} Transactions</span>
                          <span className="text-slate-400 block text-[11px]">
                            ₹{d.volume.toLocaleString('en-IN')} Vol
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="transactions" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              No rail transactions logged
            </div>
          )}
        </div>

        <div className="text-center text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
          Transaction Volume by Rail Instrument
        </div>
      </div>
    </div>
  );
};
