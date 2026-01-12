import logging  # Add this import statement at the beginning of the file
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()    

def get_db_connection():
    try:
        DB_URL = os.getenv("DB_URL")
        engine = create_engine(DB_URL)
        with engine.connect() as connection:
            logging.info("Connected to the database")
            #print("Connected to the database")
        return engine
    except Exception as e:
        logging.error(f"Error: {e}")
        raise

#get_db_connection()  # Test the connection