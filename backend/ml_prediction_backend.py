# backend/ml_prediction_backend.py
# ================= ML PREDICTION MODULE =================
# Real-time ML model predictions using trained XGBoost models
# This module loads models and generates predictions from historical data

import os
import pickle
import glob
import warnings
import logging
from typing import Dict, Any, List
from datetime import datetime

import pandas as pd
import numpy as np
import holidays
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sklearn.preprocessing import LabelEncoder

from .db_dependencies import get_db
from backend.database.schemas import Top100Part

# ------------------------------------------------------------
# Logging
# ------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("ML_PREDICTION")

warnings.filterwarnings("ignore")

router = APIRouter()

# ------------------------------------------------------------
# Paths & Cache
# ------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
MODEL_BASE_PATH = os.path.join(ROOT_DIR, "MNAO")

model_cache: Dict[str, Dict[str, Any]] = {}

# ------------------------------------------------------------
# Constants
# ------------------------------------------------------------
ALL_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

PREDICTION_YEAR = 2025

# ------------------------------------------------------------
# Pydantic Models
# ------------------------------------------------------------
class PredictionRequest(BaseModel):
    dealer_code: str
    part_number: str
    month: str


class PredictionResponse(BaseModel):
    predicted_quantity: int
    pi_suggested_stock: int


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def robust_load(path: str):
    """Load pickle file with fallback to latin1 encoding"""
    logger.info(f"[LOAD] {os.path.basename(path)}")
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except Exception:
        with open(path, "rb") as f:
            return pickle.load(f, encoding="latin1")


def safe_float(val, default=0.0):
    """Safely convert value to float"""
    try:
        return float(val)
    except Exception:
        return float(default)


def month_to_number(m: str) -> int:
    """Convert month name or number to integer (1-12)"""
    m = m.strip()
    if m.isdigit():
        return int(m)
    if m.capitalize() in ALL_MONTHS:
        return ALL_MONTHS.index(m.capitalize()) + 1
    raise ValueError(f"Invalid month: {m}")


# ------------------------------------------------------------
# Load Model Assets (Task 2.1)
# ------------------------------------------------------------
def load_model_assets(dealer_code: str) -> Dict[str, Any]:
    """
    Load all model assets for a dealer from disk.
    
    Args:
        dealer_code: The dealer identifier
        
    Returns:
        Dictionary containing:
        - model: XGBoost model
        - part_encoder: LabelEncoder for part numbers
        - default_3month_avg: Dict with dealer_part_medians and global_median
        - default_6month_avg: Dict with dealer_part_medians and global_median
        - default_3month_std: Dict with dealer_part_medians and global_median
        - is_active_mapping: Dict mapping encoded part_no to is_active status
        
    Raises:
        HTTPException: 404 if model directory not found, 500 if loading fails
    """
    dealer_code = dealer_code.strip()

    # Check cache first
    if dealer_code in model_cache:
        logger.info(f"[CACHE HIT] Model assets for dealer {dealer_code}")
        return model_cache[dealer_code]

    # Construct model directory path
    model_dir = os.path.join(MODEL_BASE_PATH, f"TEST_MODEL_en_{dealer_code}")

    if not os.path.exists(model_dir):
        logger.error(f"[404] Model directory not found: {model_dir}")
        raise HTTPException(status_code=404, detail="Model not found for dealer")

    try:
        # Load XGBoost model
        model_files = sorted(
            glob.glob(os.path.join(model_dir, "inventory_model*.pkl")),
            reverse=True,
        )

        if not model_files:
            logger.error(f"[500] No model file found in {model_dir}")
            raise HTTPException(status_code=500, detail="Model file missing")

        assets: Dict[str, Any] = {}
        assets["model"] = robust_load(model_files[0])
        logger.info(f"[LOADED] Model from {os.path.basename(model_files[0])}")

        # Load auxiliary pickle files
        aux_files = [
            "part_encoder.pkl",
            "default_3month_avg.pkl",
            "default_6month_avg.pkl",
            "default_3month_std.pkl",
            "is_active_mapping.pkl",
        ]

        for name in aux_files:
            path = os.path.join(model_dir, name)
            if os.path.exists(path):
                assets[name.replace(".pkl", "")] = robust_load(path)
            else:
                logger.warning(f"[MISSING] {name} not found, using empty dict")
                assets[name.replace(".pkl", "")] = {}

        # Cache the loaded assets
        model_cache[dealer_code] = assets
        logger.info(f"[CACHED] Model assets for dealer {dealer_code}")
        
        return assets

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[500] Error loading model assets: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")


