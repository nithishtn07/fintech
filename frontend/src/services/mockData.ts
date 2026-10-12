/**
 * FinShield AI — Isolated Development Mock Data Fixture
 * Strictly conforms to the backend SQLite / FastAPI agreed schema.
 * Clearly labeled as synthetic demonstration data for Phase 1 MVP.
 */
import type {
  TransactionAnalyzeRequest,
  TransactionAnalyzeResponse,
  TransactionStats,
  HealthStatus,
  SignalDetail,
} from '../types';

export const MOCK_HEALTH_STATUS: HealthStatus = {
  application_name: 'FinShield AI [Local Mock Engine]',
  status: 'mock_active',
  message: 'Operating in isolated frontend development mock mode (Backend offline)',
  version: '1.0.0-mock',
  environment: 'development-mock',
};

export const INITIAL_MOCK_HISTORY: TransactionAnalyzeResponse[] = [
  {
    transaction_id: 'TXN-MOCK-NIGHT01',
    amount: 175000.0,
    currency: 'INR',
    transaction_type: 'P2P',
    payment_method: 'UPI',
    recipient_id: 'REC-DEMO-NIGHTDRAIN',
    risk_score: 86.0,
    risk_level: 'HIGH',
    detected_signals: [
      'HIGH_VALUE_UNSECURED_TRANSFER',
      'EXTREME_BURST_VELOCITY_1H',
      'HIGH_DAILY_TRANSACTION_COUNT',
      'UNUSUAL_OFF_HOURS_HIGH_RISK_ACTIVITY',
      'NEW_BENEFICIARY_INTERACTION',
      'COMPOUND_HIGH_RISK_PROFILE',
    ],
    signal_details: [
      {
        code: 'COMPOUND_HIGH_RISK_PROFILE',
        title: 'Compound Multi-Vector Threat Vector',
        description: 'Coincidence of off-hours timing (03:00), new recipient, and high velocity strongly indicates account takeover.',
        severity: 'CRITICAL',
        points: 18.0,
      },
      {
        code: 'HIGH_VALUE_UNSECURED_TRANSFER',
        title: 'Elevated Transaction Amount',
        description: 'Large sum (₹1,75,000.00) initiated via peer-to-peer transfer.',
        severity: 'WARNING',
        points: 24.0,
      },
      {
        code: 'EXTREME_BURST_VELOCITY_1H',
        title: 'Extreme Burst Frequency (1 Hour)',
        description: '6 transactions initiated in past hour exceeds rapid-burst velocity threshold.',
        severity: 'CRITICAL',
        points: 26.0,
      },
    ],
    explanation: 'Assessed as HIGH Risk (Score: 86.0/100) triggering 6 rule indicator(s). Primary risk drivers: Compound Multi-Vector Threat Vector, Elevated Transaction Amount, Extreme Burst Frequency. Recommendation: Hold transaction in quarantine. Enforce 30-minute delay and notify fraud operations desk.',
    recommended_action: 'HOLD_FOR_REVIEW',
    analyzed_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    analysis_method: 'RULE_BASED_BASELINE (Mock Development Engine)',
  },
  {
    transaction_id: 'TXN-MOCK-STRUCT02',
    amount: 49800.0,
    currency: 'INR',
    transaction_type: 'P2P',
    payment_method: 'UPI',
    recipient_id: 'REC-DEMO-SUSPECT',
    risk_score: 54.0,
    risk_level: 'MEDIUM',
    detected_signals: [
      'STRUCTURING_THRESHOLD_EVASION_SUSPECT',
      'NEW_BENEFICIARY_INTERACTION',
      'ELEVATED_VELOCITY_1H',
    ],
    signal_details: [
      {
        code: 'STRUCTURING_THRESHOLD_EVASION_SUSPECT',
        title: 'Potential Structuring Pattern',
        description: 'Transaction amount ₹49,800.00 is positioned just below statutory reporting thresholds.',
        severity: 'WARNING',
        points: 18.0,
      },
      {
        code: 'ELEVATED_VELOCITY_1H',
        title: 'Elevated Short-Term Velocity',
        description: '4 transactions within 60 minutes indicates active payment sequence.',
        severity: 'WARNING',
        points: 12.0,
      },
    ],
    explanation: 'Assessed as MEDIUM Risk (Score: 54.0/100) triggering 3 rule indicator(s). Primary risk drivers: Potential Structuring Pattern, First-Time Recipient Interaction, Elevated Short-Term Velocity. Recommendation: Challenge sender with Step-up Biometric or in-app OTP authentication.',
    recommended_action: 'STEP_UP_AUTH',
    analyzed_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    analysis_method: 'RULE_BASED_BASELINE (Mock Development Engine)',
  },
  {
    transaction_id: 'TXN-MOCK-SAFE03',
    amount: 650.0,
    currency: 'INR',
    transaction_type: 'MERCHANT',
    payment_method: 'UPI',
    recipient_id: 'REC-DEMO-GROCERY',
    risk_score: 8.0,
    risk_level: 'LOW',
    detected_signals: [],
    signal_details: [],
    explanation: 'Assessed as LOW Risk (Score: 8.0/100). Transaction amount of INR 650.00 operates within standard behavioral parameters with no anomalous velocity, timing, or beneficiary indicators. Recommendation: Authorize transaction. Standard background telemetry monitoring applies.',
    recommended_action: 'ALLOW',
    analyzed_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    analysis_method: 'RULE_BASED_BASELINE (Mock Development Engine)',
  },
  {
    transaction_id: 'TXN-MOCK-ELEC04',
    amount: 52000.0,
    currency: 'INR',
    transaction_type: 'MERCHANT',
    payment_method: 'CREDIT_CARD',
    recipient_id: 'REC-DEMO-ELECTRONICS',
    risk_score: 18.0,
    risk_level: 'LOW',
    detected_signals: ['ELEVATED_MERCHANT_VOLUME'],
    signal_details: [
      {
        code: 'ELEVATED_MERCHANT_VOLUME',
        title: 'Elevated Transaction Amount',
        description: 'Substantial transaction value (₹52,000.00) processed via verified CREDIT_CARD merchant.',
        severity: 'INFO',
        points: 10.0,
      },
    ],
    explanation: 'Assessed as LOW Risk (Score: 18.0/100). Elevated merchant volume detected but standard merchant rails and daytime execution indicate safe purchase.',
    recommended_action: 'ALLOW',
    analyzed_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    analysis_method: 'RULE_BASED_BASELINE (Mock Development Engine)',
  },
];

