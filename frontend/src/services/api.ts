/**
 * FinShield AI — Centralized API Service
 * Aligned with official FastAPI contract (backend/app/api/transactions.py).
 * Handles live FastAPI communication with explicit mock fallback capability.
 */
import type {
  HealthStatus,
  TransactionAnalyzeRequest,
  TransactionAnalyzeResponse,
  TransactionStats,
} from '../types';
import {
  MOCK_HEALTH_STATUS,
  INITIAL_MOCK_HISTORY,
  calculateMockStats,
  evaluateMockTransaction,
} from './mockData';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '');

export class ApiError extends Error {
  status?: number;
  detail?: any;

  constructor(message: string, status?: number, detail?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

// In-memory mock store for offline frontend evaluation
let mockHistoryStore: TransactionAnalyzeResponse[] = [...INITIAL_MOCK_HISTORY];
let forceMockMode = false;
let lastKnownLiveState = false;

export const apiService = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  isMockModeForced(): boolean {
    return forceMockMode;
  },

  setForceMockMode(enabled: boolean): void {
    forceMockMode = enabled;
  },

  isLastBackendLive(): boolean {
    return lastKnownLiveState;
  },

  /**
   * Check FastAPI Backend Health
   * Supports both status "ok" (official backend) and "healthy".
   */
  async checkHealth(): Promise<{ status: HealthStatus; isLive: boolean }> {
    if (forceMockMode) {
      lastKnownLiveState = false;
      return { status: MOCK_HEALTH_STATUS, isLive: false };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/health`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Health check returned HTTP ${res.status}`);
      }

      const data = (await res.json()) as HealthStatus;
      const isOk = data.status === 'ok' || data.status === 'healthy';
      lastKnownLiveState = isOk;
      return { status: data, isLive: isOk };
    } catch {
      lastKnownLiveState = false;
      return { status: MOCK_HEALTH_STATUS, isLive: false };
    }
  },

  /**
   * Submit transaction for fraud risk analysis
   * Adapts frontend fields to official TransactionCreate schema:
   * Maps recipient_id -> recipient_account
   * Forwards additional telemetry in metadata
   */
  async analyzeTransaction(
    payload: TransactionAnalyzeRequest
  ): Promise<{ response: TransactionAnalyzeResponse; isLive: boolean }> {
    if (forceMockMode || !lastKnownLiveState) {
      try {
        if (!forceMockMode) {
          const res = await this._sendLiveAnalyze(payload);
          lastKnownLiveState = true;
          return { response: res, isLive: true };
        }
      } catch {
        // Fall back to local mock
      }

      const mockResult = evaluateMockTransaction(payload);
      mockHistoryStore.unshift(mockResult);
      return { response: mockResult, isLive: false };
    }

    try {
      const res = await this._sendLiveAnalyze(payload);
      lastKnownLiveState = true;
      return { response: res, isLive: true };
    } catch {
      const mockResult = evaluateMockTransaction(payload);
      mockHistoryStore.unshift(mockResult);
      lastKnownLiveState = false;
      return { response: mockResult, isLive: false };
    }
  },

  async _sendLiveAnalyze(
    payload: TransactionAnalyzeRequest
  ): Promise<TransactionAnalyzeResponse> {
    // Construct request conforming to backend TransactionCreate schema
    const backendPayload = {
      amount: payload.amount,
      transaction_type: payload.transaction_type,
      currency: payload.currency || 'INR',
      recipient_account: payload.recipient_account || payload.recipient_id || undefined,
      sender_account: payload.sender_account || undefined,
      timestamp: payload.timestamp || new Date().toISOString(),
      metadata: {
        payment_method: payload.payment_method,
        velocity_1h: payload.velocity_1h,
        velocity_24h: payload.velocity_24h,
        transaction_hour: payload.transaction_hour,
        is_new_recipient: payload.is_new_recipient,
        ...(payload.metadata || {}),
      },
    };

    const res = await fetch(`${API_BASE_URL}/api/v1/transactions/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(backendPayload),
    });

    if (!res.ok) {
      let detail: any = null;
      try {
        detail = await res.json();
      } catch {
        // no json
      }
      const message =
        (typeof detail?.detail === 'string'
          ? detail.detail
          : Array.isArray(detail?.detail)
          ? detail.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ')
          : detail?.message) || `HTTP error ${res.status}`;
      throw new ApiError(message, res.status, detail);
    }

    const data = (await res.json()) as TransactionAnalyzeResponse;

    // Attach contextual fields for rich UI rendering
    return {
      ...data,
      amount: data.amount ?? payload.amount,
      currency: data.currency ?? payload.currency ?? 'INR',
      transaction_type: data.transaction_type ?? payload.transaction_type,
      payment_method: data.payment_method ?? payload.payment_method ?? 'UPI',
      recipient_id: data.recipient_id ?? payload.recipient_id ?? payload.recipient_account ?? '',
    };
  },

  /**
   * Retrieve transaction history
   * Backend endpoint supports limit and offset; filters by risk_level client-side if needed.
   */
  async getHistory(
    limit: number = 50,
    offset: number = 0,
    riskLevel?: string
  ): Promise<{ items: TransactionAnalyzeResponse[]; isLive: boolean }> {
    if (forceMockMode) {
      let items = [...mockHistoryStore];
      if (riskLevel && riskLevel !== 'ALL') {
        items = items.filter((t) => t.risk_level === riskLevel);
      }
      return { items: items.slice(offset, offset + limit), isLive: false };
    }

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const res = await fetch(`${API_BASE_URL}/api/v1/transactions/history?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      let items = (await res.json()) as TransactionAnalyzeResponse[];

      // Client-side filtering when backend /history doesn't filter by risk tier
      if (riskLevel && riskLevel !== 'ALL') {
        items = items.filter((t) => t.risk_level === riskLevel);
      }

      lastKnownLiveState = true;
      return { items, isLive: true };
    } catch {
      let items = [...mockHistoryStore];
      if (riskLevel && riskLevel !== 'ALL') {
        items = items.filter((t) => t.risk_level === riskLevel);
      }
      return { items: items.slice(offset, offset + limit), isLive: false };
    }
  },

  /**
   * Fetch aggregate statistics
   * Safely computes missing percentages from raw counts.
   */
  async getStats(): Promise<{ stats: TransactionStats; isLive: boolean }> {
    if (forceMockMode) {
      return { stats: calculateMockStats(mockHistoryStore), isLive: false };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/transactions/stats`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const rawStats = (await res.json()) as TransactionStats;
      const total = rawStats.total_transactions || 0;

      // Safely compute percentage distributions if backend returns count-only
      const lowPct = total > 0 ? Math.round(((rawStats.low_risk_count || 0) / total) * 1000) / 10 : 0;
      const medPct = total > 0 ? Math.round(((rawStats.medium_risk_count || 0) / total) * 1000) / 10 : 0;
      const highPct = total > 0 ? Math.round(((rawStats.high_risk_count || 0) / total) * 1000) / 10 : 0;

      const normalizedStats: TransactionStats = {
        total_transactions: total,
        low_risk_count: rawStats.low_risk_count || 0,
        medium_risk_count: rawStats.medium_risk_count || 0,
        high_risk_count: rawStats.high_risk_count || 0,
        average_risk_score: rawStats.average_risk_score || 0,
        low_risk_percentage: rawStats.low_risk_percentage ?? lowPct,
        medium_risk_percentage: rawStats.medium_risk_percentage ?? medPct,
        high_risk_percentage: rawStats.high_risk_percentage ?? highPct,
        total_volume_inr: rawStats.total_volume_inr ?? 0,
      };

      lastKnownLiveState = true;
      return { stats: normalizedStats, isLive: true };
    } catch {
      return { stats: calculateMockStats(mockHistoryStore), isLive: false };
    }
  },
};
