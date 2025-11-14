import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import joblib  # Use joblib for scikit-learn models
import pandas as pd
from typing import Dict, Any

# --- 1. Pydantic Models ---
class PredictionRequest(BaseModel):
    dealer_code: str
    part_number: str
    month: str

class PredictionResponse(BaseModel):
    predicted_quantity: int

# --- 2. Initialize FastAPI App ---
app = FastAPI()

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

# --- 3. Model Loading & Caching ---

# --- THIS IS THE CORRECT PATH LOGIC ---
# Get the directory where this script (prediction_backend.py) is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__)) 
# From SCRIPT_DIR (which is '.../backend'), go one level up ('../')
# and then join with the 'MNAO' folder.
MODEL_BASE_PATH = os.path.join(SCRIPT_DIR, "../MNAO")
# --- END OF FIX ---

print(f"Attempting to load models from base path: {MODEL_BASE_PATH}")

# A cache to hold loaded models in memory.
model_cache: Dict[str, Dict[str, Any]] = {}

# List of all months to convert month name to a number
ALL_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

def load_model_assets(dealer_code: str) -> Dict[str, Any]:
    """
    Loads all .pkl files for a given dealer into memory
    and stores them in the cache.
    """
    if dealer_code in model_cache:
        return model_cache[dealer_code]

    print(f"Cache miss. Loading models for dealer: {dealer_code}...")

    # Construct the path, e.g., ".../MNAO/TEST_MODEL_en_10131"
    model_folder = os.path.join(MODEL_BASE_PATH, f"TEST_MODEL_en_{dealer_code}")
    print(f"Looking for model folder at: {model_folder}")

    if not os.path.exists(model_folder):
        print(f"Error: Model folder not found at {model_folder}")
        # This is the 404 error you are seeing. It's correct.
        raise HTTPException(status_code=404, detail=f"No model available for dealer code: {dealer_code}")

    assets = {}
    try:
        # Define all the files we expect to find
        files_to_load = [
            "inventory_model_2.pkl",
            "dealer_encoder.pkl",
            "part_encoder.pkl",
            "default_3month_avg.pkl",
            "default_3month_std.pkl",
            "default_6month_avg.pkl",
            "is_active_mapping.pkl"
        ]
        
        for file in files_to_load:
            file_path = os.path.join(model_folder, file)
            if not os.path.exists(file_path):
                 print(f"Error: Missing required file: {file} in {model_folder}")
                 raise FileNotFoundError(f"Missing required file: {file}")
            
            asset_name = file.replace(".pkl", "") # "inventory_model_2"
            assets[asset_name] = joblib.load(file_path)
            
        model_cache[dealer_code] = assets
        print(f"Successfully loaded and cached models for {dealer_code}.")
        return assets
        
    except FileNotFoundError as e:
        print(f"Error loading model assets: {e}")
        raise HTTPException(status_code=500, detail=f"Missing model file for dealer {dealer_code}. {e}")
    except Exception as e:
        print(f"Generic error loading model: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading models for dealer {dealer_code}.")

# --- 4. The "Real" Prediction Endpoint ---
@app.post("/predict", response_model=PredictionResponse)
async def predict_quantity(request: PredictionRequest):
    """
    This endpoint now uses the REAL loaded ML models
    to perform a prediction.
    """
    print(f"[Request Received] Dealer: {request.dealer_code}, Part: {request.part_number}, Month: {request.month}")

    try:
        # Step 1: Load model assets (or get from cache)
        assets = load_model_assets(request.dealer_code)

        # Step 2: Prepare the feature vector for the model
        features = {}

        # --- Use Encoders ---
        try:
            features["dealer_code"] = assets["dealer_encoder"].transform([request.dealer_code])[0]
        except Exception:
            raise HTTPException(status_code=400, detail=f"Unknown dealer code for this model: {request.dealer_code}")

        try:
            features["part_number"] = assets["part_encoder"].transform([request.part_number])[0]
        except Exception:
             raise HTTPException(status_code=400, detail=f"Unknown part number for this model: {request.part_number}")

        # --- Convert Month ---
        try:
            features["month"] = ALL_MONTHS.index(request.month) + 1
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid month name: {request.month}")

        # --- Use Default/Imputed Values ---
        features["default_3month_avg"] = assets["default_3month_avg"]
        features["default_3month_std"] = assets["default_3month_std"]
        features["default_6month_avg"] = assets["default_6month_avg"]
        
        features["is_active"] = assets["is_active_mapping"].get(request.part_number, 0)

        # Step 3: Create a Pandas DataFrame
        feature_order = [
            "part_number", 
            "dealer_code", 
            "month",
            "is_active",
            "default_3month_avg",
            "default_6month_avg",
            "default_3month_std"
        ]
        
        input_df = pd.DataFrame([features])
        # Check if all columns are present
        for col in feature_order:
            if col not in input_df.columns:
                print(f"Error: Missing feature column '{col}' in input DataFrame")
                raise HTTPException(status_code=500, detail=f"Model feature mismatch: missing {col}")

        input_df = input_df[feature_order] 

        # Step 4: Predict!
        model = assets["inventory_model_2"]
        prediction = model.predict(input_df)
        
        final_prediction = int(round(prediction[0]))

        print(f"Prediction successful. Result: {final_prediction}")
        return {"predicted_quantity": final_prediction}

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Unhandled error during prediction: {e}")
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")

# --- 5. Run the Server ---
if __name__ == "__main__":
    print("Starting FastAPI ML server on http://127.0.0.1:8000...")
    uvicorn.run(app, host="127.0.D.1", port=8000)