# ------------------------------------------------------------
# Historical Data Fetching (Task 3.1)
# ------------------------------------------------------------
def fetch_historical_data(cursor, dealer_code: str, part_number: str) -> pd.DataFrame:
    """
    Fetch historical purchase data for a specific part.
    
    Args:
        cursor: Database cursor
        dealer_code: The dealer identifier
        part_number: The part number
        
    Returns:
        DataFrame with columns: dealer_code, part_no, ordr_entry_date, 
        purchase_qty, is_active
        
    Raises:
        Exception: If database query fails
    """
    try:
        # Query with LEFT JOIN for is_active calculation
        query = """
        SELECT 
            TRIM(pp.dealer_code) as dealer_code,
            TRIM(pp.part_no) as part_no,
            pp.ordr_entry_date,
            pp.purchase_qty,
            CASE 
                WHEN GREATEST(
                    COALESCE(lp.last_purchase_date, DATE '1900-01-01'),
                    COALESCE(ls.last_sales_date, DATE '1900-01-01')
                ) >= DATE '2025-08-01' - INTERVAL '9 months'
                THEN 1 ELSE 0
            END AS is_active
        FROM parts_purchase_data_mci pp
        LEFT JOIN (
            SELECT dealer_code, part_no, MAX(ordr_entry_date) AS last_purchase_date
            FROM parts_purchase_data_mci
            GROUP BY dealer_code, part_no
        ) lp ON pp.dealer_code = lp.dealer_code AND pp.part_no = lp.part_no
        LEFT JOIN (
            SELECT dealer_code, REPLACE(part_no,'-','') AS part_no, MAX(invoice_date) AS last_sales_date
            FROM parts_sales_data_mci
            GROUP BY dealer_code, part_no
        ) ls ON pp.dealer_code = ls.dealer_code AND pp.part_no = ls.part_no
        WHERE TRIM(pp.dealer_code) = %s
          AND UPPER(TRIM(pp.part_no)) = %s
        ORDER BY pp.ordr_entry_date ASC
        """
        
        cursor.execute(query, (dealer_code.strip(), part_number.strip().upper()))
        rows = cursor.fetchall()
        
        if not rows:
            logger.info(f"[NO DATA] No historical data for dealer={dealer_code}, part={part_number}")
            return pd.DataFrame(columns=['dealer_code', 'part_no', 'ordr_entry_date', 'purchase_qty', 'is_active'])
        
        # Convert to DataFrame
        df = pd.DataFrame(rows)
        
        # Convert ordr_entry_date to datetime
        df['ordr_entry_date'] = pd.to_datetime(df['ordr_entry_date'], errors='coerce')
        
        # Drop rows with null ordr_entry_date or purchase_qty
        initial_count = len(df)
        df = df.dropna(subset=['ordr_entry_date', 'purchase_qty'])
        dropped_count = initial_count - len(df)
        
        if dropped_count > 0:
            logger.info(f"[CLEANED] Dropped {dropped_count} rows with null values")
        
        # Sort by ordr_entry_date ascending
        df = df.sort_values(by='ordr_entry_date', ascending=True)
        
        logger.info(f"[FETCHED] {len(df)} historical records for dealer={dealer_code}, part={part_number}")
        
        return df
        
    except Exception as e:
        logger.exception(f"[ERROR] Failed to fetch historical data: {e}")
        raise


# ------------------------------------------------------------
# Feature Engineering Functions (Task 4)
# ------------------------------------------------------------

