/**
 * FinShield AI — Centralized API Service
 * Handles live FastAPI communication with explicit mock fallback capability.
 * Never presents mock data silently as live results.
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
      lastKnownLiveState = true;
      return { status: data, isLive: true };
    } catch {
      lastKnownLiveState = false;
      return { status: MOCK_HEALTH_STATUS, isLive: false };
    }
  },

  /**
   * Submit transaction for fraud risk analysis
   */
  async analyzeTransaction(
    payload: TransactionAnalyzeRequest
  ): Promise<{ response: TransactionAnalyzeResponse; isLive: boolean }> {
    if (forceMockMode || !lastKnownLiveState) {
      try {
        // Try live first unless forceMockMode is set
        if (!forceMockMode) {
          const res = await this._sendLiveAnalyze(payload);
          lastKnownLiveState = true;
          return { response: res, isLive: true };
        }
      } catch {
        // Fall back to local mock
      }

      // Generate explicit mock response
      const mockResult = evaluateMockTransaction(payload);
      mockHistoryStore.unshift(mockResult);
      return { response: mockResult, isLive: false };
    }

    try {
      const res = await this._sendLiveAnalyze(payload);
      lastKnownLiveState = true;
      return { response: res, isLive: true };
    } catch (err: any) {
      // If live backend failed, fall back with transparent notice
      const mockResult = evaluateMockTransaction(payload);
      mockHistoryStore.unshift(mockResult);
      lastKnownLiveState = false;
      return { response: mockResult, isLive: false };
    }
  },

  async _sendLiveAnalyze(
    payload: TransactionAnalyzeRequest
  ): Promise<TransactionAnalyzeResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/transactions/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
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

    return (await res.json()) as TransactionAnalyzeResponse;
  },

  /**
   * Retrieve transaction history
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
      if (riskLevel && riskLevel !== 'ALL') {
        params.append('risk_level', riskLevel);
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/transactions/history?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const items = (await res.json()) as TransactionAnalyzeResponse[];
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

      const stats = (await res.json()) as TransactionStats;
      lastKnownLiveState = true;
      return { stats, isLive: true };
    } catch {
      return { stats: calculateMockStats(mockHistoryStore), isLive: false };
    }
  },
};
