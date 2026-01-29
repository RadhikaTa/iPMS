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
                 SELECT 
    t1.dealer_code,
    TRIM(t1.part_no) AS part_no,
    TRIM(COALESCE(pm.part_name,'')) AS part_name,
    t1.available_qty,
    pm.part_returnable_fl,
    COALESCE(ROUND(pf.predicted_today),0) AS monthly_suggested,
    COALESCE(pm.dnp,0) AS dnp,

    sd.last_sales_date,
    pd.last_purchase_date,

    (EXTRACT(YEAR FROM AGE(CURRENT_DATE, GREATEST(
        COALESCE(sd.last_sales_date, DATE '1900-01-01'),
        COALESCE(pd.last_purchase_date, DATE '1900-01-01')
    ))) * 12)
    +
    EXTRACT(MONTH FROM AGE(CURRENT_DATE, GREATEST(
        COALESCE(sd.last_sales_date, DATE '1900-01-01'),
        COALESCE(pd.last_purchase_date, DATE '1900-01-01')
    ))) AS age,

    COALESCE(sd.sale_in_12_months,0) AS sale_in_12_months,
    COALESCE(pm.heirarchy,'') AS heirarchy,

    CASE
        WHEN t1.status='I' THEN 'IDLE'
        WHEN t1.status='P' THEN 'PREIDLE'
        ELSE 'NORMAL'
    END
    ||
    COALESCE('-' || pm.part_state,'') AS status

FROM dealer_daily_stock t1

LEFT JOIN parts_master pm
       ON pm.part_no = t1.part_no

LEFT JOIN part_purchase_forecast2 pf
       ON pf.dlr_cd = t1.dealer_code
      AND pf.part_no = t1.part_no

LEFT JOIN (
    SELECT dealer_code, part_no,
           MAX(ordr_entry_date) AS last_purchase_date
    FROM parts_purchase_data
    WHERE dealer_code = %s
    GROUP BY dealer_code, part_no
) pd ON pd.dealer_code = t1.dealer_code
    AND pd.part_no = t1.part_no

LEFT JOIN (
    SELECT dealer_code, part_no,
           MAX(invoice_date) AS last_sales_date,
           SUM(part_quantity) FILTER (
               WHERE invoice_date >= CURRENT_DATE - INTERVAL '12 MONTHS'
                 AND invoice_date < CURRENT_DATE
           ) AS sale_in_12_months
    FROM parts_sales_data
    WHERE dealer_code = %s
    GROUP BY dealer_code, part_no
) sd ON sd.dealer_code = t1.dealer_code
    AND sd.part_no = t1.part_no

