import pandas as pd
import numpy as np
from xgboost import XGBRegressor, plot_importance
from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV , GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score
import pickle
from datetime import datetime
import logging
from sklearn.preprocessing import LabelEncoder
import holidays  #  Added for holiday feature
import os
import glob
from dotenv import load_dotenv

from database.PdCompdbConnection import get_db_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
load_dotenv()

TEST_MODEL_en = ''
save_path= os.getenv('DEALER_DATA_PATH')
def load_data(dealer_code=''):
    if not dealer_code.isdigit():
        return None
    
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
        FROM parts_purchase_data_mci pp
        LEFT JOIN (
        SELECT dealer_code, part_no, MAX(ordr_entry_date) AS last_purchase_date
        FROM parts_purchase_data_mci
        GROUP BY dealer_code, part_no
        ) lp ON pp.dealer_code = lp.dealer_code AND pp.part_no = lp.part_no
        LEFT JOIN (
        SELECT dealer_code, REPLACE(part_no,'-','') AS part_no, MAX(invoice_date) AS last_sales_date
        FROM parts_sales_data_mci
        GROUP BY dealer_code, part_no
        ) ls ON pp.dealer_code = ls.dealer_code AND pp.part_no = ls.part_no
        WHERE pp.dealer_code = '{dealer_code}'"""
        #ORDER BY invoice_date ASC
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

        # Holiday feature
        in_holidays = holidays.US()
        df['is_holiday'] = df['invoice_date'].isin(in_holidays).astype(int)

        # Set 'invoice_date' as index temporarily
        df.set_index('invoice_date', inplace=True)

        # Time-based rolling averages and std
        df['3_month_avg'] = df.groupby(['part_no'])['purchase_qty']\
                      .transform(lambda x: x.rolling('90D', min_periods=1).mean())

        # df['3_month_avg'] = df.groupby(['dealer_code', 'part_no'])['purchase_qty']\
        #     .apply(lambda x: x.rolling('90D', min_periods=1).mean())\
        #     .reset_index(level=[0, 1], drop=True)

        df['6_month_avg'] = df.groupby(['part_no'])['purchase_qty']\
                      .transform(lambda x: x.rolling('180D', min_periods=1).mean())

        # df['6_month_avg'] = df.groupby(['dealer_code', 'part_no'])['purchase_qty']\
        #     .apply(lambda x: x.rolling('180D', min_periods=1).mean())\
        #     .reset_index(level=[0, 1], drop=True)

        df['3_month_std'] = df.groupby(['part_no'])['purchase_qty']\
                      .transform(lambda x: x.rolling('90D', min_periods=1).std().fillna(0))

        # df['3_month_std'] = df.groupby(['dealer_code', 'part_no'])['purchase_qty']\
        #     .apply(lambda x: x.rolling('90D', min_periods=1).std().fillna(0))\
        #     .reset_index(level=[0, 1], drop=True)

        df.reset_index(inplace=True)

        # Lag features
        for lag in [1, 7,30,90]:
            df[f'lag_{lag}'] = df.groupby(['part_no'])['purchase_qty'].shift(lag)
            df[f'lag_{lag}'] = df[f'lag_{lag}'].fillna(df['3_month_avg']).fillna(df['6_month_avg'])

            # df[f'lag_{lag}'] = df[f'lag_{lag}'].fillna(
            #     df.groupby(['dealer_code', 'part_no'])['purchase_qty'].transform('mean')
            # )

        # Drop unnecessary columns
        df.drop(columns=['last_activity_date'], errors='ignore', inplace=True)

        df['dealer_code'] = df['dealer_code'].astype(str).str.strip()
        df['part_no'] = df['part_no'].astype(str).str.strip()

        # Handle missing values
        df.dropna(inplace=True)

        # Append rolling average/statistics as pickle files
        default_3_month_avg = df.groupby(['part_no'])["3_month_avg"].median().to_dict()
        global_median_3 = np.median(list(default_3_month_avg.values()))
        with open(f"./../{TEST_MODEL_en}/default_3month_avg.pkl", "wb") as f:
            pickle.dump({"dealer_part_medians": default_3_month_avg, "global_median": global_median_3}, f)
        #append_to_pkl("./../{TEST_MODEL_en}/default_3month_avg{dealer_code}.pkl", {"dealer_part_medians": default_3_month_avg, "global_median": global_median_3})

        default_6_month_avg = df.groupby(['part_no'])["6_month_avg"].median().to_dict()
        global_median_6 = np.median(list(default_6_month_avg.values()))
        with open(f"./../{TEST_MODEL_en}/default_6month_avg.pkl", "wb") as f:
            pickle.dump({"dealer_part_medians": default_6_month_avg, "global_median": global_median_6}, f)
        #append_to_pkl("./../{TEST_MODEL_en}/default_6month_avg{dealer_code}.pkl", {"dealer_part_medians": default_6_month_avg, "global_median": global_median_6})

        default_3_month_std = df.groupby(['part_no'])["3_month_std"].median().to_dict()
        global_std_3 = np.median(list(default_3_month_std.values()))
        with open(f"./../{TEST_MODEL_en}/default_3month_std.pkl", "wb") as f:
            pickle.dump({"dealer_part_medians": default_3_month_std, "global_median": global_std_3}, f)
        #append_to_pkl("./../{TEST_MODEL_en}/default_3month_std2.pkl", {"dealer_part_medians": default_3_month_std, "global_std": global_std_3})

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

        # Save 'is_active' mapping
        is_active_map = df.groupby(['part_no'])['is_active'].max().to_dict()
        pickle.dump(is_active_map, open(f"./../{TEST_MODEL_en}/is_active_mapping.pkl", "wb"))

        
        # -------- NEW: Seasonal and Quarterly Averages --------
        # df['season'] = df['month'] % 12 // 3
        #season_mapping = {0: 'Winter', 1: 'Spring', 2: 'Summer', 3: 'Fall'}
        #df['season'] = df['season'].map(season_mapping)

        # df['quarter'] = df['invoice_date'].dt.quarter

        # Compute and save seasonal and quarterly averages
        # seasonal_avg = df.groupby(['dealer_code', 'part_no','season'])['purchase_qty'].mean().to_dict()
        # with open(f"./../{TEST_MODEL_en}/seasonal_avg.pkl", "wb") as f:
        #     pickle.dump(seasonal_avg, f)
        # #append_to_pkl(f"./../{TEST_MODEL_en}/seasonal_avg{dealer_code}.pkl", seasonal_avg)

        # quarter_avg = df.groupby(['dealer_code', 'part_no','quarter'])['purchase_qty'].mean().to_dict()
        # with open(f"./../{TEST_MODEL_en}/quarter_avg.pkl", "wb") as f:
        #     pickle.dump(quarter_avg, f)
        #append_to_pkl(f"./../{TEST_MODEL_en}/quarter_avg_{dealer_code}.pkl", quarter_avg)

        # Save data to parquet if dealer_code is specified
        # if dealer_code:
        #     save_path = "./../{TEST_MODEL_en}/dealer_data"
        #     os.makedirs(save_path, exist_ok=True)
        #     df.to_parquet(os.path.join(save_path, f"dealer_{dealer_code}.parquet"), index=False)
            
        # Final feature list and target
        features = ['part_no', 'year', 'month', 'day_of_week', 'week_of_year', 'is_holiday',
                    '3_month_avg', '6_month_avg', '3_month_std', 'lag_1', 'lag_7', 'lag_30', 'lag_90', 'is_active']
        target = 'purchase_qty'

        logging.info(f"Preprocessing completed. Final data shape: {df.shape}")
        return df[features], df[target], df, le_dealer, le_part

    except Exception as e:
        logging.error(f"Error preprocessing data: {e}")
        raise

# def load_combined_training_data():
#     save_path = "./../{TEST_MODEL_en}/dealer_data"
#     print('loading files..')
#     all_files = glob.glob("./../{TEST_MODEL_en}/dealer_data/dealer_*.parquet")
#     combined_df = pd.concat((pd.read_parquet(fp) for fp in all_files), ignore_index=True)
#     print('Files loaded..')
#     combined_df = combined_df.sort_values(by=['dealer_code', 'part_no', 'invoice_date'])
#     features = ['dealer_code', 'part_no', 'year', 'month', 'day_of_week', 'week_of_year','is_holiday', 
#                 '3_month_avg', '6_month_avg','3_month_std', 'lag_1', 'lag_7','is_active','season','quarter']
    
#                 # 'dealer_code', 'part_no', 'year', 'month', 'day_of_week', 'week_of_year', 
#                 # 'is_holiday','3_month_avg', '6_month_avg','3_month_std', 'lag_1', 'lag_7',
#                 # 'is_active', 'season','quarter'
#     target = 'purchase_qty'
#     X = combined_df[features]
#     y = combined_df[target]
#     return X, y,combined_df

def train_model(X,y,dealer_code):
    TEST_MODEL_en = f'TEST_MODEL_en_{dealer_code}'
    print(TEST_MODEL_en)
    try:
        tscv = TimeSeriesSplit(n_splits=5)
        param_grid = {
            'n_estimators': [100, 300, 500, 700], # More options
            'learning_rate': [0.01, 0.05, 0.1, 0.2], # More options
            'max_depth': [3, 5, 7, 9], # More options
            'subsample': [0.7, 0.8, 1.0], # More options
            'colsample_bytree': [0.7, 0.8, 1.0] # Added hyperparameter
        }
        #X,y,_ = load_combined_training_data()
        model = XGBRegressor(random_state=42)
        grid_search = GridSearchCV(model, param_grid, cv=tscv, scoring='r2', verbose=2, n_jobs=-1)
        grid_search.fit(X, y)

        # random_search = RandomizedSearchCV(model, param_grid, cv=tscv, scoring='r2', 
        #                                 verbose=2, n_iter=30, random_state=42, n_jobs=-1)
        # random_search.fit(X, y)
        # best_model = random_search.best_estimator_


        best_model = grid_search.best_estimator_
        y_pred = best_model.predict(X)

        mse = mean_squared_error(y, y_pred)
        r2 = r2_score(y, y_pred)

        logging.info(f"Final Model MSE: {mse:.4f}")
        logging.info(f"Final Model R2: {r2:.4f}")

        with open(f"./../{TEST_MODEL_en}/inventory_model_{r2:2f}.pkl", "wb") as f:
            pickle.dump(best_model, f)

        logging.info("Model saved successfully as 'inventory_model_2.pkl'")
        return best_model, y, y_pred
    except Exception as e:
        logging.error(f"Error training model: {e}")
        raise

def plot_feature_importance(model):
    try:
        import matplotlib.pyplot as plt
        plt.figure(figsize=(10, 6))
        plot_importance(model)
        plt.title("Feature Importance")
        plt.show()
    except Exception as e:
        logging.error(f"Error plotting feature importance: {e}")

def store_predictions(y_test, y_pred):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        predictions = [(datetime.now(), float(y_test.iloc[i]), float(y_pred[i])) for i in range(len(y_test))]
        insert_query = """
        INSERT INTO predictions (timestamp, actual, predicted)
        VALUES (%s, %s, %s)
        """
        cursor.executemany(insert_query, predictions)
        conn.commit()
        conn.close()
        logging.info("Predictions stored successfully in PostgreSQL.")
    except Exception as e:
        logging.error(f"Error storing predictions: {e}")
        raise

def evaluate_model(model, X, y):
    try:
        logging.info("Evaluating the final model...")
        y_pred = model.predict(X)
        mse = mean_squared_error(y, y_pred)
        r2 = r2_score(y, y_pred)
        logging.info(f"Final Model Evaluation - MSE: {mse:.4f}, R2 Score: {r2:.4f}")
    except Exception as e:
        logging.error(f"Error during evaluation: {e}")
        raise


