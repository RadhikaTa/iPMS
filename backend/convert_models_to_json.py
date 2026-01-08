import os
import pickle
import xgboost as xgb
import glob

# ===== CONFIGURE PATHS =====
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_BASE_PATH = os.path.join(ROOT_DIR, "MNAO")

# Folder naming pattern: TEST_MODEL_en_<dealer_code>
dealer_folders = [
    f for f in os.listdir(MODEL_BASE_PATH)
    if os.path.isdir(os.path.join(MODEL_BASE_PATH, f)) and f.startswith("TEST_MODEL_en_")
]

print(f"Found dealer folders: {dealer_folders}")

# ===== HELPER FUNCTION =====
def robust_load_pickle(path):
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except Exception:
        try:
            with open(path, "rb") as f:
                return pickle.load(f, encoding="latin1")
        except Exception as e:
            raise RuntimeError(f"Failed to load {path}: {e}")

# ===== PROCESS EACH DEALER =====
for folder in dealer_folders:
    folder_path = os.path.join(MODEL_BASE_PATH, folder)

    # Detect any inventory_model_*.pkl file
    pkl_files = glob.glob(os.path.join(folder_path, "inventory_model_*.pkl"))
    if not pkl_files:
        print(f"Skipping {folder}: no inventory_model_*.pkl found.")
        continue

    # Pick the first one (you can choose latest/most accurate if multiple)
    pkl_model_path = pkl_files[0]
    json_model_path = os.path.join(folder_path, "inventory_model.json")

    try:
        print(f"Loading pickle model from {pkl_model_path}...")
        model = robust_load_pickle(pkl_model_path)

        if not isinstance(model, xgb.XGBRegressor) and not isinstance(model, xgb.XGBClassifier):
            print(f"Skipping {folder}: model is not XGBRegressor/XGBClassifier.")
            continue

        print(f"Saving JSON model to {json_model_path}...")
        model.save_model(json_model_path)
        print(f"✅ Success: {folder}")

    except Exception as e:
        print(f"❌ Error processing {folder}: {e}")

print("All done!")
