import os
import psycopg2
from psycopg2 import OperationalError
import psycopg2.extras


def get_db_connection():
    print("DB DEBUG:", os.getenv("DB_HOST"), os.getenv("DB_NAME"))

    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        return conn
    except OperationalError as e:
        print("DB ERROR:", e)
        return None
