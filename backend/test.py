import pickle
import pandas as pd

DEALER = 10131
MODEL_DIR = r"D:\IPMS-clone\iPMS\MNAO\TEST_MODEL_en_10131"
MODEL_FILE = r"inventory_model_2.pkl"
ENCODER_FILE = r"part_encoder.pkl"

YEAR = 2025
MONTH = 4

with open(f"{MODEL_DIR}\\{MODEL_FILE}", "rb") as f:
    model = pickle.load(f)

with open(f"{MODEL_DIR}\\{ENCODER_FILE}", "rb") as f:
    encoder = pickle.load(f)

features = model.get_booster().feature_names
print("Model features:", features)

rows = []
part_names = []

for part_name, part_encoded in zip(encoder.classes_,
                                   encoder.transform(encoder.classes_)):
    row = {
        "dealer_code": DEALER,
        "part_no": int(part_encoded),
        "year": YEAR,
        "month": MONTH,
        "day_of_week": 1,
        "week_of_year": 14,
        "is_holiday": 0,
        "3_month_avg": 5,
        "6_month_avg": 8,
        "3_month_std": 2,
        "lag_1": 5,
        "lag_7": 8,
        "is_active": 1,
    }

    rows.append({f: row.get(f, 0) for f in features})
    part_names.append(part_name)

df = pd.DataFrame(rows)
df["prediction"] = model.predict(df)
df["part_no"] = part_names

print("\nPrediction summary:")
print(df["prediction"].describe())

print("\nTop 10 predicted parts:")
print(df.sort_values("prediction", ascending=False)
        .head(10)[["part_no", "prediction"]])
