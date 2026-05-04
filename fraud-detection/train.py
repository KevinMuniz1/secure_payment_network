"""
Trains a Random Forest classifier on synthetic transaction data and saves the model to model.pkl.

Features used:
  amount               - raw transaction amount in USD
  transaction_type     - 0=DEPOSIT, 1=WITHDRAW, 2=TRANSFER
  hour_of_day          - 0-23 (late-night activity is a fraud signal)
  day_of_week          - 0=Monday ... 6=Sunday
  amount_to_avg_ratio  - amount / user's historical average (spikes signal fraud)
  transactions_last_hour - velocity: how many transactions in the past hour

The synthetic labels encode domain knowledge about fraud patterns:
  - Fraudulent: large amounts, late night, TRANSFER type, high velocity, far above average
  - Legitimate: normal amounts, business hours, low velocity, near average
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

np.random.seed(42)

N_LEGIT = 8500
N_FRAUD = 1500

legit = pd.DataFrame({
    "amount":                np.random.uniform(1, 500, N_LEGIT),
    "transaction_type":      np.random.choice([0, 1], N_LEGIT, p=[0.55, 0.45]),
    "hour_of_day":           np.random.randint(8, 22, N_LEGIT),
    "day_of_week":           np.random.randint(0, 7, N_LEGIT),
    "amount_to_avg_ratio":   np.random.uniform(0.3, 2.5, N_LEGIT),
    "transactions_last_hour": np.random.randint(0, 3, N_LEGIT),
    "is_fraud":              0,
})

fraud = pd.DataFrame({
    "amount":                np.random.uniform(1000, 15000, N_FRAUD),
    "transaction_type":      np.full(N_FRAUD, 2),
    "hour_of_day":           np.concatenate([
                                 np.random.randint(0, 5, N_FRAUD // 2),
                                 np.random.randint(22, 24, N_FRAUD // 2),
                             ]),
    "day_of_week":           np.random.randint(0, 7, N_FRAUD),
    "amount_to_avg_ratio":   np.random.uniform(5, 30, N_FRAUD),
    "transactions_last_hour": np.random.randint(3, 15, N_FRAUD),
    "is_fraud":              1,
})

df = pd.concat([legit, fraud]).sample(frac=1, random_state=42).reset_index(drop=True)

FEATURES = [
    "amount",
    "transaction_type",
    "hour_of_day",
    "day_of_week",
    "amount_to_avg_ratio",
    "transactions_last_hour",
]

X = df[FEATURES]
y = df["is_fraud"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    class_weight="balanced",
)
model.fit(X_train, y_train)

print(classification_report(y_test, model.predict(X_test)))

joblib.dump(model, "model.pkl")
print("Model saved → model.pkl")
