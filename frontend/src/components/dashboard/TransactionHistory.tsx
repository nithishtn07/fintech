import React from 'react';
import {
  History,
  Copy,
  Check,
  Filter,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';
import type { TransactionAnalyzeResponse } from '../../types';
import { Badge } from '../common/Badge';

interface TransactionHistoryProps {
  history: TransactionAnalyzeResponse[];
  loading: boolean;
  onRefresh: () => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  isLive: boolean;
  onSelectTransaction?: (txn: TransactionAnalyzeResponse) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  history,
  loading,
  onRefresh,
  selectedFilter,
  onFilterChange,
  isLive,
  onSelectTransaction,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
      {/* Table Header & Controls */}
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">
              Transaction Audit Trail
            </h3>
            <span className="text-xs font-mono text-slate-500">
              ({history.length} records)
            </span>
            {!isLive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/30 font-mono">
                LOCAL FIXTURES
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time chronological log of analyzed transactions retrieved from persistence layer
          </p>
        </div>

        {/* Filters and Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => onFilterChange(lvl)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  selectedFilter === lvl
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh History"
            aria-label="Refresh transaction history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Amount (INR)</th>
              <th className="py-3 px-4">Rail / Method</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Analyzed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {loading && history.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                    <span className="font-mono text-xs">Querying transaction history...</span>
                  </div>
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Layers className="w-8 h-8 text-slate-600" />
                    <span className="font-semibold text-slate-300">No Transactions Found</span>
                    <span className="text-xs max-w-xs">
                      {selectedFilter !== 'ALL'
                        ? `No ${selectedFilter} risk transactions recorded. Try switching filters or analyzing a new transaction.`
                        : 'Submit a transaction above to view audit records.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              history.map((txn) => (
                <tr
                  key={txn.transaction_id}
                  onClick={() => onSelectTransaction?.(txn)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  {/* Transaction ID */}
                  <td className="py-3 px-4 font-mono font-medium text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[130px]" title={txn.transaction_id}>
                        {txn.transaction_id}
                      </span>
                      <button
                        onClick={(e) => handleCopy(txn.transaction_id, e)}
                        className="text-slate-500 hover:text-cyan-400 p-1 rounded"
                        title="Copy Transaction ID"
                      >
                        {copiedId === txn.transaction_id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4 font-mono font-semibold text-white">
                    ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Rail / Method */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-slate-200">{txn.payment_method}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{txn.transaction_type}</span>
                    </div>
                  </td>

                  {/* Risk Level */}
                  <td className="py-3 px-4">
                    <Badge level={txn.risk_level} size="sm">
                      {txn.risk_level}
                    </Badge>
                  </td>

                  {/* Risk Score */}
                  <td className="py-3 px-4 font-mono font-bold">
                    <span
                      className={
                        txn.risk_level === 'HIGH'
                          ? 'text-rose-400'
                          : txn.risk_level === 'MEDIUM'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {txn.risk_score.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">/100</span>
                  </td>

                  {/* Recommended Action */}
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {txn.recommended_action}
                    </span>
                  </td>

                  {/* Analyzed At */}
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(txn.analyzed_at).toLocaleTimeString()}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
