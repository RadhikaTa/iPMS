# backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor 

# 1. Import your connection function
from database.db_connection import get_db_connection 

# 2. Import your updated schema
from database import schemas

app = FastAPI()

# --- IMPORTANT: Add CORS Middleware ---
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency to get DB cursor ---
def get_db():
    conn = get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        # Use RealDictCursor to get results as dictionaries
        yield conn.cursor(cursor_factory=RealDictCursor)
    finally:
        conn.close()

# --- Your Updated API Endpoint ---
@app.get("/api/parts", response_model=List[schemas.Part])
def read_parts(skip: int = 0, limit: int = 100, cursor = Depends(get_db)):
    """
    Retrieve parts from the parts_master table using psycopg2.
    """
    
    # This query selects all the columns you found in parts_master
    query = """
        SELECT 
            part_no, 
            part_name, 
            status, 
            part_returnable_fl, 
            vndr_no,
            ovrsize_hvywt_flag, 
            hazmat_item_flag,
            inactive_date,
            case_pack_fctr,
            last_updt_tm,
            last_userid_cd
        FROM parts_master
        ORDER BY part_no 
        OFFSET %s
        LIMIT %s
    """
    try:
        cursor.execute(query, (skip, limit))
        parts = cursor.fetchall()
        return parts
    except (Exception, psycopg2.Error) as error:
        print(f"Error fetching parts: {error}")
        raise HTTPException(status_code=500, detail="Error fetching data from database")