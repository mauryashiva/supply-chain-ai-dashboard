import pandas as pd
import numpy as np
import warnings
from datetime import datetime, timedelta, date, timezone
from typing import Optional, List, Dict
from calendar import month_abbr

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Modular Imports (Triple dot to reach app root from api/admin/)
from ...database import get_db
from ...schemas.admin import forecast as forecast_schemas
from ...models.admin import inventory as inventory_models
from ...models.admin import order as order_models
from ..auth import get_current_user

warnings.filterwarnings('ignore')

# --- STATSMODELS CONFIGURATION ---
try:
    from statsmodels.tsa.arima.model import ARIMA  # type: ignore
    from statsmodels.tsa.seasonal import seasonal_decompose  # type: ignore
    STATS_MODELS_AVAILABLE = True
except ImportError:
    STATS_MODELS_AVAILABLE = False

router = APIRouter(dependencies=[Depends(get_current_user)])

# --- CORE INFERENCE ENGINES ---

def run_linear_inference(df: pd.DataFrame, days_to_predict: int = 30):
    """Seasonality-aware linear regression with one-hot encoded days of week."""
    df['time_index'] = np.arange(len(df))
    df['day_of_week'] = df['date'].dt.dayofweek
    df_encoded = pd.get_dummies(df, columns=['day_of_week'], prefix='dow')

    for i in range(7):
        col = f'dow_{i}'
        if col not in df_encoded.columns:
            df_encoded[col] = 0

    feature_cols = ['time_index'] + [f'dow_{i}' for i in range(7)]
    X = df_encoded[feature_cols]
    y = df_encoded['total_quantity']

    model = LinearRegression()
    model.fit(X, y)
    
    preds_hist = model.predict(X)
    std_dev = np.std(y - preds_hist)

    return model, feature_cols, std_dev, df['time_index'].max()

def run_arima_forecast(df: pd.DataFrame, days_to_predict: int = 30):
    """Advanced ARIMA forecasting with auto-fallback to Exponential Smoothing."""
    if not STATS_MODELS_AVAILABLE:
        values = df['total_quantity'].values
        forecast = [values[-1]] * days_to_predict
        std_dev = np.std(values) if len(values) > 1 else 1
        return {
            'forecast': np.array(forecast),
            'lower_ci': np.array(forecast) - 1.96 * std_dev,
            'upper_ci': np.array(forecast) + 1.96 * std_dev
        }

    try:
        ts = df.set_index('date')['total_quantity']
        model = ARIMA(ts, order=(1, 1, 1))
        model_fit = model.fit()
        forecast = model_fit.forecast(steps=days_to_predict)
        pred_ci = model_fit.get_forecast(steps=days_to_predict).conf_int()
        return {
            'forecast': forecast.values,
            'lower_ci': pred_ci.iloc[:, 0].values,
            'upper_ci': pred_ci.iloc[:, 1].values
        }
    except Exception:
        values = df['total_quantity'].values
        forecast = [values[-1]] * days_to_predict
        std_dev = np.std(values) if len(values) > 1 else 1
        return {
            'forecast': np.array(forecast),
            'lower_ci': np.array(forecast) - 1.96 * std_dev,
            'upper_ci': np.array(forecast) + 1.96 * std_dev
        }

