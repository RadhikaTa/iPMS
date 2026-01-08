import pandas as pd
import numpy as np
import pickle
import logging
from pytz import timezone
from datetime import datetime, timedelta
import holidays
from database.PdCompdbConnection import get_db_connection
import os
from psycopg2.extras import execute_values
import glob
from calendar import monthrange
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

# Load real purchase data from PostgreSQL
def load_data(dealer_code=0,req='MNAO'):
    try:
        conn = get_db_connection()
        query = f"""
        SELECT DISTINCT trim(dealer_code) as dealer_code, trim(part_no) as part_no
        FROM parts_purchase_data WHERE dealer_code='{dealer_code}'        
        """
        MCI_query=f"""with cte as (SELECT DISTINCT
        trim(pp.dealer_code) as dealer_code,
        trim(pp.part_no) as part_no,
        CASE 
            WHEN lp.last_purchase_date >= CURRENT_DATE - INTERVAL '9 months'
            THEN 1 ELSE 0
        END AS is_active,
        ('2025-1-1'-lp.last_purchase_date) as days_last_purchased
        FROM parts_purchase_data_mci pp
        LEFT JOIN (
        SELECT dealer_code, part_no, MAX(ordr_entry_date) AS last_purchase_date
        FROM parts_purchase_data_mci where ordr_entry_date<='2025-07-31'
        GROUP BY dealer_code, part_no
        ) lp ON pp.dealer_code = lp.dealer_code AND pp.part_no = lp.part_no
        WHERE pp.dealer_code = '{dealer_code}' and pp.ordr_entry_date<='2025-07-31')
        SELECT dealer_code,part_no,min(days_last_purchased) as days_since_last_purchased 
        FROM cte WHERE is_active='1'   
        GROUP BY dealer_code,part_no         
        """

        MNAO_query = f"""with cte as (SELECT DISTINCT
        trim(pp.dealer_code) as dealer_code,
        trim(pp.part_no) as part_no,
        CASE 
            WHEN GREATEST(
                COALESCE(lp.last_purchase_date, DATE '1900-01-01'),
                COALESCE(ls.last_sales_date, DATE '1900-01-01')
            ) >= CURRENT_DATE - INTERVAL '9 months'
            THEN 1 ELSE 0
        END AS is_active
        FROM parts_purchase_data pp
        LEFT JOIN (
        SELECT dealer_code, part_no, MAX(ordr_entry_date) AS last_purchase_date
        FROM parts_purchase_data
        GROUP BY dealer_code, part_no
        ) lp ON pp.dealer_code = lp.dealer_code AND pp.part_no = lp.part_no
        LEFT JOIN (
        SELECT dealer_code, part_no, MAX(invoice_date) AS last_sales_date
        FROM parts_sales_data
        GROUP BY dealer_code, part_no
        ) ls ON pp.dealer_code = ls.dealer_code AND pp.part_no = ls.part_no
        WHERE pp.dealer_code = '{dealer_code}')
        SELECT distinct dealer_code,part_no FROM cte WHERE is_active='1'            
        """

        MCI_QUERY = f"""with cte as (SELECT DISTINCT
        trim(pp.dealer_code) as dealer_code,
        trim(pp.part_no) as part_no,
		DATE '2025-08-01'-GREATEST(
                COALESCE(lp.last_purchase_date, DATE '1900-01-01'),
                COALESCE(ls.last_sales_date, DATE '1900-01-01')
            ) as days_since_last_purchased,			
        CASE 
            WHEN GREATEST(
                COALESCE(lp.last_purchase_date, DATE '1900-01-01'),
                COALESCE(ls.last_sales_date, DATE '1900-01-01')
            ) >= DATE '2025-08-01' - INTERVAL '9 months'
            THEN 1 ELSE 0
        END AS is_active		
        FROM parts_purchase_data_mci pp		
        LEFT JOIN (
        SELECT dealer_code, part_no, MAX(ordr_entry_date) AS last_purchase_date
        FROM parts_purchase_data_mci where trim(dealer_code) = '11150' AND ORDR_ENTRY_DATE<='2025-07-31'
        GROUP BY dealer_code, part_no
        ) lp ON trim(pp.dealer_code) = trim(lp.dealer_code) AND trim(pp.part_no) = trim(lp.part_no)
		
        LEFT JOIN (
        SELECT dealer_code, REPLACE(part_no,'-','') AS part_no, MAX(invoice_date) AS last_sales_date
        FROM parts_sales_data_mci where trim(dealer_code) = '11150' AND INVOICE_DATE<='2025-07-31'
        GROUP BY dealer_code, part_no
        ) ls ON trim(pp.dealer_code) = trim(ls.dealer_code) AND trim(pp.part_no) = trim(ls.part_no)		
        WHERE trim(pp.dealer_code) = '11150')
		
        SELECT distinct dealer_code,part_no,days_since_last_purchased,CASE WHEN is_active='1' THEN 'N' ELSE 'Y' END AS IS_IDEAL 
		FROM cte WHERE is_active='1'
		union
        SELECT distinct dealer_code,part_no,days_since_last_purchased,CASE WHEN is_active='1' THEN 'N' ELSE 'Y' END AS IS_IDEAL 
		FROM cte WHERE is_active='0' and part_no in(SELECT distinct trim(part_no) FROM public.actual_data_mci where trim(dealer_code)='11150')          
        """
        query =  MNAO_query if req=='MNAO' else MCI_QUERY
        #LIMIT {dataSize}
        df = pd.read_sql(query, conn.connect())
        #df['invoice_date'] = pd.to_datetime(df['invoice_date']).dt.date
        #logging.info(" Data loaded successfully from PostgreSQL for dealer code: " + str(dealer_code))
        return df
    except Exception as e:
        logging.error(f" Error loading data: {e}")
        return pd.DataFrame()
