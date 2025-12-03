from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Ensure these imports match your project structure
from backend.prediction_backend import router as prediction_router
from backend.database.db_connection import get_db_connection
from backend.database import schemas

# ---------------------------
# Load .env FROM backend folder
# ---------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

print("LOADED ENV FROM:", ENV_PATH)
print("DB_NAME =", os.getenv("DB_NAME"))
print("DB_HOST =", os.getenv("DB_HOST"))
print("DB_USER =", os.getenv("DB_USER"))

# ---------------------------
# FastAPI App
# ---------------------------
app = FastAPI()

# Include prediction router under root
app.include_router(prediction_router)

# ---------------------------
# CORS
# ---------------------------
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

# ---------------------------
# Database dependency
# ---------------------------
def get_db():
    conn = get_db_connection()

    if conn is None:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    try:
        yield conn.cursor(cursor_factory=RealDictCursor)
    finally:
        conn.close()


# ---------------------------
# GET /api/parts
# ---------------------------
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
