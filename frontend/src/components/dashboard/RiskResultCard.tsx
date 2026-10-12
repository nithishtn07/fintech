import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Info,
  CheckCircle,
  Hash,
} from 'lucide-react';
import type { TransactionAnalyzeResponse } from '../../types';
import { Badge } from '../common/Badge';

interface RiskResultCardProps {
  result: TransactionAnalyzeResponse | null;
  isLive: boolean;
}

export const RiskResultCard: React.FC<RiskResultCardProps> = ({ result, isLive }) => {
  if (!result) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-3">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-white">No Transaction Analyzed Yet</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Submit transaction parameters above or select a Quick Demo Preset to generate a real-time explainable risk assessment.
        </p>
      </div>
    );
  }

  const score = result.risk_score;
  const level = result.risk_level;
  const signals = result.detected_signals || [];
  const signalDetails = result.signal_details || [];

  const getScoreTheme = () => {
    if (level === 'HIGH') {
      return {
        bg: 'from-rose-500/20 to-red-950/40',
        border: 'border-rose-500/40',
        text: 'text-rose-400',
        bar: 'bg-rose-500',
        icon: <ShieldAlert className="w-6 h-6 text-rose-400" />,
        actionBg: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
      };
    }
    if (level === 'MEDIUM') {
      return {
        bg: 'from-amber-500/20 to-yellow-950/40',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        bar: 'bg-amber-500',
        icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
        actionBg: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
      };
    }
    return {
      bg: 'from-emerald-500/20 to-green-950/40',
      border: 'border-emerald-500/40',
      text: 'text-emerald-400',
      bar: 'bg-emerald-500',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      actionBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    };
  };

  const theme = getScoreTheme();

  return (
    <div className={`rounded-xl border ${theme.border} bg-slate-900/90 shadow-2xl overflow-hidden transition-all`}>
      {/* Top Banner */}
      <div className={`p-5 bg-gradient-to-r ${theme.bg} border-b border-slate-800 flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            {theme.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Risk Assessment Result</span>
              <Badge level={level} size="sm">
                {level} RISK
              </Badge>
              {!isLive && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/30 font-mono">
                  MOCK ENGINE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-slate-300 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-500" />
                {result.transaction_id}
              </span>
            </div>
          </div>
        </div>

        {/* Timestamp & Method */}
        <div className="text-right">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            {new Date(result.analyzed_at).toLocaleTimeString()}
          </div>
          <span className="text-[10px] font-mono text-cyan-400">
            {result.analysis_method}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Risk Score Gauge & Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          {/* Score Value */}
          <div className="text-center md:text-left">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">
              Composite Risk Score
            </span>
            <div className="flex items-baseline justify-center md:justify-start gap-2 mt-1">
              <span className={`text-4xl sm:text-5xl font-extrabold font-mono ${theme.text}`}>
                {score.toFixed(1)}
              </span>
              <span className="text-slate-500 font-mono text-sm">/ 100</span>
            </div>
          </div>

          {/* Visual Progress Meter */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Low (0-35)</span>
              <span>Medium (36-70)</span>
              <span>High (71-100)</span>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 flex gap-1">
              <div
                className={`h-full rounded-full transition-all duration-700 ${theme.bar}`}
                style={{ width: `${Math.min(Math.max(score, 4), 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Threshold Calibrated</span>
              <span className="text-slate-300 font-semibold">{level} RISK BRACKET</span>
            </div>
          </div>
        </div>

        {/* Transaction Evaluated Context */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">EVALUATED AMOUNT</span>
            <span className="text-white font-medium text-sm mt-0.5 block">
              ₹{result.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">PAYMENT RAIL</span>
            <span className="text-cyan-300 font-medium text-sm mt-0.5 block">
              {result.payment_method}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">TRANSACTION TYPE</span>
            <span className="text-slate-200 font-medium text-sm mt-0.5 block">
              {result.transaction_type}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">BENEFICIARY</span>
            <span className="text-slate-200 font-medium text-xs truncate mt-0.5 block" title={result.recipient_id}>
              {result.recipient_id}
            </span>
          </div>
        </div>

        {/* Recommended Action & Explanation */}
        <div className="space-y-4">
          {/* Action Box */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${theme.actionBg}`}>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider block font-semibold opacity-80">
                Recommended Policy Action
              </span>
              <div className="text-base font-bold font-mono tracking-tight mt-0.5">
                {result.recommended_action}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span>Enforce Rule Policy</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Explanation Text */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px] font-semibold uppercase">
              <Info className="w-3.5 h-3.5" />
              <span>Explainable Risk Reasoning</span>
            </div>
            <p>{result.explanation}</p>
          </div>
        </div>

        {/* Detected Signals / Indicators */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 uppercase tracking-wide flex items-center gap-2">
              <span>Triggered Heuristic Signals</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                {signals.length}
              </span>
            </span>
          </div>

          {signals.length === 0 ? (
            <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Clean Profile: No anomalous velocity, structuring, or beneficiary threat signals triggered.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {signalDetails.length > 0
                ? signalDetails.map((sig, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white font-mono">
                            {sig.title}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                              sig.severity === 'CRITICAL'
                                ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                                : sig.severity === 'WARNING'
                                ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                                : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                            }`}
                          >
                            {sig.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{sig.description}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300 shrink-0">
                        +{sig.points} pts
                      </span>
                    </div>
                  ))
                : signals.map((sig, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-slate-200">{sig}</span>
                      <span className="text-[10px] font-mono text-cyan-400">SIGNAL DETECTED</span>
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
