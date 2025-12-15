import pickle

model_path = r"../MNAO/TEST_MODEL_en_10131/inventory_model_0.9999995575724113.pkl"

with open(model_path, "rb") as f:
    model = pickle.load(f)

print("Model type:", type(model))
print("Number of trees:", model.n_estimators)
