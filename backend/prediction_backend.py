import os
import glob
import joblib
import pickle
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import holidays

# -----------------------------
# Pydantic
# -----------------------------
class PredictionRequest(BaseModel):
    dealer_code: str
    part_number: str
    month: str  # month name or number

class PredictionResponse(BaseModel):
    predicted_quantity: int

router = APIRouter()

# -----------------------------
# Paths & cache
# -----------------------------
# NOTE: Assumes __file__ is defined. If running in a notebook or REPL, this may fail.
# In a real FastAPI app, this should be correct.
try:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
except NameError:
    # Fallback for environments where __file__ is not defined
    SCRIPT_DIR = os.getcwd()
    ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

MODEL_BASE_PATH = os.path.join(ROOT_DIR, "MNAO")

model_cache: Dict[str, Dict[str, Any]] = {}

ALL_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

# -----------------------------
# Utilities to load pickle/joblib robustly
# -----------------------------
def robust_load(path: str):
    """
    Try joblib.load first, then pickle.load with common encodings.
    Returns the loaded object or raises.
    """
    # try joblib first
    try:
        return joblib.load(path)
    except Exception:
        pass
    # fallback to pickle with different protocols
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except Exception:
        # as last resort try latin1 (useful for numpy pickles cross-version)
        try:
            with open(path, "rb") as f:
                return pickle.load(f, encoding="latin1")
        except Exception as e:
            raise RuntimeError(f"Failed to load {path}: {e}")

def safe_float(x, default=0.0):
    try:
        # handle numpy scalar
        if hasattr(x, "item"):
            return float(x.item())
        return float(x)
    except Exception:
        return float(default)

def normalize_key_variants(key):
    """
    Return a list of plausible key variants to try when looking up stats:
    - raw string
    - without dashes/spaces
    - stripped
    - int if numeric
    - tuple variants (some dumps use (dealer, part) tuple)
    """
    k = key
    s = str(key).strip()
    variants = [key, s, s.replace("-", ""), s.replace("-", "").replace(" ", ""), s.upper(), s.lower()]
    # numeric form
    if s.isdigit():
        variants.insert(0, int(s))
    
    # Handle int keys explicitly
    if isinstance(key, (int, np.integer)):
         variants.insert(0, int(key))
         
    # add tuple-like single element
    variants += [(s,), (s.replace("-", ""),), (key,)]
    # unique
    seen = []
    out = []
    for v in variants:
        if v not in seen:
            seen.append(v)
            out.append(v)
    return out

def lookup_stat(obj, dealer_key, part_key):
    """
    Look up a statistic in obj using multiple possible key shapes.
    
    **NOTE:** `part_key` here is assumed to be the *encoded* part number (int)
    or the *raw* part number (str) if the encoder failed.
    The `normalize_key_variants` function will handle both.
    
    obj may be:
      - a dict keyed by part (string or int)
      - nested dict {"dealer_part_medians": {part: val}, "global_median": x}
      - dict keyed by tuples (dealer, part) or (encoded dealer, encoded part)
    """
    if obj is None:
        return 0.0
        
    # Generate keys for the part and the dealer/part tuple
    part_keys = normalize_key_variants(part_key)
    tuple_keys = normalize_key_variants((dealer_key, part_key))
    
    # If nested like {"dealer_part_medians": {...}, "global_median": v}
    if isinstance(obj, dict) and "dealer_part_medians" in obj:
        dp = obj["dealer_part_medians"]
        # try dealer+part tuple first
        for k in tuple_keys:
            if k in dp:
                return safe_float(dp[k])
        # try part-only keys
        for k in part_keys:
            if k in dp:
                return safe_float(dp[k])
        # global fallback
        return safe_float(obj.get("global_median", 0.0))
        
    # If dict keyed by tuples (dealer, part) OR by encoded integers
    if isinstance(obj, dict):
        # try tuple lookup
        for k in tuple_keys:
            if k in obj:
                return safe_float(obj[k])
        # try part-only
        for k in part_keys:
            if k in obj:
                return safe_float(obj[k])
        # try dealer-only if that makes sense
        for k in normalize_key_variants(dealer_key):
            if k in obj:
                return safe_float(obj[k])
        # last try: if object itself is numeric
        try:
            return safe_float(obj)
        except Exception:
            return 0.0
            
    # If it's a numpy scalar or number
    try:
        return safe_float(obj)
    except Exception:
        return 0.0