# Load trained ML model and encoders

# Get today's date in local timezone (Delhi)
us_tz = timezone('US/Eastern')  # Or 'US/Pacific', depending on your business location
# today_us = datetime.now(us_tz).date()
today_us = us_tz.localize(datetime(2025, 8, 1)).date()#1st Jan 2025
#today_us = datetime.now(tz=datetime.now().astimezone().tzinfo).date()
   
def save_predictions_to_postgres(df: pd.DataFrame):
    try:
        engine = get_db_connection()
        conn = engine.raw_connection()
        cursor = conn.cursor()

        insert_query = """
            INSERT INTO part_purchase_forecast_MCI (
                dlr_cd, part_no, predicted_today,
                predicted_tomorrow, predicted_weekly, predicted_monthly,available_qty, prediction_date
            ) VALUES %s
            ON CONFLICT (dlr_cd, part_no, prediction_date)
            DO UPDATE SET
                predicted_today = EXCLUDED.predicted_today,
                predicted_tomorrow = EXCLUDED.predicted_tomorrow,
                predicted_weekly = EXCLUDED.predicted_weekly,
                predicted_monthly = EXCLUDED.predicted_monthly;
        """

        values = [
            (
                row["DEALER"], row["PART_NO"],
                row["PREDICTED_TODAY"], row["PREDICTED_TOMORROW"],
                row["PREDICTED_WEEKLY"], row["PREDICTED_MONTHLY"],
                row["AVAILABLE_QTY"],
                today_us  # Use prediction date
            )
            for _, row in df.iterrows()
        ]

        execute_values(cursor, insert_query, values)
        conn.commit()
        logging.info("Predictions inserted/updated into PostgreSQL.")
    except Exception as e:
        logging.error(f"Error inserting predictions: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def load_store_predicted_data(dealer_code='',req='MNAO'):
    #dealers = ['10131','23454', '23925', '34318', '51485']
    if dealer_code =='':
        return None
    # Load real data
    real_data = load_data(dealer_code,req)
    print(f'{dealer_code} - Data size - {real_data.shape[0]}')
    model_dir = f"./../TEST_MODEL_en_{dealer_code}"
    model_pattern=os.path.join(model_dir,"inventory_model_*.pkl")
    model_files = glob.glob(model_pattern)
    model_path=''
    if model_files:
        model_path = model_files[0]
    else :
        raise FileNotFoundError("Model not found for this dealer")
        exit()
    try:
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        with open(f"./../TEST_MODEL_en_{dealer_code}/dealer_encoder.pkl", "rb") as f:
            le_dealer = pickle.load(f)
        with open(f"./../TEST_MODEL_en_{dealer_code}/part_encoder.pkl", "rb") as f:
            le_part = pickle.load(f)
        with open(f"./../TEST_MODEL_en_{dealer_code}/default_3month_avg.pkl", "rb") as f:
            avg3_data = pickle.load(f)
        with open(f"./../TEST_MODEL_en_{dealer_code}/default_6month_avg.pkl", "rb") as f:
            avg6_data = pickle.load(f)
        with open(f"./../TEST_MODEL_en_{dealer_code}/default_3month_std.pkl", "rb") as f:
            std3_data = pickle.load(f)
        with open(f"./../TEST_MODEL_en_{dealer_code}/is_active_mapping.pkl", "rb") as f:
                is_active_map = pickle.load(f)
        logging.info(" Model and encoders loaded successfully.")
    except FileNotFoundError as e:
        logging.error(f" Error loading model or encoders: {e}")
        exit()

    global df_check
    #df_check = actual_data_init(dealer_code)
    if real_data.empty:
        logging.error("No real data loaded. Exiting.")
        exit()

    # Extract unique dealer_code and part_no pairs
    unique_parts = real_data[['part_no','days_since_last_purchased']].drop_duplicates()

    # Initialize results list
    results = []

    # Set prediction horizon
    future_days = 30

    # Iterate through each unique dealer_code & part_no
    for _, row in unique_parts.iterrows():
        #dealer_code = row['dealer_code']
        days_since_last_purchased = row['days_since_last_purchased']
        part_no = row['part_no']
        key = (part_no)
        is_active = is_active_map.get(key, 0)

        # Ensure dealer and part exist in encoders
        if dealer_code not in le_dealer.classes_ or part_no not in le_part.classes_:
            logging.warning(f"Skipping unknown dealer/part: {dealer_code}, {part_no}")
            continue

        # Encode dealer and part
        encoded_dealer = le_dealer.transform([dealer_code])[0]
        encoded_part = le_part.transform([part_no])[0]

        # Load default 3-month and 6-month averages
        avg3 = avg3_data.get("dealer_part_medians", {}).get((part_no), avg3_data.get("global_median", 0.0))
        avg6 = avg6_data.get("dealer_part_medians", {}).get((part_no), avg6_data.get("global_median", 0.0))
        std3 = std3_data.get("dealer_part_medians", {}).get((part_no), std3_data.get("global_median", 0.0))  # NEW

        # Debug Logs
        logging.info(f"🔹 Processing Dealer: {dealer_code}, Part: {part_no}")
        logging.info(f"🔹 Encoded Dealer: {encoded_dealer}, Encoded Part: {encoded_part}")
        logging.info(f"🔹 3-Month Avg: {avg3}, 6-Month Avg: {avg6}")

        # Initialize prediction history
        history = pd.DataFrame([{
            "purchase_qty": avg3,
            "invoice_date": today_us - timedelta(days=1)
        }])

        predicted_daily = {}
        total_predicted_qty = 0
        days_back = today_us - timedelta(days=today_us.weekday())  # Gets this week's Monday
        total_days = future_days + days_back.weekday()
        monday_of_week = today_us - timedelta(days=today_us.weekday())  # Gets this week's Monday
        today_vl = 0.0
        tomorrow_vl = 0.0
        rolling_history = [avg3]
        for i in range(future_days):
            current_date = today_us + timedelta(days=i)
            dow = current_date.weekday()
            dom = current_date.day
            month = current_date.month
            year = current_date.year
            week = current_date.isocalendar().week

            # Cyclic features
            dow_sin, dow_cos = np.sin(2*np.pi*dow/7), np.cos(2*np.pi*dow/7)
            month_sin, month_cos = np.sin(2*np.pi*month/12), np.cos(2*np.pi*month/12)

            # Lags
            lag_1 = history['purchase_qty'].iloc[-1] if not history.empty else avg3
            lag_7 = history['purchase_qty'].iloc[-7] if len(history) >= 7 else avg6
            lag_14 = history['purchase_qty'].iloc[-14] if len(history) >= 14 else avg6
            lag_30 = history['purchase_qty'].iloc[-30] if len(history) >= 30 else avg6
            lag_90 = history['purchase_qty'].iloc[-90] if len(history) >= 90 else avg6

            # Rolling sums
            rolling_history.append(lag_1)
            last_30 = rolling_history[-30:] if len(rolling_history) >= 30 else rolling_history
            last_90 = rolling_history[-90:] if len(rolling_history) >= 90 else rolling_history
            sum_30d, sum_90d = sum(last_30), sum(last_90)

            # Increment days since last purchase if prediction = 0
            if i > 0:
                days_since_last_purchased += 1

            features_df = pd.DataFrame([{
                "part_no": encoded_part,
                "year": year,
                "month": month,
                "week_of_year": week,
                "day_of_month": dom,
                "day_of_week": dow,
                "day_of_week_sin": dow_sin,
                "day_of_week_cos": dow_cos,
                "month_sin": month_sin,
                "month_cos": month_cos,
                "days_since_last_purchase": days_since_last_purchased,
                "3_month_avg": avg3,
                "6_month_avg": avg6,
                "3_month_std": std3,
                "30d_sum": sum_30d,
                "90d_sum": sum_90d,
                "lag_1": lag_1,
                "lag_7": lag_7,
                "lag_14": lag_14,
                "lag_30": lag_30,
                "lag_90": lag_90,
                "is_active": is_active
            }])

            # Make prediction
            pred_qty = round(float(model.predict(features_df)[0]), 2)
            #if pred_qty>0:
            #pred_qty = requiredPredictedQuantity(dealer_code,part_no,pred_qty,month)
            #avail_qty = getAvailableQty(dealer_code,part_no)
            total_predicted_qty += pred_qty
            if current_date == today_us:
                today_vl = round(pred_qty, 2)
            if current_date == today_us + timedelta(days=1):
                tomorrow_vl = round(pred_qty, 2)
            predicted_daily[current_date] = pred_qty

            # Update history
            history = pd.concat([history, pd.DataFrame([{'purchase_qty': pred_qty, 'invoice_date': current_date}])], ignore_index=True)

        #
        today_date = today_us
        days_to_monday = (0 - today_date.weekday()) % 7  # Monday = 0
        monday_of_week = today_date + timedelta(days=days_to_monday)
        current_monday = today_date + timedelta(days=days_to_monday)
        #monday_of_week = today_date - timedelta(days=today_date.weekday())  # Gets this week's Monday
        friday_of_week = monday_of_week + timedelta(days=4)
        endof_week = today_date + timedelta(days=6 - today_date.weekday())  # Gets this week's Sunday
        last_day_of_month = today_date.replace(day=monthrange(year, month)[1])

        # Convert index and ensure it's in date format
        predicted_df = pd.DataFrame(predicted_daily.items(), columns=['invoice_date', 'predicted_qty'])
        predicted_df['invoice_date'] = pd.to_datetime(predicted_df['invoice_date']).dt.date
        predicted_df.set_index('invoice_date', inplace=True)

        # Filter for current week (Mon to Sun)
        #mask = (predicted_df.index >= monday_of_week) & (predicted_df.index <= sunday_of_week)
        mask = (predicted_df.index >= monday_of_week) & (predicted_df.index <= friday_of_week)
        current_week_sum = predicted_df.loc[mask, 'predicted_qty'].sum()
        current_week_sum = round(current_week_sum, 2)
        #
        # Aggregate predicted values
        predicted_weekly = {}
        weekly_sum = 0
        predicted_df = pd.DataFrame(predicted_daily.items(), columns=['invoice_date', 'predicted_qty']).set_index('invoice_date')
        while current_monday<= last_day_of_month:
            current_friday = current_monday + timedelta(days=4)
            if current_friday> last_day_of_month:
                current_friday = last_day_of_month
            week_sum = predicted_df.loc[current_monday:current_friday,'predicted_qty'].sum()
            weekly_sum += week_sum
            current_monday = current_monday + timedelta(days=7)
            
        
      # Append results
        results.append({
            "DEALER": dealer_code,
            "PART_NO": part_no,
            "PREDICTED_TODAY": today_vl,
            "PREDICTED_TOMORROW": tomorrow_vl,
            "PREDICTED_WEEKLY": current_week_sum, #sum(val for val in predicted_weekly.values()),
            "PREDICTED_MONTHLY": round(weekly_sum,2),
            "AVAILABLE_QTY": 0#avail_qty
            # "REAL_DAILY": real_daily,
            # "REAL_WEEKLY": real_weekly,
            # "REAL_MONTHLY": real_monthly,
        })

    # Convert results to DataFrame and save
    df_results = pd.DataFrame(results)
    df_results = df_results[
        ~(
            (df_results["PREDICTED_TODAY"] == 0) &
            (df_results["PREDICTED_TOMORROW"] == 0) &
            (df_results["PREDICTED_WEEKLY"] == 0) &
            (df_results["PREDICTED_MONTHLY"] == 0)
        )
    ]
    #df_results[["DEALER", "PART_NO", "PREDICTED_TODAY", "PREDICTED_TOMORROW", "PREDICTED_WEEKLY", "PREDICTED_MONTHLY"]].to_csv("predicted_granular_dump3.csv", index=False)
    save_predictions_to_postgres(df_results)

    #logging.info("Predicted granular values dump saved to predicted_granular_dump.csv")
    logging.info("Predicted granular values saved to part_purchase_forecast table")

for dealer in ["22218","11150","35130","46550","50210"]:#['11146','11148','11150','11152','11158','11206','11508','22212','22228','22312','23204','24210','35184','35236','35270','35278','46164','46184','46214','46588']:
   
    load_store_predicted_data(dealer,'MCI')

