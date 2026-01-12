# backend/prediction_backend.py
# ================= FINAL CLEAN VERSION
# - Feature: Suppresses noisy XGBoost warnings
# - Feature: "Smart Match" attempts to find parts even with format differences
# - Feature: Prioritizes your high-accuracy .pkl model file
# - Feature: "Safe Fallback" returns 1 (instead of 0) for untrained parts

import os
import pickle
import glob
import re
import pandas as pd
import math
import warnings
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
import xgboost as xgb
from .db_dependencies import get_db

# Suppress XGBoost pickling warnings
warnings.filterwarnings("ignore", category=UserWarning, module="xgboost")

# ============================================================
# Pydantic Models
# ============================================================

class PredictionRequest(BaseModel):
    dealer_code: str
    part_number: str
    month: str 

class PredictionResponse(BaseModel):
    predicted_quantity: int
    pi_suggested_stock: int 

router = APIRouter()

# ============================================================
# Paths & Cache
# ============================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

MODEL_BASE_PATH = os.path.join(ROOT_DIR, "MNAO")
model_cache: Dict[str, Dict[str, Any]] = {}

ALL_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

TRAIN_FEATURES = [
    'part_no', 'year', 'month', 'week_of_year', 'day_of_month', 'day_of_week',
    'day_of_week_sin', 'day_of_week_cos', 'month_sin', 'month_cos', 
    'days_since_last_purchase', '3_month_avg', '6_month_avg', '3_month_std', 
    '30d_sum', '90d_sum', 'lag_1', 'lag_7', 'lag_14', 'lag_30', 'lag_90', 'is_active'
]

# ============================================================
# Helpers
# ============================================================

def robust_load(path: str):
    """Robustly load pickle files."""
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except Exception:
        try:
            with open(path, "rb") as f:
                return pickle.load(f, encoding="latin1")
        except Exception as e:
            print(f"Error loading {path}: {e}")
            return None

def safe_float(x, default=0.0):
    try:
        if hasattr(x, "item"): return float(x.item())
        return float(x)
    except: return float(default)

def month_to_number(mstr: str) -> int:
    s = str(mstr).strip()
    if s.isdigit(): m = int(s)
    else:
        try: m = ALL_MONTHS.index(s.capitalize()) + 1
        except: raise ValueError(f"Invalid month: {mstr}")
    if m < 1 or m > 12: raise ValueError(f"Invalid month: {mstr}")
    return m

def lookup_stat(obj, key, default=0.0):
    if obj is None: return float(default)
    try:
        val = obj.get(key, default)
        return safe_float(val)
    except: return float(default)

def align_features(df: pd.DataFrame) -> pd.DataFrame:
    for col in TRAIN_FEATURES:
        if col not in df.columns: df[col] = 0
    return df[[col for col in TRAIN_FEATURES]]

# ============================================================
# Load Dealer Assets
# ============================================================

def load_model_assets(dealer_code: str) -> Dict[str, Any]:
    dealer_code = str(dealer_code).strip()
    if dealer_code in model_cache: return model_cache[dealer_code]

    model_folder = os.path.join(MODEL_BASE_PATH, f"TEST_MODEL_en_{dealer_code}")
    if not os.path.exists(model_folder):
        raise HTTPException(status_code=404, detail=f"Model folder not found: {dealer_code}")

    assets = {}

    # --- 1. FORCE LOAD PKL FILE FIRST ---
    # We look for 'inventory_model_0.*.pkl' specifically to find your high-accuracy model
    pkl_files = glob.glob(os.path.join(model_folder, "inventory_model_*.pkl"))
    
    # If not found, try generic .pkl
    if not pkl_files:
        pkl_files = glob.glob(os.path.join(model_folder, "inventory_model*.pkl"))
    
    if pkl_files:
        # Sort to likely get the one with the longest name (highest precision score) or latest
        pkl_files.sort(reverse=True)
        latest_model_file = pkl_files[0] 
        print(f"Loading PKL model (Priority): {latest_model_file}")
        assets["inventory_model"] = robust_load(latest_model_file)
    else:
        # Only if NO .pkl exists, fall back to JSON
        json_path = os.path.join(model_folder, "inventory_model.json")
        if os.path.exists(json_path):
            print(f"Loading JSON model (Fallback): {json_path}")
            model = xgb.XGBRegressor()
            model.load_model(json_path)
            assets["inventory_model"] = model
        else:
            raise HTTPException(status_code=500, detail="No model file (PKL or JSON) found in folder.")

    # --- 2. Load Encoders & Stats ---
    for name in ["part_encoder.pkl", "default_3month_avg.pkl", "default_6month_avg.pkl", "default_3month_std.pkl", "is_active_mapping.pkl"]:
        fp = os.path.join(model_folder, name)
        key = name.replace(".pkl", "")
        assets[key] = robust_load(fp) if os.path.exists(fp) else None

    model_cache[dealer_code] = assets
    return assets

# ============================================================
# Stock Details Endpoint
# ============================================================
@router.get("/api/stock-details")
async def get_stock_details(cust_number: str, item_no: str, cursor=Depends(get_db)):
    try:
        cursor.execute("""
            SELECT * FROM public.dealer_stocking_details 
            WHERE TRIM(cust_number) = %s 
              AND UPPER(TRIM(item_no)) = %s
            LIMIT 1
        """, (cust_number.strip(), item_no.strip().upper()))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Stock Detail Error: {e}")
        return []

# ============================================================
# Single Part Prediction Endpoint
# ============================================================