# -----------------------------
# Load model assets for a dealer
# -----------------------------
def load_model_assets(dealer_code: str) -> Dict[str, Any]:
    """
    Loads and caches the assets for the given dealer folder under MNAO/TEST_MODEL_en_{dealer_code}
    Assets: inventory_model_*.pkl (first found), dealer_encoder.pkl, part_encoder.pkl,
            default_3month_avg.pkl, default_6month_avg.pkl, default_3month_std.pkl, is_active_mapping.pkl
    """
    dealer_code = str(dealer_code).strip()
    if dealer_code in model_cache:
        return model_cache[dealer_code]

    model_folder = os.path.join(MODEL_BASE_PATH, f"TEST_MODEL_en_{dealer_code}")
    if not os.path.exists(model_folder):
        raise HTTPException(status_code=404, detail=f"Model folder not found for dealer {dealer_code}")

    # 1. Look for the specific 'inventory_model_*.pkl'
    model_files = glob.glob(os.path.join(model_folder, "inventory_model_*.pkl"))
    
    chosen_model = None
    if model_files:
        chosen_model = model_files[0] # Take the first match
    else:
        # 2. If not found, search for *any* .pkl, but exclude known assets
        all_pkl_files = glob.glob(os.path.join(model_folder, "*.pkl"))
        excluded_names = {
            "dealer_encoder.pkl", "part_encoder.pkl", "default_3month_avg.pkl",
            "default_6month_avg.pkl", "default_3month_std.pkl", "is_active_mapping.pkl"
        }
        
        candidate_models = []
        for f in all_pkl_files:
            if os.path.basename(f) not in excluded_names:
                candidate_models.append(f)

        if candidate_models:
            # Prefer a file with 'model' in the name
            for f in candidate_models:
                if "model" in os.path.basename(f).lower():
                    chosen_model = f
                    break
            if chosen_model is None:
                chosen_model = candidate_models[0] # Fallback: take the first non-asset
    
    if chosen_model is None or not os.path.exists(chosen_model):
        raise HTTPException(status_code=500, detail=f"No suitable model file (.pkl) found in {model_folder}. (Excluded known asset files).")

    # required filenames (may exist or not)
    expected = {
        "inventory_model": chosen_model, # This is now the full, correct path
        "dealer_encoder": os.path.join(model_folder, "dealer_encoder.pkl"),
        "part_encoder": os.path.join(model_folder, "part_encoder.pkl"),
        "default_3month_avg": os.path.join(model_folder, "default_3month_avg.pkl"),
        "default_6month_avg": os.path.join(model_folder, "default_6month_avg.pkl"),
        "default_3month_std": os.path.join(model_folder, "default_3month_std.pkl"),
        "is_active_mapping": os.path.join(model_folder, "is_active_mapping.pkl"),
    }

    assets: Dict[str, Any] = {}
    # load model first
    try:
        assets["inventory_model"] = robust_load(expected["inventory_model"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model {chosen_model}: {e}")

    # load remaining files if present -- these may be optional
    for key in ["dealer_encoder", "part_encoder", "default_3month_avg", "default_6month_avg", "default_3month_std", "is_active_mapping"]:
        path = expected[key]
        if os.path.exists(path):
            try:
                assets[key] = robust_load(path)
            except Exception as e:
                # continue but log in raise
                raise HTTPException(status_code=500, detail=f"Failed to load {key} from {path}: {e}")
        else:
            assets[key] = None

    # cache
    model_cache[dealer_code] = assets
    return assets

# -----------------------------
# Month parser
# -----------------------------
def month_to_number(month_input: str) -> int:
    if isinstance(month_input, int):
        m = month_input
    else:
        s = str(month_input).strip()
        if s.isdigit():
            m = int(s)
        else:
            try:
                m = ALL_MONTHS.index(s.capitalize()) + 1
            except ValueError:
                raise ValueError(f"Invalid month: {month_input}")
    if not (1 <= m <= 12):
        raise ValueError(f"Invalid month: {month_input}")
    return m

# -----------------------------
# Prediction Endpoint
# -----------------------------
@router.post("/predict", response_model=PredictionResponse)
async def predict_quantity(request: PredictionRequest):
    # sanitize
    dealer_code = str(request.dealer_code).strip()
    part_raw = str(request.part_number).strip()
    if part_raw == "":
        raise HTTPException(status_code=400, detail="Empty part_number provided")

    # load assets
    try:
        assets = load_model_assets(dealer_code)
    except HTTPException as e:
        # Pass HTTP exceptions (like 404) through
        raise e
    except Exception as e:
        # Catch other loading errors (e.g., file permissions)
        raise HTTPException(status_code=500, detail=f"Error loading assets: {e}")


    model = assets.get("inventory_model")
    if model is None:
        raise HTTPException(status_code=500, detail="Model not found in loaded assets")

    # encoders (may be None)
    dealer_encoder = assets.get("dealer_encoder")
    part_encoder = assets.get("part_encoder")

    # encode dealer (fallback: try to find encoded via encoder or numeric cast)
    dealer_encoded = 0 # Default
    if dealer_encoder is not None:
        try:
            dealer_encoded = int(dealer_encoder.transform([dealer_code])[0])
        except Exception:
            # try numeric cast
            try:
                dealer_encoded = int(dealer_code)
            except Exception:
                dealer_encoded = 0 # fallback
    else:
        try:
            dealer_encoded = int(dealer_code)
        except Exception:
            dealer_encoded = 0

    # encode part - try encoder then try variants
    part_encoded = 0  # Default to 0 (unknown)
    if part_encoder is not None:
        try:
            part_encoded = int(part_encoder.transform([part_raw])[0])
        except Exception:
            # Part not in encoder. Try variants.
            classes = getattr(part_encoder, "classes_", None)
            found = False
            if classes is not None:
                for variant in [part_raw, part_raw.replace("-", ""), part_raw.replace("-", "").strip()]:
                    if variant in classes:
                        try:
                            part_encoded = int(part_encoder.transform([variant])[0])
                            found = True
                            break
                        except Exception:
                            pass # continue
            
            # If not found in variants, default to 0 (unknown)
            # We will use this 0 in lookup_stat, which will likely find no stats
            # and return 0.0, which is the correct behavior for an unknown part.
            if not found:
                part_encoded = 0 
    else:
        # No part_encoder. Assume part_no is numeric.
        try:
            part_encoded = int(part_raw)
        except ValueError:
            # It's alphanumeric (e.g., "ABC-123") and there's no encoder.
            # Must default to 0.
            part_encoded = 0
        except Exception:
            part_encoded = 0


    # date features for the requested month -> use first day of that month in the current year
    try:
        month_num = month_to_number(request.month)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    year_now = datetime.now().year
    target_date = datetime(year_now, month_num, 1).date()
    day_of_week = int(target_date.weekday())
    week_of_year = int(target_date.isocalendar()[1])
    is_holiday = int(target_date in holidays.India(years=target_date.year))

    # -----------------------------------------------------------------
    # **LOGIC FIX APPLIED HERE**
    # We now use part_encoded (the integer) for lookups, not part_raw (the string).
    # -----------------------------------------------------------------
    avg3 = lookup_stat(assets.get("default_3month_avg"), dealer_encoded, part_encoded)
    avg6 = lookup_stat(assets.get("default_6month_avg"), dealer_encoded, part_encoded)
    std3 = lookup_stat(assets.get("default_3month_std"), dealer_encoded, part_encoded)
    is_active = int(lookup_stat(assets.get("is_active_mapping"), dealer_encoded, part_encoded))

    # build features exactly as training expects
    feature_dict = {
        "dealer_code": int(dealer_encoded),
        "part_no": int(part_encoded),
        "year": int(year_now),
        "month": int(month_num),
        "day_of_week": int(day_of_week),
        "week_of_year": int(week_of_year),
        "is_holiday": int(is_holiday),
        "3_month_avg": safe_float(avg3),
        "6_month_avg": safe_float(avg6),
        "3_month_std": safe_float(std3),
        # fallback lags (training code used rolling averages when history missing)
        "lag_1": safe_float(avg3),
        "lag_7": safe_float(avg6),
        "is_active": int(is_active),
    }

    cols_order = ['dealer_code','part_no','year','month','day_of_week','week_of_year','is_holiday',
                  '3_month_avg','6_month_avg','3_month_std','lag_1','lag_7','is_active']

    df = pd.DataFrame([feature_dict])[cols_order]

    # ensure numeric
    for c in df.columns:
        df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0)

    # Debug prints (remove in production)
    print("PREDICT - dealer:", dealer_code, "part:", part_raw, "-> encoded:", part_encoded)
    print("Feature input:", df.to_dict(orient='records'))

    # predict
    try:
        preds = model.predict(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

    # Convert to int safely
    try:
        value = int(round(float(preds[0])))
    except Exception:
        value = int(np.round(preds[0])) if hasattr(preds[0], "__float__") else 0
        
    # Handle negative predictions
    if value < 0:
        value = 0

    return {"predicted_quantity": value}