WHERE t1.dealer_code = %s
OFFSET %s
LIMIT %s;

    """

    try:
        cursor.execute(
            query,
            (dealer_code, dealer_code, dealer_code, skip, limit)
        )
        return cursor.fetchall()

    except Exception as error:
        print(f"Error fetching parts list: {error}")
        raise HTTPException(status_code=500, detail="Database query error")

# ---------------------------
# GET /api/inv-health
# ---------------------------
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
   
 
@app.get("/api/suggested-stocks", response_model=List[schemas.Chart1])
def get_suggested_stocks_chart_data(
    dealer_code: str,
    skip: int = 0,
    limit: int = 100,
    cursor=Depends(get_db)
):
 
    query = """
        with total_stock AS(
            SELECT COUNT(DISTINCT PART_NO) AS items_count,DEALER_CODE
            FROM DEALER_DAILY_STOCK
            WHERE DEALER_CODE= %s
            GROUP BY DEALER_CODE
            ),suggested_stock AS(
            SELECT COUNT(DISTINCT t1.PART_NO) AS items_count,DEALER_CODE,'SUGGESTED_STOCK' AS CATEGORY
            FROM DEALER_DAILY_STOCK t1 inner join PART_PURCHASE_FORECAST2 t2 on t1.PART_NO = t2.PART_NO AND t1.DEALER_CODE= cast(t2.DLR_CD AS VARCHAR)
            WHERE t1.DEALER_CODE= %s
            GROUP BY DEALER_CODE
            ),excluded_stock AS(
            SELECT COUNT(DISTINCT t1.PART_NO) AS items_count,DEALER_CODE,'EXCLUDED_STOCK' AS CATEGORY
            FROM DEALER_DAILY_STOCK t1 inner join PARTS_MASTER t2 on t1.PART_NO = t2.PART_NO
            WHERE HAZMAT_ITEM_FLAG = 'Y' AND t1.DEALER_CODE='10131'--PART_STATE
            GROUP BY DEALER_CODE
            ),other_stock AS(
            SELECT t1.items_count-(t2.items_count + t3.items_count) AS items_count,
            t1.DEALER_CODE,'OTHERS_STOCK' AS CATEGORY
            FROM total_stock t1,suggested_stock t2,excluded_stock t3
            WHERE t1.DEALER_CODE=%s AND t2.DEALER_CODE=%s AND t3.DEALER_CODE=%s
            )
            SELECT CATEGORY,ITEMS_COUNT FROM suggested_stock
            UNION
            SELECT CATEGORY,ITEMS_COUNT FROM excluded_stock
            UNION
            SELECT CATEGORY,ITEMS_COUNT FROM other_stock
    """
 
    try:
        cursor.execute(
            query,
            (dealer_code, dealer_code, dealer_code, dealer_code, dealer_code)
        )
        return cursor.fetchall()
 
    except Exception as error:
        print(f"Error fetching suggested stocks data: {error}")
        raise HTTPException(status_code=500, detail="Error fetching data from database")
 
 
@app.get("/api/idle-part-list", response_model=List[schemas.listModel])
def get_idle_part_list_data(
    dealer_code: str,
    skip: int = 0,
    limit: int = 100,
    cursor=Depends(get_db)
):
 
    query = """
        WITH CTE AS(
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,'IDLE' as status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s AND t1.status='I'--171
        union
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,'PREIDLE' as status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s AND t1.status='P'--31
        union
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,t2.part_state AS status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s and t2.part_state='RETIRED'--75
        union
        SELECT t1.dealer_code, t1.part_no,COALESCE(t2.part_name,'') as part_name,t2.part_state AS status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s and t2.part_state='DROPSHIP' --22
        union
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_nameLEFT,'NORMAL' as status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s AND t1.status=''--2175
        ),FINAL_CTE AS(
        SELECT
         dealer_code,
         part_no,
         part_name,
         STRING_AGG(DISTINCT status,'-') AS status
        FROM CTE
        GROUP BY dealer_code,part_no,part_name
        )
        SELECT
         dealer_code,
         part_no,
         part_name,
         status
        FROM FINAL_CTE WHERE STATUS='IDLE'
        ORDER BY part_no
    """
 
    try:
        cursor.execute(
            query,
            (dealer_code, dealer_code, dealer_code, dealer_code, dealer_code)
        )
        return cursor.fetchall()
 
    except Exception as error:
        print(f"Error fetching idle part list data: {error}")
        raise HTTPException(status_code=500, detail="Error fetching data from database")
 
 
@app.get("/api/pre-idle-part-list", response_model=List[schemas.listModel])
def get_pre_idle_part_list_data(
    dealer_code: str,
    skip: int = 0,
    limit: int = 100,
    cursor=Depends(get_db)
):
 
    query = """
        WITH CTE AS(
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,'IDLE' as status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s AND t1.status='I'--171
        union
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,'PREIDLE' as status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s AND t1.status='P'--31
        union
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,t2.part_state AS status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s and t2.part_state='RETIRED'--75
        union
        SELECT t1.dealer_code, t1.part_no,COALESCE(t2.part_name,'') as part_name,t2.part_state AS status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s and t2.part_state='DROPSHIP' --22
        union
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_nameLEFT,'NORMAL' as status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s AND t1.status=''--2175
        ),FINAL_CTE AS(
        SELECT
         dealer_code,
         part_no,
         part_name,
         STRING_AGG(DISTINCT status,'-') AS status
        FROM CTE
        GROUP BY dealer_code,part_no,part_name
        )
        SELECT
         dealer_code,
         part_no,
         part_name,
         status
        FROM FINAL_CTE WHERE STATUS='PREIDLE'
        ORDER BY part_no
    """
 
    try:
        cursor.execute(
            query,
            (dealer_code, dealer_code, dealer_code, dealer_code, dealer_code)
        )
        return cursor.fetchall()
 
    except Exception as error:
        print(f"Error fetching idle part list data: {error}")
        raise HTTPException(status_code=500, detail="Error fetching data from database")
 
@app.get("/api/drop-ship-part-list", response_model=List[schemas.listModel])
def get_drop_ship_part_list_data(
    dealer_code: str,
    skip: int = 0,
    limit: int = 100,
    cursor=Depends(get_db)
):
 
    query = """
        WITH CTE AS(
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,'IDLE' as status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s AND t1.status='I'--171
        union
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,'PREIDLE' as status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s AND t1.status='P'--31
        union
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,t2.part_state AS status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s and t2.part_state='RETIRED'--75
        union
        SELECT t1.dealer_code, t1.part_no,COALESCE(t2.part_name,'') as part_name,t2.part_state AS status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s and t2.part_state='DROPSHIP' --22
        union
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_nameLEFT,'NORMAL' as status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s AND t1.status=''--2175
        ),FINAL_CTE AS(
        SELECT
         dealer_code,
         part_no,
         part_name,
         STRING_AGG(DISTINCT status,'-') AS status
        FROM CTE
        GROUP BY dealer_code,part_no,part_name
        )
        SELECT
         dealer_code,
         part_no,
         part_name,
         status
        FROM FINAL_CTE WHERE STATUS='DROPSHIP'
        ORDER BY part_no
    """
 
    try:
        cursor.execute(
            query,
            (dealer_code, dealer_code, dealer_code, dealer_code, dealer_code)
        )
        return cursor.fetchall()
 
    except Exception as error:
        print(f"Error fetching idle part list data: {error}")
        raise HTTPException(status_code=500, detail="Error fetching data from database")
 
@app.get("/api/normal-part-list", response_model=List[schemas.listModel])
def get_normal_part_list_data(
    dealer_code: str,
    skip: int = 0,
    limit: int = 100,
    cursor=Depends(get_db)
):
 
    query = """
        WITH CTE AS(
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,'IDLE' as status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s AND t1.status='I'--171
        union
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,'PREIDLE' as status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s AND t1.status='P'--31
        union
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,t2.part_state AS status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s and t2.part_state='RETIRED'--75
        union
        SELECT t1.dealer_code, t1.part_no,COALESCE(t2.part_name,'') as part_name,t2.part_state AS status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s and t2.part_state='DROPSHIP' --22
        union
        SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_nameLEFT,'NORMAL' as status
        FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
        WHERE t1.dealer_code=%s AND t1.status=''--2175
        ),FINAL_CTE AS(
        SELECT
         dealer_code,
         part_no,
         part_name,
         STRING_AGG(DISTINCT status,'-') AS status
        FROM CTE
        GROUP BY dealer_code,part_no,part_name
        )
        SELECT
         dealer_code,
         part_no,
         part_name,
         status
        FROM FINAL_CTE WHERE STATUS='NORMAL'
        ORDER BY part_no
    """
 
    try:
        cursor.execute(
            query,
            (dealer_code, dealer_code, dealer_code, dealer_code, dealer_code)
        )
        return cursor.fetchall()
 
    except Exception as error:
        print(f"Error fetching idle part list data: {error}")
        raise HTTPException(status_code=500, detail="Error fetching data from database")
   
 
 