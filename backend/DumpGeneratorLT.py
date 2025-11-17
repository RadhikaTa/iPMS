import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import holidays

# -----------------------------
# 1. Pydantic Models
# -----------------------------
class PredictionRequest(BaseModel):
    dealer_code: str
    part_number: str
    month: str   # month name or number (we accept both)

class PredictionResponse(BaseModel):
    predicted_quantity: int

# -----------------------------
# 2. Router initialization
# -----------------------------
router = APIRouter()

# -----------------------------
# 3. Paths & globals
# -----------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))  # backend/
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
MODEL_BASE_PATH = os.path.join(ROOT_DIR, "MNAO")

model_cache: Dict[str, Dict[str, Any]] = {}

# months lookups
ALL_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

# -----------------------------
# 4. Load model assets
# -----------------------------
def load_model_assets(dealer_code: str) -> Dict[str, Any]:
    """
    Load and cache all assets for a dealer:
    inventory_model_2, dealer_encoder, part_encoder,
    default_3month_avg, default_6month_avg, default_3month_std, is_active_mapping
    """
    if dealer_code in model_cache:
        return model_cache[dealer_code]

    model_folder = os.path.join(MODEL_BASE_PATH, f"TEST_MODEL_en_{dealer_code}")

    if not os.path.exists(model_folder):
        raise HTTPException(status_code=404, detail=f"Model folder not found for dealer {dealer_code}")

    required_files = [
        "inventory_model_2.pkl",
        "dealer_encoder.pkl",
        "part_encoder.pkl",
        "default_3month_avg.pkl",
        "default_3month_std.pkl",
        "default_6month_avg.pkl",
        "is_active_mapping.pkl",
    ]

    assets: Dict[str, Any] = {}
    for fname in required_files:
        path = os.path.join(model_folder, fname)
        if not os.path.exists(path):
            raise HTTPException(status_code=500, detail=f"Missing required file: {fname}")
        key = fname.replace(".pkl", "")
        assets[key] = joblib.load(path)

    model_cache[dealer_code] = assets
    return assets

# -----------------------------
# Helper: parse month input
# -----------------------------
def month_to_number(month_input: str) -> int:
    """
    Accept either month name (January) or numeric string '8' or integer 8.
    Return int 1..12. Raises ValueError if invalid.
    """
    if isinstance(month_input, int):
        month_num = month_input
    else:
        s = str(month_input).strip()
        # numeric?
        if s.isdigit():
            month_num = int(s)
        else:
            # match month name (case-insensitive)
            try:
                month_num = ALL_MONTHS.index(s.capitalize()) + 1
            except ValueError:
                raise ValueError(f"Invalid month: {month_input}")
    if not (1 <= month_num <= 12):
        raise ValueError(f"Invalid month: {month_input}")
    return month_num