# Task 4.1: Compute Rolling Features
def compute_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute 3-month avg, 6-month avg, 3-month std.
    
    Args:
        df: DataFrame with ordr_entry_date and purchase_qty columns
        
    Returns:
        DataFrame with added rolling feature columns
    """
    if df.empty:
        return df
    
    # Set ordr_entry_date as index
    df = df.copy()
    df.set_index('ordr_entry_date', inplace=True)
    
    # Group by part_no and calculate rolling features
    df['3_month_avg'] = df.groupby('part_no')['purchase_qty'].transform(
        lambda x: x.rolling('90D', min_periods=1).mean()
    )
    
    df['6_month_avg'] = df.groupby('part_no')['purchase_qty'].transform(
        lambda x: x.rolling('180D', min_periods=1).mean()
    )
    
    df['3_month_std'] = df.groupby('part_no')['purchase_qty'].transform(
        lambda x: x.rolling('90D', min_periods=1).std().fillna(0)
    )
    
    # Reset index
    df.reset_index(inplace=True)
    
    logger.info(f"[ROLLING] Computed rolling features for {len(df)} records")
    
    return df


# Task 4.2: Compute Lag Features
def compute_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute lag_1, lag_7 (matching training features).
    
    Args:
        df: DataFrame with part_no and purchase_qty columns
        
    Returns:
        DataFrame with added lag feature columns
    """
    if df.empty:
        return df
    
    df = df.copy()
    
    # Calculate lag features (only lag_1 and lag_7 to match training)
    for lag in [1, 7]:
        df[f'lag_{lag}'] = df.groupby('part_no')['purchase_qty'].shift(lag)
        
        # Fill missing lags with 3_month_avg, then 6_month_avg
        if '3_month_avg' in df.columns:
            df[f'lag_{lag}'] = df[f'lag_{lag}'].fillna(df['3_month_avg'])
        if '6_month_avg' in df.columns:
            df[f'lag_{lag}'] = df[f'lag_{lag}'].fillna(df['6_month_avg'])
        
        # Fill any remaining NaN with 0
        df[f'lag_{lag}'] = df[f'lag_{lag}'].fillna(0)
    
    logger.info(f"[LAGS] Computed lag features for {len(df)} records")
    
    return df


# Task 4.3: Compute Temporal Features
def compute_temporal_features(date: datetime) -> Dict[str, int]:
    """
    Extract year, month, day_of_week, week_of_year, is_holiday.
    
    Args:
        date: The prediction date
        
    Returns:
        Dictionary with temporal features
    """
    us_holidays = holidays.US()
    
    features = {
        'year': date.year,
        'month': date.month,
        'day_of_week': date.weekday(),
        'week_of_year': date.isocalendar()[1],
        'is_holiday': 1 if date in us_holidays else 0
    }
    
    logger.info(f"[TEMPORAL] Extracted features for {date.date()}: {features}")
    
    return features


# Task 4.4: Get Default Statistics
def get_default_statistics(part_no: str, dealer_code: str, assets: Dict[str, Any]) -> Dict[str, float]:
    """
    Get default 3m avg, 6m avg, 3m std for a part.
    
    Args:
        part_no: The part number
        dealer_code: The dealer code
        assets: Loaded model assets
        
    Returns:
        Dictionary with default values
    """
    defaults = {}
    
    # Create lookup key as tuple (dealer_code, part_no)
    lookup_key = (dealer_code, part_no)
    
    # Get 3-month avg
    default_3m = assets.get('default_3month_avg', {})
    dealer_part_medians_3m = default_3m.get('dealer_part_medians', {})
    global_median_3m = default_3m.get('global_median', 0.0)
    defaults['3_month_avg'] = dealer_part_medians_3m.get(lookup_key, global_median_3m)
    
    # Get 6-month avg
    default_6m = assets.get('default_6month_avg', {})
    dealer_part_medians_6m = default_6m.get('dealer_part_medians', {})
    global_median_6m = default_6m.get('global_median', 0.0)
    defaults['6_month_avg'] = dealer_part_medians_6m.get(lookup_key, global_median_6m)
    
    # Get 3-month std
    default_std = assets.get('default_3month_std', {})
    dealer_part_medians_std = default_std.get('dealer_part_medians', {})
    global_median_std = default_std.get('global_median', 0.0)
    defaults['3_month_std'] = dealer_part_medians_std.get(lookup_key, global_median_std)
    
    logger.info(f"[DEFAULTS] Using default statistics for dealer={dealer_code}, part={part_no}: {defaults}")
    
    return defaults


# Task 4.5: Encode Part Number
def encode_part_number(part_no: str, encoder: LabelEncoder) -> int:
    """
    Encode part number, return -1 if unseen.
    
    Args:
        part_no: The part number to encode
        encoder: The LabelEncoder from training
        
    Returns:
        Encoded integer value or -1 if unseen
    """
    try:
        if hasattr(encoder, 'classes_') and part_no in encoder.classes_:
            encoded = int(encoder.transform([part_no])[0])
            logger.info(f"[ENCODE] Part {part_no} encoded to {encoded}")
            return encoded
        else:
            logger.warning(f"[ENCODE] Part {part_no} not in encoder classes, using -1")
            return -1
    except Exception as e:
        logger.warning(f"[ENCODE] Error encoding part {part_no}: {e}, using -1")
        return -1


