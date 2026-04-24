export interface KpiCard {
  title: string;
  value: string;
  change?: string;
}

export interface TopProduct {
  name: string;
  value: number;
}

export interface DeliveryStatusChart {
  on_time: number;
  delayed: number;
}

export interface OrderStatusBreakdownItem {
  status: string;
  value: number;
}

export interface AnalyticsSummary {
  kpi_cards: KpiCard[];
  top_selling_products: TopProduct[];
  delivery_status: DeliveryStatusChart;
  order_status_breakdown: OrderStatusBreakdownItem[];
}

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

export interface DemandForecast {
  product_id: number | null;
  model_confidence: number;
  forecast: ForecastDataPoint[];
  accuracy_metrics?: { mae: number; rmse: number; mape: number };
  seasonal_decomposition?: {
    trend: number[];
    seasonal: number[];
    residual: number[];
  } | null;
  historical_summary?: {
    total_days: number;
    avg_daily_demand: number;
    max_daily_demand: number;
    total_demand: number;
  };
}

export interface TopMover {
  id: number;
  name: string;
  sku: string;
  predicted_qty: number;
  current_stock: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface LowStockProduct {
  // <--- MUST HAVE 'export'
  name: string;
  stock_quantity: number;
}

// src/types/analytics.ts

// ... keep existing code (KpiCard, TopProduct, etc.)

/**
 * Accuracy metrics for forecast evaluation.
 */
export interface ForecastAccuracy {
  mae: number;
  rmse: number;
  mape: number;
}

/**
 * Seasonal decomposition components.
 */
export interface SeasonalDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
}

/**
 * Historical summary statistics.
 */
export interface HistoricalSummary {
  total_days: number;
  avg_daily_demand: number;
  max_daily_demand: number;
  total_demand: number;
}

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
