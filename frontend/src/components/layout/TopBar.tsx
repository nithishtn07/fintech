import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { HealthStatus } from '../../types';

interface TopBarProps {
  title: string;
  subtitle: string;
  health: HealthStatus | null;
  healthLoading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  health,
  healthLoading,
  onRefresh,
  refreshing,
}) => {
  const isHealthy = health?.status === 'ok' || health?.status === 'healthy';

  return (
    <header className="h-16 px-6 bg-slate-950/70 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-white tracking-tight">
            {title}
          </h1>
          <span className="text-slate-600 font-mono text-xs">/</span>
          <span className="text-xs font-mono text-cyan-400 font-medium">
            FinShield Core
          </span>
        </div>
        <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>
      </div>

      {/* Connectivity & Environment Badges */}
      <div className="flex items-center gap-3">
        {/* Backend Connectivity Status */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
            healthLoading
              ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
              : isHealthy
              ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30 shadow-glow-success'
              : 'bg-rose-950/50 text-rose-400 border-rose-500/30 shadow-glow-danger'
          }`}
          title={isHealthy ? `Connected to ${health?.service || health?.application_name || 'FinShield AI'}` : 'FastAPI service offline'}
        >
          {healthLoading ? (
            <Activity className="w-3.5 h-3.5 animate-spin text-amber-400" />
          ) : isHealthy ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className="font-medium">
            {healthLoading
              ? 'Checking API...'
              : isHealthy
              ? 'FastAPI Online'
              : 'Backend Offline'}
          </span>
        </div>

        {/* Demo Environment Tag */}
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          DEMO ENVIRONMENT
        </span>

        {/* API Docs Link */}
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-slate-800 transition-colors"
          title="Open FastAPI Swagger Interactive Docs"
        >
          <span>Swagger Docs</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors disabled:opacity-50"
          title="Refresh All Metrics"
          aria-label="Refresh Dashboard Metrics"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`}
          />
        </button>
      </div>
    </header>
  );
};