# Task 4.6: Get is_active Status
def get_is_active(encoded_part_no: int, is_active_mapping: Dict[int, int]) -> int:
    """
    Look up encoded_part_no in is_active_mapping.
    
    Args:
        encoded_part_no: The encoded part number
        is_active_mapping: Mapping from encoded part_no to is_active status
        
    Returns:
        is_active value (0 or 1)
    """
    is_active = is_active_mapping.get(encoded_part_no, 0)
    logger.info(f"[IS_ACTIVE] Encoded part {encoded_part_no} -> is_active={is_active}")
    return is_active


# ------------------------------------------------------------
# Main Feature Computation (Task 6.1)
# ------------------------------------------------------------
def compute_features(
    historical_df: pd.DataFrame,
    prediction_date: datetime,
    part_number: str,
    dealer_code: str,
    assets: Dict[str, Any]
) -> pd.DataFrame:
    """
    Compute all features required for model prediction.
    
    Args:
        historical_df: Historical purchase data
        prediction_date: Date for which to predict
        part_number: The part number (for defaults lookup)
        dealer_code: The dealer code (for encoding)
        assets: Loaded model assets
        
    Returns:
        Single-row DataFrame with feature columns matching training:
        dealer_code, part_no, year, month, day_of_week, week_of_year, is_holiday,
        3_month_avg, 6_month_avg, 3_month_std, lag_1, lag_7, is_active
    """
    logger.info(f"[COMPUTE_FEATURES] Starting feature computation for part {part_number}")
    
    # Get temporal features
    temporal_features = compute_temporal_features(prediction_date)
    
    # Encode dealer code
    dealer_encoder = assets.get('dealer_encoder', LabelEncoder())
    try:
        if hasattr(dealer_encoder, 'classes_') and dealer_code in dealer_encoder.classes_:
            encoded_dealer = int(dealer_encoder.transform([dealer_code])[0])
        else:
            encoded_dealer = 0  # Default if not in encoder
    except:
        encoded_dealer = 0
    
    # Encode part number
    part_encoder = assets.get('part_encoder', LabelEncoder())
    encoded_part_no = encode_part_number(part_number, part_encoder)
    
    # Get is_active status
    is_active_mapping = assets.get('is_active_mapping', {})
    is_active = get_is_active(encoded_part_no, is_active_mapping)
    
    # Initialize feature values
    if historical_df.empty or len(historical_df) == 0:
        # Use default statistics when no historical data
        logger.info(f"[NO_HISTORY] Using default statistics for part {part_number}")
        defaults = get_default_statistics(part_number, dealer_code, assets)
        
        features = {
            'dealer_code': encoded_dealer,
            'part_no': encoded_part_no,
            'year': temporal_features['year'],
            'month': temporal_features['month'],
            'day_of_week': temporal_features['day_of_week'],
            'week_of_year': temporal_features['week_of_year'],
            'is_holiday': temporal_features['is_holiday'],
            '3_month_avg': defaults.get('3_month_avg', 0.0),
            '6_month_avg': defaults.get('6_month_avg', 0.0),
            '3_month_std': defaults.get('3_month_std', 0.0),
            'lag_1': defaults.get('3_month_avg', 0.0),
            'lag_7': defaults.get('3_month_avg', 0.0),
            'is_active': is_active
        }
    else:
        # Compute rolling features
        df_with_rolling = compute_rolling_features(historical_df)
        
        # Compute lag features
        df_with_lags = compute_lag_features(df_with_rolling)
        
        # Get the most recent record (last row after sorting)
        latest_record = df_with_lags.iloc[-1]
        
        # Extract feature values from latest record
        features = {
            'dealer_code': encoded_dealer,
            'part_no': encoded_part_no,
            'year': temporal_features['year'],
            'month': temporal_features['month'],
            'day_of_week': temporal_features['day_of_week'],
            'week_of_year': temporal_features['week_of_year'],
            'is_holiday': temporal_features['is_holiday'],
            '3_month_avg': float(latest_record.get('3_month_avg', 0.0)),
            '6_month_avg': float(latest_record.get('6_month_avg', 0.0)),
            '3_month_std': float(latest_record.get('3_month_std', 0.0)),
            'lag_1': float(latest_record.get('lag_1', 0.0)),
            'lag_7': float(latest_record.get('lag_7', 0.0)),
            'is_active': is_active
        }
    
    # Create single-row DataFrame with correct column order (matching training)
    feature_df = pd.DataFrame([features], columns=[
        'dealer_code', 'part_no', 'year', 'month', 'day_of_week', 'week_of_year', 'is_holiday',
        '3_month_avg', '6_month_avg', '3_month_std', 'lag_1', 'lag_7', 'is_active'
    ])
    
    logger.info(f"[FEATURES_READY] Computed {len(feature_df.columns)} features")
    
    return feature_df


