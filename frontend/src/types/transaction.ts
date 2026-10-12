/**
 * FinShield AI — Transaction Data Contracts & Type Definitions
 * Aligned with official FastAPI schemas (backend/app/schemas/transaction.py).
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type TransactionType =
  | 'P2P'
  | 'MERCHANT'
  | 'BILL_PAYMENT'
  | 'CASH_WITHDRAWAL'
  | 'INTERNATIONAL'
  | 'transfer'
  | 'payment'
  | 'withdrawal'
  | string;

export type PaymentMethod =
  | 'UPI'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'NET_BANKING'
  | 'WALLET'
  | string;

export interface SignalDetail {
  code: string;
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  points: number;
}

export interface TransactionAnalyzeRequest {
  amount: number;
  currency?: string;
  transaction_type: string;
  payment_method?: string;
  transaction_hour?: number;
  timestamp?: string;
  velocity_1h?: number;
  velocity_24h?: number;
  recipient_id?: string;
  recipient_account?: string;
  sender_account?: string;
  is_new_recipient?: boolean;
  metadata?: Record<string, any>;
}

export interface TransactionAnalyzeResponse {
  transaction_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  detected_signals: string[];
  explanation: string;
  recommended_action: string;
  analysis_method: string;
  analyzed_at: string;
  // Context fields preserved for UI rendering
  amount?: number;
  currency?: string;
  transaction_type?: string;
  payment_method?: string;
  recipient_id?: string;
  signal_details?: SignalDetail[];
}

export interface TransactionStats {
  total_transactions: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  average_risk_score: number;
  // Computed client-side if omitted by backend
  low_risk_percentage?: number;
  medium_risk_percentage?: number;
  high_risk_percentage?: number;
  total_volume_inr?: number;
}

export interface HealthStatus {
  status: string; // 'ok' or 'healthy'
  service?: string;
  application_name?: string;
  message?: string;
  version?: string;
  environment?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  detail?: string;
}