@router.post("/predict", response_model=PredictionResponse)
async def predict_quantity(request: PredictionRequest, cursor=Depends(get_db)):
    try:
        dealer = request.dealer_code.strip()
        part_raw = request.part_number.strip()

        if not part_raw: raise HTTPException(status_code=400, detail="part_number empty")

        assets = load_model_assets(dealer)
        model = assets["inventory_model"]
        encoder = assets.get("part_encoder")

        # --- Smart Part Encoding ---
        # Try Exact -> Upper -> Lower -> Strip -> No Dashes to find the part
        part_encoded = -1
        
        if encoder:
            clean_part = re.sub(r'[^a-zA-Z0-9]', '', part_raw).upper()
            variations = [part_raw, part_raw.upper(), part_raw.lower(), part_raw.strip(), clean_part]
            
            for v in variations:
                if v in encoder.classes_:
                    part_encoded = int(encoder.transform([v])[0])
                    break
            
            if part_encoded == -1:
                print(f"WARN: Part '{part_raw}' (and variations) not found in encoder.")
        
        # --- Feature Lookup Logic ---
        stats_3m = assets.get("default_3month_avg", {})
        stats_6m = assets.get("default_6month_avg", {})
        stats_std = assets.get("default_3month_std", {})
        
        # Safe Fallback to 1.0 (Prevents 0 for unknown parts)
        DEFAULT_FALLBACK = 1.0 
        
        global_med_3 = safe_float(stats_3m.get("global_median", DEFAULT_FALLBACK)) if stats_3m else DEFAULT_FALLBACK
        global_med_6 = safe_float(stats_6m.get("global_median", DEFAULT_FALLBACK)) if stats_6m else DEFAULT_FALLBACK
        global_med_std = safe_float(stats_std.get("global_median", 0.5)) if stats_std else 0.5

        if global_med_3 == 0.0: global_med_3 = 1.0
        if global_med_6 == 0.0: global_med_6 = 1.0

        avg3 = lookup_stat(stats_3m, part_encoded, global_med_3)
        avg6 = lookup_stat(stats_6m, part_encoded, global_med_6)
        std3 = lookup_stat(stats_std, part_encoded, global_med_std)
        active = int(lookup_stat(assets.get("is_active_mapping"), part_encoded, 1))

        # Features
        month_num = month_to_number(request.month)
        year = datetime.now().year
        date_obj = datetime(year, month_num, 1)
        day_of_week = date_obj.weekday()
        week_of_year = date_obj.isocalendar()[1]
        day_of_month = date_obj.day
        
        feature_row = {
            "part_no": part_encoded,
            "year": year, "month": month_num, "week_of_year": week_of_year,
            "day_of_month": day_of_month, "day_of_week": day_of_week,
            "day_of_week_sin": math.sin(2*math.pi*day_of_week/7),
            "day_of_week_cos": math.cos(2*math.pi*day_of_week/7),
            "month_sin": math.sin(2*math.pi*month_num/12),
            "month_cos": math.cos(2*math.pi*month_num/12),
            "days_since_last_purchase": 30,
            "3_month_avg": avg3, "6_month_avg": avg6, "3_month_std": std3,
            "30d_sum": avg6, "90d_sum": avg6,
            "lag_1": avg3, "lag_7": avg6, "lag_14": avg3, 
            "lag_30": avg6, "lag_90": avg6, "is_active": active,
        }
        
        df = pd.DataFrame([feature_row])
        df_aligned = align_features(df)
        
        pred = model.predict(df_aligned)[0]
        final_pred = max(0, int(round(float(pred))))
        print(f"DEBUG: Part={part_raw}, Encoded={part_encoded}, Avg3={avg3}, Pred={final_pred}")

        # --- DB Fetch (Exact Logic) ---
        cursor.execute("""
            SELECT pe_suggested_stock_qty
            FROM public.dealer_stocking_details
            WHERE TRIM(cust_number) = %s
              AND UPPER(TRIM(item_no)) = %s
              AND month::int = %s
            LIMIT 1
        """, (dealer, part_raw.strip().upper(), month_num))
        
        row = cursor.fetchone()
        pi_stock = row["pe_suggested_stock_qty"] if row and row["pe_suggested_stock_qty"] is not None else 0

        return {
            "predicted_quantity": final_pred,
            "pi_suggested_stock": int(pi_stock)
        }

    except Exception as e:
        print(f"Prediction Error for {request.part_number}: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

@router.get("/api/top100-parts")
async def get_top100_parts_comparison(dealer_code: str, month: str, cursor=Depends(get_db)) -> List[Dict[str, Any]]:
    dealer = dealer_code.strip()
    prediction_month_num = month_to_number(month)
    query = """
        SELECT t1.part_no AS item_no, t1.predicted_today AS predicted_monthly,
               COALESCE(t2.pe_suggested_stock_qty, 0) as pe_suggested_stock_qty
        FROM public.part_purchase_forecast2 t1
        LEFT JOIN public.dealer_stocking_details t2
            ON t1.dlr_cd::text = t2.cust_number AND t1.part_no = t2.item_no AND t2.month::int = %s
        WHERE t1.dlr_cd = %s AND EXTRACT(MONTH FROM t1.prediction_date) = %s
          AND ABS(t1.predicted_today - COALESCE(t2.pe_suggested_stock_qty, 0)) <= 3
        ORDER BY t1.predicted_today DESC LIMIT 100;
    """
    cursor.execute(query, (prediction_month_num, dealer, prediction_month_num))
    rows = cursor.fetchall()
    return [{"item_no": r["item_no"], "dealer_code": dealer, "predicted_monthly": r["predicted_monthly"] or 0, "pe_suggested_stock_qty": r["pe_suggested_stock_qty"]} for r in rows]