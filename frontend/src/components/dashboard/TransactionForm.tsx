import React, { useState } from 'react';
import {
  Send,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Clock,
  Zap,
  UserCheck,
} from 'lucide-react';
import type {
  TransactionAnalyzeRequest,
  TransactionType,
  PaymentMethod,
} from '../../types';

interface TransactionFormProps {
  onSubmit: (data: TransactionAnalyzeRequest) => Promise<void>;
  loading: boolean;
  errorMessage: string | null;
}

const PRESET_SCENARIOS = [
  {
    name: 'Daytime Grocery (Safe)',
    badge: 'LOW RISK',
    badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
    data: {
      amount: 450,
      currency: 'INR',
      transaction_type: 'MERCHANT' as TransactionType,
      payment_method: 'UPI' as PaymentMethod,
      transaction_hour: 14,
      velocity_1h: 1,
      velocity_24h: 3,
      recipient_id: 'REC-DEMO-GROCERY',
      is_new_recipient: false,
    },
  },
  {
    name: 'Regulatory Structuring (₹49,800)',
    badge: 'MEDIUM RISK',
    badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-500/30',
    data: {
      amount: 49800,
      currency: 'INR',
      transaction_type: 'P2P' as TransactionType,
      payment_method: 'UPI' as PaymentMethod,
      transaction_hour: 19,
      velocity_1h: 3,
      velocity_24h: 5,
      recipient_id: 'REC-DEMO-SUSPECT',
      is_new_recipient: true,
    },
  },
  {
    name: 'Midnight Drain Scam (₹1,75,000)',
    badge: 'HIGH RISK',
    badgeColor: 'text-rose-400 bg-rose-950/60 border-rose-500/30',
    data: {
      amount: 175000,
      currency: 'INR',
      transaction_type: 'P2P' as TransactionType,
      payment_method: 'UPI' as PaymentMethod,
      transaction_hour: 3,
      velocity_1h: 6,
      velocity_24h: 14,
      recipient_id: 'REC-DEMO-NIGHTDRAIN',
      is_new_recipient: true,
    },
  },
];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  loading,
  errorMessage,
}) => {
  const [amount, setAmount] = useState<string>('2450.00');
  const [currency] = useState<string>('INR');
  const [transactionType, setTransactionType] = useState<TransactionType>('P2P');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionHour, setTransactionHour] = useState<string>('14');
  const [velocity1h, setVelocity1h] = useState<string>('1');
  const [velocity24h, setVelocity24h] = useState<string>('3');
  const [recipientId, setRecipientId] = useState<string>('REC-DEMO-8910');
  const [isNewRecipient, setIsNewRecipient] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [clientError, setClientError] = useState<string | null>(null);

  const handleApplyPreset = (preset: (typeof PRESET_SCENARIOS)[0]) => {
    setAmount(preset.data.amount.toString());
    setTransactionType(preset.data.transaction_type);
    setPaymentMethod(preset.data.payment_method);
    setTransactionHour(preset.data.transaction_hour.toString());
    setVelocity1h(preset.data.velocity_1h.toString());
    setVelocity24h(preset.data.velocity_24h.toString());
    setRecipientId(preset.data.recipient_id);
    setIsNewRecipient(preset.data.is_new_recipient);
    setClientError(null);
  };

  const handleReset = () => {
    setAmount('1000.00');
    setTransactionType('P2P');
    setPaymentMethod('UPI');
    setTransactionHour(new Date().getHours().toString());
    setVelocity1h('0');
    setVelocity24h('1');
    setRecipientId('REC-DEMO-USER');
    setIsNewRecipient(false);
    setClientError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setClientError('Transaction amount must be a positive number greater than 0.');
      return;
    }

    const parsedHour = parseInt(transactionHour, 10);
    if (!isNaN(parsedHour) && (parsedHour < 0 || parsedHour > 23)) {
      setClientError('Transaction hour must be between 0 and 23.');
      return;
    }

    const parsedVel1 = parseInt(velocity1h, 10);
    if (!isNaN(parsedVel1) && parsedVel1 < 0) {
      setClientError('Velocity (1h) cannot be negative.');
      return;
    }

    const parsedVel24 = parseInt(velocity24h, 10);
    if (!isNaN(parsedVel24) && parsedVel24 < 0) {
      setClientError('Velocity (24h) cannot be negative.');
      return;
    }

    const payload: TransactionAnalyzeRequest = {
      amount: parsedAmount,
      currency,
      transaction_type: transactionType,
      payment_method: paymentMethod,
      transaction_hour: !isNaN(parsedHour) ? parsedHour : undefined,
      velocity_1h: !isNaN(parsedVel1) ? parsedVel1 : undefined,
      velocity_24h: !isNaN(parsedVel24) ? parsedVel24 : undefined,
      recipient_id: recipientId.trim() || undefined,
      recipient_account: recipientId.trim() || undefined,
      is_new_recipient: isNewRecipient,
    };

    await onSubmit(payload);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative cyber backdrop line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

      {/* Header & Preset Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>Transaction Risk Evaluator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate digital transaction payloads against statutory thresholds and behavioral heuristics
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Form</span>
        </button>
      </div>

      {/* Quick Demonstration Presets */}
      <div className="my-4 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-semibold uppercase tracking-wider">Demo Quick Presets</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_SCENARIOS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-all hover:border-cyan-500/40"
            >
              <span>{p.name}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${p.badgeColor}`}>
                {p.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Validation / API Error Banner */}
      {(clientError || errorMessage) && (
        <div className="mb-4 p-3.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold font-mono">Validation or Request Notice</span>
            <p className="text-rose-200/90">{clientError || errorMessage}</p>
          </div>
        </div>
      )}

      {/* Analysis Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wide">
              Amount (INR ₹) <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={loading}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-slate-600"
              />
            </div>
            <span className="text-[11px] text-slate-500">
              Positive amount without commas
            </span>
          </div>

          {/* Transaction Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wide">
              Transaction Rail / Type <span className="text-cyan-400">*</span>
            </label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as TransactionType)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            >
              <option value="P2P">P2P (Peer-to-Peer)</option>
              <option value="MERCHANT">MERCHANT (E-Commerce / Store)</option>
              <option value="BILL_PAYMENT">BILL_PAYMENT (Utilities)</option>
              <option value="CASH_WITHDRAWAL">CASH_WITHDRAWAL (ATM)</option>
              <option value="INTERNATIONAL">INTERNATIONAL (Cross-Border)</option>
            </select>
            <span className="text-[11px] text-slate-500">
              Evaluation adjusts weights based on channel
            </span>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wide">
              Payment Instrument <span className="text-cyan-400">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            >
              <option value="UPI">UPI (Unified Payments Interface)</option>
              <option value="CREDIT_CARD">CREDIT_CARD (Mastercard / Visa)</option>
              <option value="DEBIT_CARD">DEBIT_CARD</option>
              <option value="NET_BANKING">NET_BANKING (IMPS / NEFT)</option>
              <option value="WALLET">DIGITAL WALLET</option>
            </select>
            <span className="text-[11px] text-slate-500">
              Instrument rail telemetry
            </span>
          </div>
        </div>

        {/* Behavioral & Temporal Signals (Collapsible / Advanced) */}
        <div className="pt-2">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Behavioral & Telemetry Signals</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline"
            >
              {showAdvanced ? 'Hide Signals' : 'Configure Signals'}
            </button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
              {/* Transaction Hour */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hour (0-23)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={transactionHour}
                  onChange={(e) => setTransactionHour(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-500">01-04 is off-hours</span>
              </div>

              {/* Velocity 1h */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300">
                  Velocity (Past 1h)
                </label>
                <input
                  type="number"
                  min="0"
                  value={velocity1h}
                  onChange={(e) => setVelocity1h(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-500">Burst threshold ≥ 3</span>
              </div>

              {/* Velocity 24h */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300">
                  Velocity (Past 24h)
                </label>
                <input
                  type="number"
                  min="0"
                  value={velocity24h}
                  onChange={(e) => setVelocity24h(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-500">Daily threshold ≥ 12</span>
              </div>

              {/* Recipient ID & Is New Flag */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300">
                  Recipient ID
                </label>
                <input
                  type="text"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  disabled={loading}
                  placeholder="REC-XXXX-IN"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 placeholder-slate-600"
                />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewRecipient}
                    onChange={(e) => setIsNewRecipient(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 flex items-center gap-1 font-mono">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    New Beneficiary
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-2 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-mono">
            Synthetic demo only • Never input real credentials or OTPs
          </p>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-glow-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Evaluating Risk Vector...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Analyze Transaction</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
