import pandas as pd
import numpy as np
import pickle
from datetime import datetime
import logging
from sklearn.preprocessing import LabelEncoder
import os
import glob
from dotenv import load_dotenv
from database.PdCompdbConnection import get_db_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
load_dotenv()

TEST_MODEL_en = ''
save_path= os.getenv('DEALER_DATA_PATH')
def load_data(dealer_code='',table=''):
    # if not dealer_code.isdigit():
    #     return None
    print('dealer code : ',dealer_code)
    try:
        conn = get_db_connection()
        # query = f"""
        # SELECT trim(dealer_code) as dealer_code, trim(part_no) as part_no, invoice_number, invoice_date, purchase_qty, sales_ordr_no,
        #        sales_ordr_line_no, ordr_entry_date, last_updt_tm, last_userid_cd
        # FROM parts_purchase_data WHERE dealer_code='10177'
        
        # """
        query = f"""SELECT 
        trim(pp.dealer_code) as dealer_code,
        trim(pp.part_no) as part_no,
        pp.ordr_entry_date as invoice_date,
        CASE 
            WHEN GREATEST(
                COALESCE(lp.last_purchase_date, DATE '1900-01-01'),
                COALESCE(ls.last_sales_date, DATE '1900-01-01')
            ) >= DATE '2025-08-01' - INTERVAL '9 months'
            THEN pp.purchase_qty ELSE 0
        END AS purchase_qty,
        GREATEST(
            COALESCE(lp.last_purchase_date, DATE '1900-01-01'),
            COALESCE(ls.last_sales_date, DATE '1900-01-01')
        ) AS last_activity_date,
        CASE 
            WHEN GREATEST(
                COALESCE(lp.last_purchase_date, DATE '1900-01-01'),
                COALESCE(ls.last_sales_date, DATE '1900-01-01')
            ) >= DATE '2025-08-01' - INTERVAL '9 months'
            THEN 1 ELSE 0
        END AS is_active
        FROM parts_purchase_data{table} pp
        LEFT JOIN (
        SELECT dealer_code, part_no, MAX(ordr_entry_date) AS last_purchase_date
        FROM parts_purchase_data
        GROUP BY dealer_code, part_no
        ) lp ON pp.dealer_code = lp.dealer_code AND pp.part_no = lp.part_no
        LEFT JOIN (
        SELECT dealer_code, REPLACE(part_no,'-','') AS part_no, MAX(invoice_date) AS last_sales_date
        FROM parts_sales_data{table}
        GROUP BY dealer_code, part_no
        ) ls ON pp.dealer_code = ls.dealer_code AND pp.part_no = ls.part_no
        WHERE pp.dealer_code = '{dealer_code}'"""
        #ORDER BY invoice_date ASC
        print('==================================')
        print(query)
        print('==================================')
        
        df = pd.read_sql(query, conn.connect())
        logging.info("Data loaded successfully from PostgreSQL.")
        return df
    except Exception as e:
        logging.error(f"Error loading data: {e}")
        raise

def append_to_pkl(file_path, data):
    # Open the file in append mode ('ab') and append the data
    with open(file_path, "ab") as f:
        pickle.dump(data, f)
    logging.info(f"Data appended to {file_path}")

def preprocess_data(df,dealer_code):
    TEST_MODEL_en = f'TEST_MODEL_en_{dealer_code}'
    print(TEST_MODEL_en)
    if TEST_MODEL_en=='':
        return None
    try:
        os.makedirs(f"./../{TEST_MODEL_en}", exist_ok=True)

        # Convert 'invoice_date' to datetime
        df['invoice_date'] = pd.to_datetime(df['invoice_date'], errors='coerce')
        df.dropna(subset=['invoice_date', 'purchase_qty'], inplace=True)
        df = df.sort_values(by=['dealer_code', 'part_no', 'invoice_date'])

        # Time-based features
        df['year'] = df['invoice_date'].dt.year
        df['month'] = df['invoice_date'].dt.month
        df['day_of_week'] = df['invoice_date'].dt.dayofweek
        df['week_of_year'] = df['invoice_date'].dt.isocalendar().week


        

        
        # Drop unnecessary columns
        df.drop(columns=['last_activity_date'], errors='ignore', inplace=True)

        df['dealer_code'] = df['dealer_code'].astype(str).str.strip()
        df['part_no'] = df['part_no'].astype(str).str.strip()

        # Handle missing values
        df.dropna(inplace=True)

        
        # Label Encoding for dealer_code and part_no
        le_dealer = LabelEncoder()
        df['dealer_code'] = le_dealer.fit_transform(df['dealer_code'])

        le_part = LabelEncoder()
        df['part_no'] = le_part.fit_transform(df['part_no'])

        # Save label encoders for later use
        with open(f"./../{TEST_MODEL_en}/dealer_encoder.pkl", "wb") as f:
            pickle.dump(le_dealer, f)

        with open(f"./../{TEST_MODEL_en}/part_encoder.pkl", "wb") as f:
            pickle.dump(le_part, f)

       
        # Final feature list and target
        features = ['part_no', 'year', 'month', 'day_of_week', 'week_of_year', 'is_holiday',
                    '3_month_avg', '6_month_avg', '3_month_std', 'lag_1', 'lag_7', 'lag_30', 'lag_90', 'is_active']
        target = 'purchase_qty'

        logging.info(f"Preprocessing completed. Final data shape: {df.shape}")
        return  df, le_dealer, le_part

    except Exception as e:
        logging.error(f"Error preprocessing data: {e}")
        raise

