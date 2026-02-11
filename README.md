# iPMS - Intelligent Parts Management System

## Overview
iPMS is an inventory management system with real-time ML-powered predictions for parts quantity forecasting.

## Features
- Real-time ML predictions using trained XGBoost models
- Single part quantity prediction
- Bulk prediction for top 100 parts
- Inventory health monitoring
- Parts management dashboard

## ML Prediction Integration

### How It Works
1. **Historical Data**: Fetches purchase history from PostgreSQL database
2. **Feature Engineering**: Computes rolling averages, lag features, and temporal features
3. **Model Inference**: Uses trained XGBoost model to predict quantities
4. **Fallback**: Uses pre-computed default statistics when no historical data exists

### API Endpoint
```
POST /predict-ml
{
  "dealer_code": "10131",
  "part_number": "PE01-14-302B-MV",
  "month": "April"
}
```

### Model Assets
Models are stored in `MNAO/TEST_MODEL_en_{dealer_code}/`:
- `inventory_model_2.pkl` - XGBoost model
- `part_encoder.pkl` - Part number encoder
- `default_3month_avg.pkl` - Default 3-month averages
- `default_6month_avg.pkl` - Default 6-month averages
- `default_3month_std.pkl` - Default standard deviations
- `is_active_mapping.pkl` - Part active status mapping

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables
Create `backend/.env`:
```
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=your_host
DB_PORT=5432
```

## Tech Stack
- **Backend**: FastAPI, Python 3.x
- **ML**: XGBoost, scikit-learn, pandas
- **Database**: PostgreSQL
- **Frontend**: React, Vite, TailwindCSS