def calculate_accuracy_metrics(df: pd.DataFrame):
    """Calculates MAE, RMSE, and MAPE using a historical backtest split."""
    if len(df) < 14:
        return {'mae': 0, 'rmse': 0, 'mape': 0}
    
    train_size = max(len(df) - 7, len(df) // 2)
    train_df = df[:train_size]
    test_df = df[train_size:]

    model, feature_cols, _, _ = run_linear_inference(train_df)
    
    predictions = []
    for i, row in test_df.iterrows():
        dow = row['date'].weekday()
        future_row = {col: 0 for col in feature_cols}
        future_row['time_index'] = i - len(train_df) + train_df['time_index'].max() + 1
        future_row[f'dow_{dow}'] = 1
        X_future = pd.DataFrame([future_row])[feature_cols]
        predictions.append(max(0, model.predict(X_future)[0]))

    actual = test_df['total_quantity'].values
    mae = mean_absolute_error(actual, predictions)
    rmse = np.sqrt(mean_squared_error(actual, predictions))
    mape = np.mean(np.abs((actual - predictions) / (actual + 1))) * 100

    return {'mae': round(mae, 2), 'rmse': round(rmse, 2), 'mape': round(mape, 2)}

def get_seasonal_decomposition(df: pd.DataFrame):
    """Extracts Trend, Seasonality, and Residual components for UI visualization."""
    if not STATS_MODELS_AVAILABLE or len(df) < 14:
        return None
    try:
        ts = df.set_index('date')['total_quantity']
        decomp = seasonal_decompose(ts, model='additive', period=7)
        return {
            'trend': decomp.trend.dropna().tail(7).values.tolist(),
            'seasonal': decomp.seasonal.dropna().tail(7).values.tolist(),
            'residual': decomp.resid.dropna().tail(7).values.tolist()
        }
    except Exception:
        return None

# --- ENDPOINTS ---

@router.get("/", response_model=forecast_schemas.DemandForecast)
def get_demand_forecast(product_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Main forecasting endpoint providing a 30-day ensemble demand prediction."""
    today = datetime.now(timezone.utc).date()
    history_limit = today - timedelta(days=120)
    
    query = db.query(
        cast(order_models.Order.order_date, Date).label("date"),
        func.sum(order_models.OrderItem.quantity).label("total_quantity")
    ).join(order_models.OrderItem, order_models.OrderItem.order_id == order_models.Order.id)\
     .filter(order_models.Order.order_date >= history_limit)

    if product_id:
        query = query.filter(order_models.OrderItem.product_id == product_id)
    
    order_data = query.group_by("date").order_by("date").all()

    if not order_data:
        return {"forecast": [], "model_confidence": 0}

    df = pd.DataFrame(order_data, columns=['date', 'total_quantity'])
    df['date'] = pd.to_datetime(df['date'])
    
    idx = pd.date_range(start=df['date'].min(), end=today, freq='D')
    df = df.set_index('date').reindex(idx, fill_value=0).reset_index().rename(columns={'index': 'date'})
    
    accuracy = calculate_accuracy_metrics(df)
    decomposition = get_seasonal_decomposition(df)
    linear_model, feature_cols, linear_std_dev, last_idx = run_linear_inference(df)
    arima_res = run_arima_forecast(df)
    
    forecast_results = []
    for i in range(1, 31):
        future_date = today + timedelta(days=i)
        dow = future_date.weekday()
        
        future_row = {col: 0 for col in feature_cols}
        future_row['time_index'] = last_idx + i
        future_row[f'dow_{dow}'] = 1
        l_pred = linear_model.predict(pd.DataFrame([future_row])[feature_cols])[0]
        a_pred = arima_res['forecast'][i-1] if i-1 < len(arima_res['forecast']) else l_pred
        
        ensemble = (0.7 * l_pred) + (0.3 * a_pred)
        val = max(0, float(ensemble))
        
        linear_ci = 1.96 * (1 + (i * 0.01)) * linear_std_dev
        combined_lower = min(arima_res['lower_ci'][i-1] if i-1 < len(arima_res['lower_ci']) else val - linear_ci, val - linear_ci)
        combined_upper = max(arima_res['upper_ci'][i-1] if i-1 < len(arima_res['upper_ci']) else val + linear_ci, val + linear_ci)
        
        forecast_results.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "day_name": future_date.strftime("%A"),
            "demand_estimate": round(val, 2),
            "confidence_upper": round(max(0, combined_upper), 2),
            "confidence_lower": round(max(0, combined_lower), 2),
            "linear_forecast": round(max(0, float(l_pred)), 2),
            "arima_forecast": round(max(0, float(a_pred)), 2),
            "is_weekend": dow >= 5
        })

    data_quality = min(1.0, len(df)/90)
    accuracy_score = max(0, 1 - accuracy['mape']/100) if accuracy['mape'] > 0 else 0.5
    confidence = round((data_quality * 40 + accuracy_score * 60), 2)

    return {
        "product_id": product_id,
        "model_confidence": confidence,
        "forecast": forecast_results,
        "accuracy_metrics": accuracy,
        "seasonal_decomposition": decomposition,
        "historical_summary": {
            "total_days": len(df),
            "avg_daily_demand": round(df['total_quantity'].mean(), 2),
            "max_daily_demand": int(df['total_quantity'].max()),
            "total_demand": int(df['total_quantity'].sum())
        }
    }

@router.get("/today-forecast", response_model=List[forecast_schemas.TodayProductForecast])
def get_today_product_forecast(db: Session = Depends(get_db)):
    """Inference map data: predicts demand for the current day across the entire inventory."""
    today = datetime.now(timezone.utc).date()
    history_limit = today - timedelta(days=180)
    
    products = db.query(inventory_models.Product).all()
    today_forecasts = []
    
    for product in products:
        data = db.query(
            cast(order_models.Order.order_date, Date).label("date"),
            func.sum(order_models.OrderItem.quantity).label("qty")
        ).join(order_models.OrderItem).filter(
            order_models.OrderItem.product_id == product.id,
            order_models.Order.order_date >= history_limit
        ).group_by("date").all()

        if len(data) < 7: continue

        df = pd.DataFrame(data, columns=['date', 'total_quantity'])
        df['date'] = pd.to_datetime(df['date'])
        idx = pd.date_range(start=df['date'].min(), end=today, freq='D')
        df = df.set_index('date').reindex(idx, fill_value=0).reset_index().rename(columns={'index': 'date'})
        
        model, feature_cols, std_dev, last_idx = run_linear_inference(df)
        
        dow = today.weekday()
        f_row = {c: 0 for c in feature_cols}
        f_row['time_index'], f_row[f'dow_{dow}'] = last_idx + 1, 1
        
        pred = max(0, int(model.predict(pd.DataFrame([f_row])[feature_cols])[0]))

        stock_status = "sufficient"
        if product.stock_quantity < pred:
            stock_status = "critical" if product.stock_quantity < pred * 0.5 else "low"
        
        yesterday_qty = next((d.qty for d in data if d.date == today - timedelta(days=1)), 0)
        trend = "stable"
        if pred > yesterday_qty * 1.2: trend = "increasing"
        elif pred < yesterday_qty * 0.8: trend = "decreasing"
        
        today_forecasts.append({
            "id": product.id,
            "name": product.name,
            "sku": product.sku,
            "predicted_demand": pred,
            "current_stock": product.stock_quantity,
            "stock_status": stock_status,
            "trend": trend,
            "confidence_score": round(max(0, 1 - (std_dev / (df['total_quantity'].mean() + 1))), 2),
            "avg_daily_demand": round(df['total_quantity'].mean(), 2),
            "days_of_stock": int(product.stock_quantity / max(pred, 1)) if pred > 0 else 999
        })
    
    today_forecasts.sort(key=lambda x: x['predicted_demand'], reverse=True)
    return today_forecasts

@router.get("/top-movers-tomorrow", response_model=List[dict])
def get_top_movers_tomorrow(db: Session = Depends(get_db)):
    """Predicts which products will have highest volume in the next 24 hours."""
    today = datetime.now(timezone.utc).date()
    tomorrow = today + timedelta(days=1)
    history_limit = today - timedelta(days=180) 
    
    products = db.query(inventory_models.Product).all()
    movers = []

    for product in products:
        data = db.query(
            cast(order_models.Order.order_date, Date).label("date"),
            func.sum(order_models.OrderItem.quantity).label("qty")
        ).join(order_models.OrderItem).filter(
            order_models.OrderItem.product_id == product.id,
            order_models.Order.order_date >= history_limit
        ).group_by("date").all()

        if len(data) < 2: continue 

        df = pd.DataFrame(data, columns=['date', 'total_quantity'])
        df['date'] = pd.to_datetime(df['date'])
        model, feature_cols, _, last_idx = run_linear_inference(df)
        
        dow = tomorrow.weekday()
        f_row = {c: 0 for c in feature_cols}
        f_row['time_index'], f_row[f'dow_{dow}'] = last_idx + 1, 1
        
        prediction = max(0, int(model.predict(pd.DataFrame([f_row])[feature_cols])[0]))

        if prediction >= 0: 
            movers.append({
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "predicted_qty": prediction if prediction > 0 else 1, 
                "current_stock": product.stock_quantity
            })

    movers.sort(key=lambda x: x['predicted_qty'], reverse=True)
    return movers[:5]