# -----------------------------
# 5. Prediction Endpoint
# -----------------------------
@router.post("/predict", response_model=PredictionResponse)
async def predict_quantity(request: PredictionRequest):
    """
    Build features to match training pipeline (names & order) and predict.
    Model expects:
    ['dealer_code','part_no','year','month','day_of_week','week_of_year','is_holiday',
     '3_month_avg','6_month_avg','3_month_std','lag_1','lag_7','is_active']
    """

    # sanitize inputs
    dealer_code = str(request.dealer_code).strip()
    part_no_raw = str(request.part_number).strip()
    if part_no_raw == "":
        raise HTTPException(status_code=400, detail="Empty part_number provided")

    # load assets
    assets = load_model_assets(dealer_code)

    # Check encoders presence
    if "dealer_encoder" not in assets or "part_encoder" not in assets:
        raise HTTPException(status_code=500, detail="Encoders missing in model assets")

    # encode dealer_code
    try:
        dealer_encoded = int(assets["dealer_encoder"].transform([dealer_code])[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Unknown dealer code for this model: {dealer_code}")

    # encode part_no (use raw part number as used in training; training may have removed '-' etc.
    try:
        part_encoded = int(assets["part_encoder"].transform([part_no_raw])[0])
    except Exception:
        raise HTTPException(status_code=400, detail=f"Unknown part number for this model: {part_no_raw}")

    # determine target date for feature generation:
    # frontend only sends a month. We'll use the first day of the requested month in the current year.
    # This produces deterministic year/month/day_of_week/week_of_year/is_holiday used for features.
    try:
        month_num = month_to_number(request.month)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Use current year (or you could use a fixed training-year if desired)
    year_now = datetime.now().year
    target_date = datetime(year_now, month_num, 1).date()

    day_of_week = int(target_date.weekday())              # Monday=0 .. Sunday=6
    week_of_year = int(target_date.isocalendar()[1])     # ISO week number
    is_holiday = int(target_date in holidays.India(years=target_date.year))

    # Obtain per-part statistics (these PKLs contain dicts like your training script)
    # Your training script used patterns like:
    # avg3 = avg3_data.get("dealer_part_medians", {}).get((part_no), avg3_data.get("global_median", 0.0))
    # We'll support both shapes: either dict keyed by part_no OR a nested structure.
    def lookup_stat(obj, key):
        # obj may be dict keyed directly by part_no, or contain "dealer_part_medians" etc.
        if obj is None:
            return 0.0
        if isinstance(obj, dict):
            # direct
            if key in obj:
                return obj[key]
            # tuple-keyed?
            if (key,) in obj:  # unlikely, but safe
                return obj[(key,)]
            # nested forms:
            if "dealer_part_medians" in obj and isinstance(obj["dealer_part_medians"], dict):
                # key could be tuple (part_no) or part_no alone
                if key in obj["dealer_part_medians"]:
                    return obj["dealer_part_medians"][key]
                if (key,) in obj["dealer_part_medians"]:
                    return obj["dealer_part_medians"][(key,)]
            if "global_median" in obj:
                return obj.get("global_median", 0.0)
        # fallback numeric
        try:
            return float(obj)
        except Exception:
            return 0.0

    avg3 = lookup_stat(assets.get("default_3month_avg"), part_no_raw)
    avg6 = lookup_stat(assets.get("default_6month_avg"), part_no_raw)
    std3 = lookup_stat(assets.get("default_3month_std"), part_no_raw)

    # lags fallback logic used in your training loop:
    lag_1 = avg3 if avg3 is not None else 0.0
    lag_7 = avg6 if avg6 is not None else 0.0

    # is_active from mapping
    is_active = int(assets.get("is_active_mapping", {}).get(part_no_raw, 0))

    # Build features with EXACT NAMES expected by the model
    feature_dict = {
        "dealer_code": int(dealer_encoded),
        "part_no": int(part_encoded),
        "year": int(year_now),
        "month": int(month_num),
        "day_of_week": int(day_of_week),
        "week_of_year": int(week_of_year),
        "is_holiday": int(is_holiday),
        "3_month_avg": float(avg3),
        "6_month_avg": float(avg6),
        "3_month_std": float(std3),
        "lag_1": float(lag_1),
        "lag_7": float(lag_7),
        "is_active": int(is_active),
    }

    # Order columns exactly as training model expected (important)
    cols_order = ['dealer_code','part_no','year','month','day_of_week','week_of_year','is_holiday',
                  '3_month_avg','6_month_avg','3_month_std','lag_1','lag_7','is_active']

    # DataFrame and dtype sanity
    df = pd.DataFrame([feature_dict])[cols_order]
    # Ensure numeric dtypes
    for c in df.columns:
        if df[c].dtype == object:
            df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0)

    # Predict
    model = assets.get("inventory_model_2")
    if model is None:
        raise HTTPException(status_code=500, detail="Model not found in assets")

    try:
        preds = model.predict(df)
    except Exception as e:
        # Bubble up a helpful error for debugging
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

    predicted = int(round(float(preds[0])))

    return {"predicted_quantity": predicted}
