# backend/db_dependencies.py

from fastapi import HTTPException
from psycopg2.extras import RealDictCursor
# Assuming get_db_connection is correctly imported/available.
from backend.database.db_connection import get_db_connection 


def get_db():
    """
    Defines the database dependency for FastAPI endpoints.
    """
    conn = get_db_connection()

    if conn is None:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    try:
        # Yields a cursor for use in endpoint functions
        yield conn.cursor(cursor_factory=RealDictCursor)
    finally:
        # Ensures the connection is closed after the request is processed
        conn.close()