export function calculateMockStats(history: TransactionAnalyzeResponse[]): TransactionStats {
  const total = history.length;
  const low = history.filter((t) => t.risk_level === 'LOW').length;
  const med = history.filter((t) => t.risk_level === 'MEDIUM').length;
  const high = history.filter((t) => t.risk_level === 'HIGH').length;
  const totalVol = history.reduce((sum, t) => sum + t.amount, 0);
  const avgScore = total > 0 ? history.reduce((sum, t) => sum + t.risk_score, 0) / total : 0;

  return {
    total_transactions: total,
    low_risk_count: low,
    medium_risk_count: med,
    high_risk_count: high,
    low_risk_percentage: total > 0 ? Math.round((low / total) * 1000) / 10 : 0,
    medium_risk_percentage: total > 0 ? Math.round((med / total) * 1000) / 10 : 0,
    high_risk_percentage: total > 0 ? Math.round((high / total) * 1000) / 10 : 0,
    average_risk_score: Math.round(avgScore * 10) / 10,
    total_volume_inr: Math.round(totalVol * 100) / 100,
  };
}

export function evaluateMockTransaction(
  req: TransactionAnalyzeRequest
): TransactionAnalyzeResponse {
  let score = 8.0;
  const signals: string[] = [];
  const signalDetails: SignalDetail[] = [];

  const amount = req.amount;
  const type = req.transaction_type.toUpperCase();
  const isNew = Boolean(req.is_new_recipient);
  const hour = req.transaction_hour ?? new Date().getHours();
  const v1h = req.velocity_1h ?? 0;
  const v24h = req.velocity_24h ?? v1h;
  const recipient = req.recipient_id || `REC-${Math.random().toString(36).substring(2, 8).toUpperCase()}-IN`;

  // Structuring check
  if ((amount >= 49000 && amount <= 49999) || (amount >= 99000 && amount <= 99999)) {
    score += 18.0;
    signals.push('STRUCTURING_THRESHOLD_EVASION_SUSPECT');
    signalDetails.push({
      code: 'STRUCTURING_THRESHOLD_EVASION_SUSPECT',
      title: 'Potential Structuring Pattern',
      description: `Transaction amount ₹${amount.toLocaleString()} is positioned just below statutory reporting thresholds.`,
      severity: 'WARNING',
      points: 18.0,
    });
  }

  // High amount check
  if (amount >= 150000) {
    const points = type === 'P2P' ? 24.0 : 10.0;
    score += points;
    signals.push(type === 'P2P' ? 'HIGH_VALUE_UNSECURED_TRANSFER' : 'ELEVATED_MERCHANT_VOLUME');
    signalDetails.push({
      code: type === 'P2P' ? 'HIGH_VALUE_UNSECURED_TRANSFER' : 'ELEVATED_MERCHANT_VOLUME',
      title: 'Elevated Transaction Amount',
      description: `Large sum (₹${amount.toLocaleString()}) initiated via ${type}.`,
      severity: points > 10 ? 'WARNING' : 'INFO',
      points,
    });
  } else if (amount >= 50000 && type === 'P2P' && isNew) {
    score += 16.0;
    signals.push('MODERATE_HIGH_P2P_NEW_BENEFICIARY');
    signalDetails.push({
      code: 'MODERATE_HIGH_P2P_NEW_BENEFICIARY',
      title: 'Significant Transfer to New Recipient',
      description: `Transfer of ₹${amount.toLocaleString()} routed to newly observed recipient ${recipient}.`,
      severity: 'WARNING',
      points: 16.0,
    });
  }

  // Velocity checks
  if (v1h >= 5) {
    score += 26.0;
    signals.push('EXTREME_BURST_VELOCITY_1H');
    signalDetails.push({
      code: 'EXTREME_BURST_VELOCITY_1H',
      title: 'Extreme Burst Frequency (1 Hour)',
      description: `${v1h} transactions initiated in past hour exceeds rapid-burst velocity threshold.`,
      severity: 'CRITICAL',
      points: 26.0,
    });
  } else if (v1h >= 3) {
    score += 12.0;
    signals.push('ELEVATED_VELOCITY_1H');
    signalDetails.push({
      code: 'ELEVATED_VELOCITY_1H',
      title: 'Elevated Short-Term Velocity',
      description: `${v1h} transactions within 60 minutes indicates active payment sequence.`,
      severity: 'WARNING',
      points: 12.0,
    });
  }

  if (v24h >= 12) {
    score += 15.0;
    signals.push('HIGH_DAILY_TRANSACTION_COUNT');
    signalDetails.push({
      code: 'HIGH_DAILY_TRANSACTION_COUNT',
      title: 'High 24-Hour Transaction Frequency',
      description: `Account has performed ${v24h} transactions in the last 24 hours.`,
      severity: 'WARNING',
      points: 15.0,
    });
  }

  // Off-hours
  const isLateNight = hour >= 1 && hour <= 4;
  if (isLateNight) {
    const points = isNew || v1h >= 2 || type === 'P2P' ? 22.0 : 8.0;
    score += points;
    signals.push(points > 8 ? 'UNUSUAL_OFF_HOURS_HIGH_RISK_ACTIVITY' : 'OFF_HOURS_ACTIVITY');
    signalDetails.push({
      code: points > 8 ? 'UNUSUAL_OFF_HOURS_HIGH_RISK_ACTIVITY' : 'OFF_HOURS_ACTIVITY',
      title: 'Off-Hours Payment Execution',
      description: `Transaction initiated during non-standard hours (${hour.toString().padStart(2, '0')}:00).`,
      severity: points > 8 ? 'CRITICAL' : 'INFO',
      points,
    });
  }

  if (isNew) {
    score += 12.0;
    signals.push('NEW_BENEFICIARY_INTERACTION');
    signalDetails.push({
      code: 'NEW_BENEFICIARY_INTERACTION',
      title: 'First-Time Recipient Interaction',
      description: `Target recipient ${recipient} has no established historical transaction record.`,
      severity: 'INFO',
      points: 12.0,
    });
  }

  if (isLateNight && isNew && (v1h >= 2 || amount >= 25000)) {
    score += 18.0;
    signals.push('COMPOUND_HIGH_RISK_PROFILE');
    signalDetails.push({
      code: 'COMPOUND_HIGH_RISK_PROFILE',
      title: 'Compound Multi-Vector Threat Vector',
      description: 'Off-hours timing, new unverified beneficiary, and elevated velocity/amount strongly indicate scam or takeover.',
      severity: 'CRITICAL',
      points: 18.0,
    });
  }

  const finalScore = Math.min(Math.max(Math.round(score * 10) / 10, 0), 100);
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let recommendedAction = 'ALLOW';
  let actionDesc = 'Authorize transaction. Standard background telemetry monitoring applies.';

  if (finalScore > 70) {
    riskLevel = 'HIGH';
    recommendedAction = 'HOLD_FOR_REVIEW';
    actionDesc = 'Hold transaction in quarantine. Enforce 30-minute delay and notify fraud operations desk.';
  } else if (finalScore > 35) {
    riskLevel = 'MEDIUM';
    recommendedAction = 'STEP_UP_AUTH';
    actionDesc = 'Challenge sender with Step-up Biometric or in-app OTP authentication before fund release.';
  }

  const explanation =
    signals.length === 0
      ? `Assessed as ${riskLevel} Risk (Score: ${finalScore}/100). Transaction amount of ${req.currency || 'INR'} ${amount.toLocaleString()} operates within standard behavioral parameters. Recommendation: ${actionDesc}`
      : `Assessed as ${riskLevel} Risk (Score: ${finalScore}/100) triggering ${signals.length} rule indicator(s). Primary risk drivers: ${signalDetails.map((s) => s.title).slice(0, 3).join(', ')}. Recommendation: ${actionDesc}`;

  return {
    transaction_id: `TXN-MOCK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    amount,
    currency: req.currency || 'INR',
    transaction_type: req.transaction_type,
    payment_method: req.payment_method,
    recipient_id: recipient,
    risk_score: finalScore,
    risk_level: riskLevel,
    detected_signals: signals,
    signal_details: signalDetails,
    explanation,
    recommended_action: recommendedAction,
    analyzed_at: new Date().toISOString(),
    analysis_method: 'RULE_BASED_BASELINE (Mock Development Engine)',
  };
}
