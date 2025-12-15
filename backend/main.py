from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from typing import List, Optional, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Ensure these imports match your project structure
# NOTE: The router file must now contain the actual /api/top100-parts logic.
from backend.prediction_backend import router as prediction_router
from backend.database.db_connection import get_db_connection
from backend.database import schemas

# --- FIX: Import dependency from the new decoupled file ---
# This ensures that both main.py's local endpoints and the router's endpoints 
# use the same working database dependency without circular imports.
from backend.db_dependencies import get_db 

# Load .env FROM backend folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

print("LOADED ENV FROM:", ENV_PATH)
print("DB_NAME =", os.getenv("DB_NAME"))
print("DB_HOST =", os.getenv("DB_HOST"))
print("DB_USER =", os.getenv("DB_USER"))

# FastAPI App
app = FastAPI()

# Include prediction router under root
app.include_router(prediction_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NOTE: The 'def get_db()' function has been moved to backend/db_dependencies.py. 
# The function below, originally copied in your prompt, should be placed in 
# backend/db_dependencies.py (along with its imports) for the structural fix to work correctly.

# --- ENDPOINT FOR SINGLE PART/STOCK DETAILS ---
@app.get("/api/stock-details", response_model=List[schemas.StockDetail])
def get_dealer_stocking_details(
    cust_number: str,
    item_no: Optional[str] = None,
    prediction_month: Optional[str] = None, 
    cursor=Depends(get_db)
):
    """
    Fetch PI predicted quantity and stock details.
    """

    base_query = """
        SELECT
            cust_number,
            item_no,
            pe_suggested_stock_qty
        FROM public.dealer_stocking_details
        WHERE cust_number = %s
    """
    params = [cust_number]

    if item_no:
        base_query += " AND item_no = %s"
        params.append(item_no)

    if prediction_month:
        base_query += " AND prediction_month = %s"
        params.append(prediction_month)

    base_query += " LIMIT 100"

    try:
        cursor.execute(base_query, tuple(params))
        data = cursor.fetchall()
        return data

    except Exception as error:
        print(f"Error fetching dealer stocking details: {error}")
        raise HTTPException(status_code=500, detail="Database query error for stock details")

    

# GET /api/parts
@app.get("/api/parts", response_model=List[schemas.Part])
def get_parts_list(
    dealer_code: str,
    skip: int = 0,
    limit: int = 100,
    cursor=Depends(get_db)
):

    query = """
        WITH CTE AS (
            SELECT t1.dealer_code, t1.part_no, COALESCE(t2.part_name,'') AS part_name, 'IDLE' AS status
            FROM public.dealer_daily_stock t1 
            LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
            WHERE t1.dealer_code = %s AND t1.status = 'I'

            UNION
            SELECT t1.dealer_code, t1.part_no, COALESCE(t2.part_name,''), 'PREIDLE' AS status
            FROM public.dealer_daily_stock t1 
            LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
            WHERE t1.dealer_code = %s AND t1.status = 'P'

            UNION
            SELECT t1.dealer_code, t1.part_no, COALESCE(t2.part_name,''), t2.part_state AS status
            FROM public.dealer_daily_stock t1 
            LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
            WHERE t1.dealer_code = %s AND t2.part_state = 'RETIRED'

            UNION
            SELECT t1.dealer_code, t1.part_no, COALESCE(t2.part_name,''), t2.part_state AS status
            FROM public.dealer_daily_stock t1 
            LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
            WHERE t1.dealer_code = %s AND t2.part_state = 'DROPSHIP'

            UNION
            SELECT t1.dealer_code, t1.part_no, COALESCE(t2.part_name,''), 'NORMAL' AS status
            FROM public.dealer_daily_stock t1 
            LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
            WHERE t1.dealer_code = %s AND t1.status = ''
        )
        SELECT
            dealer_code,
            TRIM(part_no) AS part_no,
            TRIM(part_name) AS part_name,
            STRING_AGG(DISTINCT status, '-') AS status
        FROM CTE
        GROUP BY dealer_code, part_no, part_name
        ORDER BY part_no
        OFFSET %s
        LIMIT %s
    """

    try:
        cursor.execute(
            query,
            (dealer_code, dealer_code, dealer_code, dealer_code, dealer_code, skip, limit)
        )
        return cursor.fetchall()

    except Exception as error:
        print(f"Error fetching parts list: {error}")
        raise HTTPException(status_code=500, detail="Database query error")

# GET /api/inv-health
@app.get("/api/inv-health", response_model=List[schemas.Chart])
def get_inventory_health_chart_data(
    dealer_code: str,
    skip: int = 0,
    limit: int = 100,
    cursor=Depends(get_db)
):

    query = """
        WITH CTE AS (
            SELECT dealer_code, part_no, 'IDLE' AS status
            FROM dealer_daily_stock 
            WHERE dealer_code = %s AND status = 'I'

            UNION
            SELECT dealer_code, part_no, 'PREIDLE' AS status
            FROM dealer_daily_stock 
            WHERE dealer_code = %s AND status = 'P'

            UNION
            SELECT t1.dealer_code, t1.part_no, t2.part_state AS status
            FROM public.dealer_daily_stock t1
            INNER JOIN public.parts_master t2 ON t1.part_no = t2.part_no
            WHERE t1.dealer_code = %s AND part_state = 'RETIRED'

            UNION
            SELECT t1.dealer_code, t1.part_no, t2.part_state AS status
            FROM public.dealer_daily_stock t1
            INNER JOIN public.parts_master t2 ON t1.part_no = t2.part_no
            WHERE t1.dealer_code = %s AND part_state = 'DROPSHIP'

            UNION
            SELECT dealer_code, part_no, 'NORMAL' AS status
            FROM dealer_daily_stock 
            WHERE dealer_code = %s AND status = ''
        ),
        part_status AS (
            SELECT
                dealer_code,
                part_no,
                STRING_AGG(DISTINCT status, '-' ORDER BY status) AS merged_status
            FROM CTE
            GROUP BY dealer_code, part_no
        )
        SELECT
            COUNT(part_no) AS part_count,
            merged_status AS status
        FROM part_status
        GROUP BY dealer_code, merged_status
    """

    try:
        cursor.execute(
            query,
            (dealer_code, dealer_code, dealer_code, dealer_code, dealer_code)
        )
        return cursor.fetchall()

    except Exception as error:
        print(f"Error fetching inventory health data: {error}")
        raise HTTPException(status_code=500, detail="Error fetching data from database")
    
# NOTE: The /api/top100-parts endpoint has been moved to the router file.