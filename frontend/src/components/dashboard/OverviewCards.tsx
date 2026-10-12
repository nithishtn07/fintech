import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import type { TransactionStats } from '../../types';

interface OverviewCardsProps {
  stats: TransactionStats | null;
  loading: boolean;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ stats, loading }) => {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse h-32"
          />
        ))}
      </div>
    );
  }

  const total = stats?.total_transactions ?? 0;
  const low = stats?.low_risk_count ?? 0;
  const med = stats?.medium_risk_count ?? 0;
  const high = stats?.high_risk_count ?? 0;
  const lowPct = stats?.low_risk_percentage ?? 0;
  const medPct = stats?.medium_risk_percentage ?? 0;
  const highPct = stats?.high_risk_percentage ?? 0;
  const totalVolume = stats?.total_volume_inr ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Analyzed */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/30 transition-all group">
        <div className="flex items-center justify-between text-slate-400 mb-3">
          <span className="text-xs font-medium tracking-wide uppercase font-mono">
            Total Analyzed
          </span>
          <div className="p-2 rounded-lg bg-slate-800/80 text-cyan-400 group-hover:bg-cyan-950/60 transition-colors">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-bold font-mono text-white tracking-tight">
            {total.toLocaleString()}
          </div>
          <span className="text-xs font-mono text-slate-400">Records</span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Processed Volume</span>
          <span className="font-mono text-cyan-300 font-medium">
            ₹{totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Low Risk */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/30 transition-all group">
        <div className="flex items-center justify-between text-slate-400 mb-3">
          <span className="text-xs font-medium tracking-wide uppercase font-mono">
            Low Risk (Safe)
          </span>
          <div className="p-2 rounded-lg bg-emerald-950/50 text-emerald-400 group-hover:bg-emerald-900/40 transition-colors">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-bold font-mono text-emerald-400 tracking-tight">
            {low.toLocaleString()}
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/20">
            {lowPct}%
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Recommended Action</span>
          <span className="font-mono text-emerald-400 font-medium">ALLOW</span>
        </div>
      </div>

      {/* Medium Risk */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/30 transition-all group">
        <div className="flex items-center justify-between text-slate-400 mb-3">
          <span className="text-xs font-medium tracking-wide uppercase font-mono">
            Medium Risk
          </span>
          <div className="p-2 rounded-lg bg-amber-950/50 text-amber-400 group-hover:bg-amber-900/40 transition-colors">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-bold font-mono text-amber-400 tracking-tight">
            {med.toLocaleString()}
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/20">
            {medPct}%
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Recommended Action</span>
          <span className="font-mono text-amber-400 font-medium">STEP-UP 2FA</span>
        </div>
      </div>

      {/* High Risk */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-rose-500/30 transition-all group">
        <div className="flex items-center justify-between text-slate-400 mb-3">
          <span className="text-xs font-medium tracking-wide uppercase font-mono">
            High Risk (Quarantine)
          </span>
          <div className="p-2 rounded-lg bg-rose-950/50 text-rose-400 group-hover:bg-rose-900/40 transition-colors">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-bold font-mono text-rose-400 tracking-tight">
            {high.toLocaleString()}
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-500/20">
            {highPct}%
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Recommended Action</span>
          <span className="font-mono text-rose-400 font-medium">MANUAL REVIEW</span>
        </div>
      </div>
    </div>
  );
};
