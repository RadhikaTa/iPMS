import logging  # Add this import statement at the beginning of the file
import psycopg2
from psycopg2 import OperationalError
import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()    

def get_db_connection():
    print(os.getenv('DB_NAME'))
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME'),  # Replace with your database name
            user=os.getenv("DB_USER"),  # Replace with your username
            password=os.getenv("DB_PASSWORD"),  # Replace with your password
            host=os.getenv("DB_HOST"),  # Default host for local connections
            port=os.getenv("DB_PORT")  # Default PostgreSQL port
        )
        return conn
    except OperationalError as e:
        print(f"Error: {e}")
        return None

#get_db_connection()  # Test the connection