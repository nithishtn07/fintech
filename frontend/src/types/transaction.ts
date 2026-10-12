/**
 * FinShield AI — Transaction Data Contracts & Type Definitions
 * Shared across Frontend and ML interfaces.
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type TransactionType =
  | 'P2P'
  | 'MERCHANT'
  | 'BILL_PAYMENT'
  | 'CASH_WITHDRAWAL'
  | 'INTERNATIONAL';

export type PaymentMethod =
  | 'UPI'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'NET_BANKING'
  | 'WALLET';

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
  payment_method: string;
  transaction_hour?: number;
  timestamp?: string;
  velocity_1h?: number;
  velocity_24h?: number;
  recipient_id?: string;
  is_new_recipient?: boolean;
}

export interface TransactionAnalyzeResponse {
  transaction_id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  payment_method: string;
  recipient_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  detected_signals: string[];
  signal_details?: SignalDetail[];
  explanation: string;
  recommended_action: string;
  analyzed_at: string;
  analysis_method: string;
}

export interface TransactionStats {
  total_transactions: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  low_risk_percentage: number;
  medium_risk_percentage: number;
  high_risk_percentage: number;
  average_risk_score: number;
  total_volume_inr: number;
}

export interface HealthStatus {
  application_name: string;
  status: string;
  message: string;
  version: string;
  environment: string;
}

export interface ApiError {
  message: string;
  status?: number;
  detail?: string;
}
