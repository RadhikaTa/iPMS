from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor

# Ensure these imports match your project structure
from backend.prediction_backend import router as prediction_router
from backend.database.db_connection import get_db_connection
from backend.database import schemas

app = FastAPI()

# Include prediction router under root
app.include_router(prediction_router)

# CORS - allow common dev origins and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Database dependency
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


@app.get("/api/parts", response_model=List[schemas.Part])
def read_parts(skip: int = 0, limit: int = 100, cursor=Depends(get_db)):

    conn = get_db_connection()
    query = """
            WITH CTE AS(
                SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,'IDLE' as status
                FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
                WHERE t1.dealer_code='83314' AND t1.status='I'--171
                union
                SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,'PREIDLE' as status
                FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
                WHERE t1.dealer_code='83314' AND t1.status='P'--31
                union
                SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_name,t2.part_state AS status
                FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
                WHERE t1.dealer_code='83314' and t2.part_state='RETIRED'--75
                union
                SELECT t1.dealer_code, t1.part_no,COALESCE(t2.part_name,'') as part_name,t2.part_state AS status
                FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
                WHERE t1.dealer_code='83314' and t2.part_state='DROPSHIP' --22
                union
                SELECT t1.dealer_code,t1.part_no,COALESCE(t2.part_name,'') as part_nameLEFT,'NORMAL' as status
                FROM public.dealer_daily_stock t1 LEFT JOIN public.parts_master t2 ON t1.part_no = t2.part_no
                WHERE t1.dealer_code='83314' AND t1.status=''--2175
                )
                SELECT
                dealer_code,
                part_no,
                part_name,
                STRING_AGG(DISTINCT status,'-') AS status
                FROM CTE 
                GROUP BY dealer_code,part_no,part_name
                ORDER BY part_no
                OFFSET %s
                LIMIT %s
            """

    try:
        cursor.execute(query, (skip, limit))
        """print(cursor.fetchall())"""
        return cursor.fetchall()
    except (Exception, psycopg2.Error) as error:
        # Log actual error to the terminal
        print(f"Error fetching parts: {error}")
        # Return 500 error response
        raise HTTPException(
            status_code=500,
            detail="Error fetching data from database"
        )
