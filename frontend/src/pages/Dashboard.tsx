import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ServerOff,
  Server,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';
import { apiService } from '../services/api';
import type {
  HealthStatus,
  TransactionStats,
  TransactionAnalyzeResponse,
  TransactionAnalyzeRequest,
} from '../types';
import { TopBar } from '../components/layout/TopBar';
import { OverviewCards } from '../components/dashboard/OverviewCards';
import { TransactionForm } from '../components/dashboard/TransactionForm';
import { RiskResultCard } from '../components/dashboard/RiskResultCard';
import { RiskCharts } from '../components/dashboard/RiskCharts';
import { TransactionHistory } from '../components/dashboard/TransactionHistory';

interface DashboardPageProps {
  currentTab?: 'dashboard' | 'analyze' | 'history';
}

export const Dashboard: React.FC<DashboardPageProps> = ({ currentTab = 'dashboard' }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  const [history, setHistory] = useState<TransactionAnalyzeResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const [lastAnalysis, setLastAnalysis] = useState<TransactionAnalyzeResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [forceMock, setForceMock] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch initial telemetry
  const loadDashboardData = useCallback(async () => {
    setRefreshing(true);
    setHealthLoading(true);

    try {
      // 1. Health check
      const healthRes = await apiService.checkHealth();
      setHealth(healthRes.status);
      setIsLiveBackend(healthRes.isLive);
    } catch {
      setIsLiveBackend(false);
    } finally {
      setHealthLoading(false);
    }

    // 2. Stats
    setStatsLoading(true);
    try {
      const statsRes = await apiService.getStats();
      setStats(statsRes.stats);
    } catch {
      // Handled in apiService fallback
    } finally {
      setStatsLoading(false);
    }

    // 3. History
    setHistoryLoading(true);
    try {
      const histRes = await apiService.getHistory(50, 0, riskFilter);
      setHistory(histRes.items);
      if (histRes.items.length > 0 && !lastAnalysis) {
        setLastAnalysis(histRes.items[0]);
      }
    } catch {
      // Handled in apiService fallback
    } finally {
      setHistoryLoading(false);
      setRefreshing(false);
    }
  }, [riskFilter, lastAnalysis]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle mock mode toggle
  const handleToggleMock = (enabled: boolean) => {
    setForceMock(enabled);
    apiService.setForceMockMode(enabled);
    loadDashboardData();
  };

  // Submit transaction for analysis
  const handleAnalyze = async (payload: TransactionAnalyzeRequest) => {
    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const res = await apiService.analyzeTransaction(payload);
      setLastAnalysis(res.response);
      setIsLiveBackend(res.isLive);

      // Prepend to history & refresh stats
      setHistory((prev) => [res.response, ...prev]);
      const updatedStats = await apiService.getStats();
      setStats(updatedStats.stats);
    } catch (err: any) {
      setAnalysisError(
        err?.message || 'Transaction analysis failed. Please verify input parameters.'
      );
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 bg-[#080c14] min-h-screen flex flex-col">
      {/* TopBar with actual Health Check */}
      <TopBar
        title="FinShield AI"
        subtitle="Real-Time Digital Payment Fraud & Threat Risk Platform"
        health={health}
        healthLoading={healthLoading}
        onRefresh={loadDashboardData}
        refreshing={refreshing}
      />

      {/* Main Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Mock / Live State Notice Banner */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono transition-all ${
            isLiveBackend && !forceMock
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isLiveBackend && !forceMock ? (
              <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ServerOff className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {isLiveBackend && !forceMock
                  ? 'LIVE BACKEND CONNECTED'
                  : 'DEVELOPMENT MOCK ENGINE ACTIVE'}
                :
              </span>{' '}
              <span className="text-slate-300">
                {isLiveBackend && !forceMock
                  ? `FastAPI operational at ${apiService.getBaseUrl()}. Data is persisted to SQLite.`
                  : 'Backend API is currently offline. Operating in isolated local mock mode.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            <button
              onClick={() => handleToggleMock(!forceMock)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 transition-colors"
              title="Force Local Mock Fixtures"
            >
              {forceMock ? (
                <ToggleRight className="w-4 h-4 text-cyan-400" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-slate-400" />
              )}
              <span>Force Mock: {forceMock ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={loadDashboardData}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 transition-colors"
              title="Retry Backend Ping"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              <span>Retry Ping</span>
            </button>
          </div>
        </div>

        {/* Section E: Dashboard Statistics */}
        <section aria-label="Executive Risk Metrics">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Aggregated Risk Telemetry
            </h2>
            <span className="text-[11px] font-mono text-slate-500">
              {isLiveBackend ? 'Sourced from backend SQLite' : 'Calculated from local session'}
            </span>
          </div>
          <OverviewCards stats={stats} loading={statsLoading} />
        </section>

        {/* Tab Filter or Unified Sections */}
        {(currentTab === 'dashboard' || currentTab === 'analyze') && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" aria-label="Transaction Evaluation Engine">
            {/* Section B: Transaction Analysis Form */}
            <div className="lg:col-span-7">
              <TransactionForm
                onSubmit={handleAnalyze}
                loading={analysisLoading}
                errorMessage={analysisError}
              />
            </div>

            {/* Section C: Risk Analysis Result */}
            <div className="lg:col-span-5">
              <RiskResultCard
                result={lastAnalysis}
                isLive={isLiveBackend && !forceMock}
              />
            </div>
          </section>
        )}

        {/* Section F: Telemetry Charts */}
        {(currentTab === 'dashboard') && (
          <section aria-label="Risk Distribution Visualizations">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Distribution & Rail Breakdown
              </h2>
            </div>
            <RiskCharts
              stats={stats}
              history={history}
              loading={statsLoading || historyLoading}
              isLive={isLiveBackend && !forceMock}
            />
          </section>
        )}

        {/* Section D: Transaction History Audit Trail */}
        {(currentTab === 'dashboard' || currentTab === 'history') && (
          <section aria-label="Historical Transaction Audit Trail">
            <TransactionHistory
              history={history}
              loading={historyLoading}
              onRefresh={loadDashboardData}
              selectedFilter={riskFilter}
              onFilterChange={setRiskFilter}
              isLive={isLiveBackend && !forceMock}
              onSelectTransaction={(txn) => setLastAnalysis(txn)}
            />
          </section>
        )}

        {/* Responsible AI & Disclaimer Footer */}
        <footer className="pt-6 pb-4 border-t border-slate-900 text-center text-xs text-slate-500 space-y-1 font-mono">
          <div className="flex items-center justify-center gap-1.5 text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>FinShield AI — Phase 1 MVP</span>
          </div>
          <p className="text-[11px] text-slate-600 max-w-2xl mx-auto flex items-center justify-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            Synthetic demonstration environment. Scores represent heuristic risk estimates, not definitive fraud verdicts.
          </p>
        </footer>
      </main>
    </div>
  );
};
