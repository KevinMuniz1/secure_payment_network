import os
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Fraud Detection Service", version="1.0.0")

model = None


@app.on_event("startup")
def load_model():
    global model
    path = os.getenv("MODEL_PATH", "model.pkl")
    if not os.path.exists(path):
        raise RuntimeError(f"Model not found at '{path}'. Run train.py first.")
    model = joblib.load(path)


class FraudCheckRequest(BaseModel):
    amount: float
    transaction_type: int       # 0=DEPOSIT, 1=WITHDRAW, 2=TRANSFER
    hour_of_day: int            # 0-23
    day_of_week: int            # 0=Monday, 6=Sunday
    amount_to_avg_ratio: float  # amount / user's historical average
    transactions_last_hour: int # velocity check


class FraudCheckResponse(BaseModel):
    fraud_score: float   # 0.0 – 1.0 probability of fraud
    is_fraudulent: bool  # true when fraud_score >= threshold (default 0.70)


FRAUD_THRESHOLD = float(os.getenv("FRAUD_THRESHOLD", "0.70"))


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict", response_model=FraudCheckResponse)
def predict(request: FraudCheckRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    features = np.array([[
        request.amount,
        request.transaction_type,
        request.hour_of_day,
        request.day_of_week,
        request.amount_to_avg_ratio,
        request.transactions_last_hour,
    ]])

    fraud_score = float(model.predict_proba(features)[0][1])
    return FraudCheckResponse(
        fraud_score=fraud_score,
        is_fraudulent=fraud_score >= FRAUD_THRESHOLD,
    )