# ------------------------------------------------------------
# Prediction Generation (Task 7.1)
# ------------------------------------------------------------
def generate_prediction(features: pd.DataFrame, model) -> int:
    """
    Generate prediction from features.
    
    Args:
        features: Single-row DataFrame with all required features
        model: Loaded XGBoost model
        
    Returns:
        Predicted quantity (integer, minimum 1)
        
    Raises:
        Exception: If prediction fails
    """
    try:
        # Ensure feature columns match training order
        expected_columns = [
            'dealer_code', 'part_no', 'year', 'month', 'day_of_week', 'week_of_year', 'is_holiday',
            '3_month_avg', '6_month_avg', '3_month_std', 'lag_1', 'lag_7', 'is_active'
        ]
        
        # Log feature values for debugging
        logger.info(f"[DEBUG] Feature values before prediction:")
        for col in expected_columns:
            logger.info(f"  {col}: {features[col].values[0]}")
        
        # Reorder columns to match training
        features = features[expected_columns]
        
        # Generate prediction
        prediction = model.predict(features)[0]
        
        # Round to nearest integer
        rounded_prediction = round(prediction)
        
        # Apply floor of 1
        final_prediction = max(1, rounded_prediction)
        
        logger.info(f"[PREDICTION] Raw={prediction:.2f}, Rounded={rounded_prediction}, Final={final_prediction}")
        
        if final_prediction == 1 and prediction < 0.5:
            logger.warning(f"[WARNING] Model predicted very low value ({prediction:.4f}), returning minimum of 1")
        
        return int(final_prediction)
        
    except Exception as e:
        logger.exception(f"[ERROR] Prediction generation failed: {e}")
        raise


# ------------------------------------------------------------
# ML Prediction Endpoint (Task 8.1)
# ------------------------------------------------------------
@router.post("/predict-ml", response_model=PredictionResponse)
async def predict_quantity_ml(request: PredictionRequest, cursor=Depends(get_db)):
    """
    Generate real-time ML prediction for a part.
    
    Request Body:
        dealer_code: str
        part_number: str
        month: str (name or number)
        
    Response:
        predicted_quantity: int (ML prediction)
        pi_suggested_stock: int (from database)
        
    Raises:
        HTTPException: 400 for invalid input, 404 for missing model,
                      500 for processing errors
    """
    logger.info("=" * 70)
    logger.info(f"[ML_REQUEST] {request.dict()}")
    
    try:
        # Validate and sanitize inputs
        dealer = request.dealer_code.strip()
        part = request.part_number.strip().upper()
        
        if not dealer:
            raise HTTPException(status_code=400, detail="Invalid dealer code")
        if not part:
            raise HTTPException(status_code=400, detail="Invalid part number")
        
        # Convert month to number
        try:
            month_num = month_to_number(request.month)
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid month")
        
        # Construct prediction date (first day of month in 2025)
        prediction_date = datetime(PREDICTION_YEAR, month_num, 1)
        
        # Load model assets (with caching)
        assets = load_model_assets(dealer)
        model = assets['model']
        
        # Fetch historical purchase data
        historical_df = fetch_historical_data(cursor, dealer, part)
        
        # Compute features (pass dealer_code for encoding)
        features = compute_features(historical_df, prediction_date, part, dealer, assets)
        
        # Generate ML prediction
        ml_prediction = generate_prediction(features, model)
        
        # Fetch PI suggested stock from database (unchanged logic)
        cursor.execute(
            """
            SELECT pe_suggested_stock_qty
            FROM public.dealer_stocking_details
            WHERE TRIM(cust_number) = %s
              AND UPPER(TRIM(item_no)) = %s
              AND month::int = %s
            LIMIT 1
            """,
            (dealer, part, month_num),
        )
        
        pi_row = cursor.fetchone()
        pi_stock = int(pi_row["pe_suggested_stock_qty"]) if pi_row else 0
        
        logger.info(f"[ML_PREDICTION] {ml_prediction}")
        logger.info(f"[PI_STOCK] {pi_stock}")
        logger.info("[ML_SUCCESS]")
        logger.info("=" * 70)
        
        return {
            "predicted_quantity": ml_prediction,
            "pi_suggested_stock": pi_stock,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[FATAL] ML prediction failed")
        raise HTTPException(status_code=500, detail=str(e))
