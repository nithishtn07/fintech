import React from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  ShieldCheck,
  History,
  BrainCircuit,
  MessageSquareWarning,
  FileSearch,
  Lock,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'analyze' | 'history';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800/80 flex flex-col shrink-0 min-h-screen">
      {/* Branding */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="relative p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-glow-cyan">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg tracking-tight text-white font-mono">
              FinShield
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              AI
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono tracking-wider">
            FRAUD SHIELD v1.0
          </p>
        </div>
      </div>

      {/* Main Navigation (Phase 1 Implemented) */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
            Core Monitoring
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Dashboard</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-mono">
                LIVE
              </span>
            </button>

            <button
              onClick={() => onSelectTab('analyze')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'analyze'
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Transaction Engine</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-mono">
                LIVE
              </span>
            </button>

            <button
              onClick={() => onSelectTab('history')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'history'
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className="w-4 h-4" />
                <span>Audit & History</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-mono">
                LIVE
              </span>
            </button>
          </nav>
        </div>

        {/* Future Roadmap / Next Phases (Clearly indicated) */}
        <div>
          <div className="px-3 pb-2 flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
            <span>Roadmap Modules</span>
            <span className="text-slate-600">IN PLANNING</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-500 bg-slate-900/20 border border-slate-900">
              <div className="flex items-center gap-2.5">
                <BrainCircuit className="w-4 h-4 text-slate-600" />
                <span>ML Anomaly Isolation</span>
              </div>
              <span className="text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                Phase 2
              </span>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-500 bg-slate-900/20 border border-slate-900">
              <div className="flex items-center gap-2.5">
                <MessageSquareWarning className="w-4 h-4 text-slate-600" />
                <span>NLP Scam SMS / Chat</span>
              </div>
              <span className="text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                Phase 2
              </span>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-500 bg-slate-900/20 border border-slate-900">
              <div className="flex items-center gap-2.5">
                <FileSearch className="w-4 h-4 text-slate-600" />
                <span>Payment OCR Scanner</span>
              </div>
              <span className="text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                Phase 3
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[11px]">Rule Baseline v1.0</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          FinTech Hackathon Demo Build
        </p>
      </div>
    </aside>
  );
};
