import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from sklearn.linear_model import LinearRegression
import numpy as np
from datetime import datetime, timedelta
# --- CHANGE 1: 'Optional' ko import karein ---
from typing import Optional

from ..database import get_db
from ..schemas import schemas
from ..models import models

router = APIRouter()

@router.get("/forecast", response_model=schemas.DemandForecast)
# --- CHANGE 2: 'product_id' ko optional parameter ke taur par add karein ---
def get_demand_forecast(
    product_id: Optional[int] = None, 
    db: Session = Depends(get_db)
):
    """
    Generates a 30-day demand forecast.
    If 'product_id' is provided, forecasts for that specific product.
    Otherwise, forecasts total demand for all products.
    """
    
    # 1. Database se pichle 90 din ka data fetch karein
    ninety_days_ago = datetime.utcnow().date() - timedelta(days=90)
    
    # Query ko banana shuru karein
    query = db.query(
        cast(models.Order.order_date, Date).label("date"),
        func.sum(models.OrderItem.quantity).label("total_quantity")
    ).join(models.OrderItem, models.OrderItem.order_id == models.Order.id)\
     .filter(cast(models.Order.order_date, Date) >= ninety_days_ago)

    # --- CHANGE 3: Agar product_id hai, to query ko filter karein ---
    if product_id:
        query = query.filter(models.OrderItem.product_id == product_id)
    
    # Query ko poora karein
    order_data_query = query.group_by(cast(models.Order.order_date, Date))\
                            .order_by(cast(models.Order.order_date, Date))\
                            .all()

    if not order_data_query:
        raise HTTPException(status_code=404, detail="Not enough historical data to generate a forecast.")

    # 2. Data ko Pandas DataFrame mein convert karein
    df = pd.DataFrame(order_data_query, columns=['date', 'total_quantity'])
    df['date'] = pd.to_datetime(df['date'])
    
    # Fill in missing dates with 0 quantity
    # Isse model ko data mein 'gaps' nahi milenge
    date_range = pd.date_range(start=ninety_days_ago, end=datetime.utcnow().date(), freq='D')
    df = df.set_index('date').reindex(date_range, fill_value=0).reset_index().rename(columns={'index': 'date'})
    df['total_quantity'] = df['total_quantity'].astype(int)
    
    df['time_index'] = (df['date'] - df['date'].min()).dt.days

    # 3. AI Model (Linear Regression) ko train karein
    X = df[['time_index']]
    y = df['total_quantity']
    
    model = LinearRegression()
    model.fit(X, y)

    # 4. Agle 30 dinon ke liye predict karein
    last_time_index = df['time_index'].max()
    future_time_index = np.array(range(last_time_index + 1, last_time_index + 31)).reshape(-1, 1)
    
    predicted_quantities = model.predict(future_time_index)
    
    today = datetime.utcnow().date()
    forecast_data = []
    
    for i in range(30):
        future_date = today + timedelta(days=i + 1)
        predicted_value = max(0, int(predicted_quantities[i])) # Negative forecast na dikhayein
        
        forecast_data.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "value": predicted_value
        })

    return {"forecast": forecast_data}