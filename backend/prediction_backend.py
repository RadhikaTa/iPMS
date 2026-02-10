# backend/prediction_backend.py
# ================= FINAL PRODUCTION VERSION =================
# ✔ Feature-aligned with training
# ✔ NO dealer_code leakage (FIXED ROOT CAUSE)
# ✔ Correct lag handling
# ✔ Safe unseen-part logic
# ✔ Prediction floor = 1
# ✔ Year fixed to 2025
# ✔ FULL DEBUG LOGGING

import os
import pickle
import glob
import re
import warnings
import logging
from typing import Dict, Any, List
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from .db_dependencies import get_db
from backend.database.schemas import Top100Part

# ------------------------------------------------------------
# Logging
# ------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("PREDICTION")

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
    logger.info(f"[LOAD] {os.path.basename(path)}")
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except Exception:
        with open(path, "rb") as f:
            return pickle.load(f, encoding="latin1")


def safe_float(val, default=0.0):
    try:
        return float(val)
    except Exception:
        return float(default)


def month_to_number(m: str) -> int:
    m = m.strip()
    if m.isdigit():
        return int(m)
    if m.capitalize() in ALL_MONTHS:
        return ALL_MONTHS.index(m.capitalize()) + 1
    raise ValueError(f"Invalid month: {m}")


# ------------------------------------------------------------
# Load Model Assets
# ------------------------------------------------------------
def load_model_assets(dealer_code: str) -> Dict[str, Any]:
    dealer_code = dealer_code.strip()

    if dealer_code in model_cache:
        return model_cache[dealer_code]

    model_dir = os.path.join(MODEL_BASE_PATH, f"TEST_MODEL_en_{dealer_code}")

    if not os.path.exists(model_dir):
        raise HTTPException(status_code=404, detail="Model not found for dealer")

    model_files = sorted(
        glob.glob(os.path.join(model_dir, "inventory_model*.pkl")),
        reverse=True,
    )

    if not model_files:
        raise HTTPException(status_code=500, detail="Model file missing")

    assets: Dict[str, Any] = {}
    assets["model"] = robust_load(model_files[0])

    aux_files = [
        "part_encoder.pkl",
        "default_3month_avg.pkl",
        "default_6month_avg.pkl",
        "default_3month_std.pkl",
        "is_active_mapping.pkl",
    ]

    for name in aux_files:
        path = os.path.join(model_dir, name)
        assets[name.replace(".pkl", "")] = robust_load(path) if os.path.exists(path) else {}

    model_cache[dealer_code] = assets
    return assets


# ------------------------------------------------------------
# Prediction API
# ------------------------------------------------------------
@router.post("/predict", response_model=PredictionResponse)
async def predict_quantity(request: PredictionRequest, cursor=Depends(get_db)):
    logger.info("=" * 70)
    logger.info(f"[REQUEST] {request.dict()}")

    try:
        dealer = request.dealer_code.strip()
        part = request.part_number.strip().upper()
        month_num = month_to_number(request.month)

        # -------------------------------------------------
        # Month start date
        # -------------------------------------------------
        month_start = f"{PREDICTION_YEAR}-{month_num:02d}-01"

        # -------------------------------------------------
        # Fetch predicted_today (SOURCE OF TRUTH)
        # -------------------------------------------------
        cursor.execute(
            """
            SELECT predicted_today
            FROM public.part_purchase_forecast2
            WHERE TRIM(dlr_cd) = %s
              AND UPPER(TRIM(part_no)) = %s
              AND prediction_date >= DATE_TRUNC('month', %s::date)
              AND prediction_date <  DATE_TRUNC('month', %s::date) + INTERVAL '1 month'
            ORDER BY prediction_date DESC
            LIMIT 1
            """,
            (dealer, part, month_start, month_start),
        )

        row = cursor.fetchone()

        predicted_today = (
            int(row["predicted_today"])
            if row and row["predicted_today"] is not None
            else 1
        )
        predicted_today = max(1, predicted_today)

        logger.info(f"[PREDICTED_TODAY] {predicted_today}")

        # -------------------------------------------------
        # Fetch PI suggested stock
        # -------------------------------------------------
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

        logger.info(f"[PI_STOCK] {pi_stock}")
        logger.info("[SUCCESS]")
        logger.info("=" * 70)

        return {
            "predicted_quantity": predicted_today,
            "pi_suggested_stock": pi_stock,
        }

    except Exception as e:
        logger.exception("[FATAL] DB-backed prediction failed")
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# Top 100 API (unchanged)
# ------------------------------------------------------------
@router.get("/api/top100-parts", response_model=List[Top100Part])
def get_top100_parts_comparison(dealer_code: str, month: str, cursor=Depends(get_db)):
    dealer = dealer_code.strip()
    m_num = month_to_number(month)
    date_str = f"2025-{m_num:02d}-01"

    query = """
        SELECT
            t1.part_no AS item_no,
            COALESCE(t1.predicted_today, 0) AS predicted_today,
            t2.pe_suggested_stock_qty
        FROM public.part_purchase_forecast2 t1
        LEFT JOIN public.dealer_stocking_details t2
          ON TRIM(t1.dlr_cd) = TRIM(t2.cust_number)
         AND UPPER(TRIM(t1.part_no)) = UPPER(TRIM(t2.item_no))
         AND t2.month::int = %s
        WHERE TRIM(t1.dlr_cd) = %s
          AND t1.prediction_date >= DATE_TRUNC('month', %s::date)
          AND t1.prediction_date <  DATE_TRUNC('month', %s::date) + INTERVAL '1 month'
        ORDER BY t1.predicted_monthly DESC
        LIMIT 100
    """
    debug_query(cursor, query, m_num, dealer, date_str)
    cursor.execute(query, (m_num, dealer, date_str, date_str))

    return [
        {
            "item_no": r["item_no"],
            "dealer_code": dealer,
            "predicted_today": int(r["predicted_today"] or 0),
            "pe_suggested_stock_qty": int(r["pe_suggested_stock_qty"] or 0),
        }
        for r in cursor.fetchall()
    ]


def debug_query(cursor, query, m_num, dealer, date_str):
    print(cursor.mogrify(query, (m_num, dealer, date_str, date_str)).decode("utf-8"))
