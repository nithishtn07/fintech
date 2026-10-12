"""Transaction feature extraction pipeline for FinShield AI."""
import math
from datetime import datetime, timezone
from typing import Any, Dict, Union

from ml.exceptions import FeatureExtractionError
from ml.schemas import MLFeatureVector


FEATURE_NAMES = [
    "amount",
    "amount_log",
    "is_structuring_range",
    "transaction_hour",
    "is_late_night",
    "velocity_1h",
    "velocity_24h",
    "velocity_acceleration",
    "is_new_recipient",
    "rail_upi",
    "rail_credit_card",
    "rail_debit_card",
    "rail_net_banking",
    "rail_wallet",
    "type_p2p",
    "type_merchant",
    "type_bill_payment",
    "type_cash_withdrawal",
    "type_international",
]


class TransactionFeatureExtractor:
    """Extracts standardized numeric feature vector from transaction records."""

    @classmethod
    def extract_features(
        cls,
        transaction_data: Union[Dict[str, Any], Any]
    ) -> MLFeatureVector:
        """Transforms a raw transaction dictionary or object into a standardized feature vector."""
        try:
            # Normalize access whether dict or Pydantic/dataclass object
            get = (
                (lambda k, d=None: transaction_data.get(k, d))
                if isinstance(transaction_data, dict)
                else (lambda k, d=None: getattr(transaction_data, k, d))
            )

            # Amount extraction
            raw_amount = get("amount")
            if raw_amount is None:
                raise FeatureExtractionError("Missing required transaction field: 'amount'")
            try:
                amount = float(raw_amount)
                if amount <= 0:
                    raise FeatureExtractionError("Transaction amount must be strictly greater than 0")
            except (ValueError, TypeError) as err:
                raise FeatureExtractionError(f"Invalid amount value '{raw_amount}': {err}")

            # Amount log transform: log1p(amount)
            amount_log = math.log1p(amount)

            # Structuring detection (Amounts near statutory ₹50k or ₹100k thresholds)
            is_structuring = 1 if ((49000 <= amount <= 49999) or (99000 <= amount <= 99999)) else 0

            # Hour of transaction
            hour = get("transaction_hour")
            if hour is None:
                timestamp = get("timestamp")
                if isinstance(timestamp, datetime):
                    hour = timestamp.hour
                elif isinstance(timestamp, str):
                    try:
                        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                        hour = dt.hour
                    except Exception:
                        hour = datetime.now(timezone.utc).hour
                else:
                    hour = datetime.now(timezone.utc).hour
            else:
                hour = int(hour)
                if not (0 <= hour <= 23):
                    raise FeatureExtractionError(f"Hour must be in range 0-23, received {hour}")

            # Late night flag (01:00 to 04:59)
            is_late_night = 1 if (1 <= hour <= 4) else 0

            # Velocity metrics
            v1h_raw = get("velocity_1h", 0)
            v24h_raw = get("velocity_24h", v1h_raw)
            velocity_1h = max(int(v1h_raw if v1h_raw is not None else 0), 0)
            velocity_24h = max(int(v24h_raw if v24h_raw is not None else velocity_1h), 0)

            # Velocity acceleration: short term velocity vs expected hourly average from 24h
            baseline_hourly = max(velocity_24h / 24.0, 0.1)
            velocity_acceleration = round(velocity_1h / baseline_hourly, 2)

            # Beneficiary risk
            is_new_recipient = 1 if bool(get("is_new_recipient", False)) else 0

            # Payment rails one-hot
            rail = str(get("payment_method", "UPI")).strip().upper()
            rail_upi = 1 if rail == "UPI" else 0
            rail_credit_card = 1 if rail in ["CREDIT_CARD", "CREDIT"] else 0
            rail_debit_card = 1 if rail in ["DEBIT_CARD", "DEBIT"] else 0
            rail_net_banking = 1 if rail in ["NET_BANKING", "NETBANKING", "IMPS", "NEFT"] else 0
            rail_wallet = 1 if rail in ["WALLET", "DIGITAL_WALLET"] else 0

            # Transaction type one-hot
            txn_type = str(get("transaction_type", "P2P")).strip().upper()
            type_p2p = 1 if txn_type == "P2P" else 0
            type_merchant = 1 if txn_type in ["MERCHANT", "COMMERCE"] else 0
            type_bill_payment = 1 if txn_type in ["BILL_PAYMENT", "BILLPAY", "UTILITY"] else 0
            type_cash_withdrawal = 1 if txn_type in ["CASH_WITHDRAWAL", "ATM"] else 0
            type_international = 1 if txn_type in ["INTERNATIONAL", "CROSS_BORDER"] else 0

            return MLFeatureVector(
                amount=amount,
                amount_log=amount_log,
                is_structuring_range=is_structuring,
                transaction_hour=hour,
                is_late_night=is_late_night,
                velocity_1h=velocity_1h,
                velocity_24h=velocity_24h,
                velocity_acceleration=velocity_acceleration,
                is_new_recipient=is_new_recipient,
                rail_upi=rail_upi,
                rail_credit_card=rail_credit_card,
                rail_debit_card=rail_debit_card,
                rail_net_banking=rail_net_banking,
                rail_wallet=rail_wallet,
                type_p2p=type_p2p,
                type_merchant=type_merchant,
                type_bill_payment=type_bill_payment,
                type_cash_withdrawal=type_cash_withdrawal,
                type_international=type_international,
            )
        except FeatureExtractionError:
            raise
        except Exception as exc:
            raise FeatureExtractionError(f"Unexpected error extracting features: {exc}") from exc
