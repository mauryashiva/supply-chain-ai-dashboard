/**
 * Accuracy metrics for the AI engine evaluation.
 */
export interface ForecastAccuracy {
  mae: number;
  rmse: number;
  mape: number;
}

/**
 * Seasonal decomposition components (Trend/Season/Noise).
 */
export interface SeasonalDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
}

/**
 * Aggregated historical summary for a specific product.
 */
export interface HistoricalSummary {
  total_days: number;
  avg_daily_demand: number;
  max_daily_demand: number;
  total_demand: number;
}

/**
 * Individual data point for the demand forecast timeline.
 */
export interface ForecastDataPoint {
  date: string;
  day_name: string;
  demand_estimate: number;
  confidence_upper: number;
  confidence_lower: number;
  linear_forecast?: number;
  arima_forecast?: number;
  is_weekend: boolean;
  displayDate?: string;
}

/**
 * Today's real-time inference snapshot for a product.
 */
export interface TodayProductForecast {
  id: number;
  name: string;
  sku: string;
  predicted_demand: number;
  current_stock: number;
  stock_status: "sufficient" | "low" | "critical";
  trend: "increasing" | "stable" | "decreasing";
  confidence_score: number;
  avg_daily_demand: number;
  days_of_stock: number;
}

/**
 * Full demand forecast response from the AI engine.
 */
export interface DemandForecast {
  product_id: number | null;
  model_confidence: number;
  forecast: ForecastDataPoint[];
  accuracy_metrics?: ForecastAccuracy;
  seasonal_decomposition?: SeasonalDecomposition | null;
  historical_summary?: HistoricalSummary;
}
