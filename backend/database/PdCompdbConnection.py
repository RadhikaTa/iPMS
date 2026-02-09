import logging
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    try:
        DB_NAME = os.getenv("DB_NAME")
        DB_HOST = os.getenv("DB_HOST")
        DB_PORT = os.getenv("DB_PORT")
        DB_USER = os.getenv("DB_USER")
        DB_PASSWORD = os.getenv("DB_PASSWORD")

        DB_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

        engine = create_engine(DB_URL)

        with engine.connect() as connection:
            logging.info("Connected to the database")
            print("Connected to the database")

        return engine

    except Exception as e:
        logging.error(f"Error: {e}")
        raise
