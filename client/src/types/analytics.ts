/**
 * Represents a single KPI card on the dashboard.
 */
export interface KpiCard {
  title: string;
  value: string;
  change?: string;
}

/**
 * Represents a top-selling product in analytics.
 */
export interface TopProduct {
  name: string;
  value: number;
}

/**
 * Data structure for delivery performance metrics.
 */
export interface DeliveryStatusChart {
  on_time: number;
  delayed: number;
}

/**
 * Item for the order status distribution chart.
 */
export interface OrderStatusBreakdownItem {
  status: string;
  value: number;
}

/**
 * Main summary object for the dashboard analytics.
 */
export interface AnalyticsSummary {
  kpi_cards: KpiCard[];
  top_selling_products: TopProduct[];
  delivery_status: DeliveryStatusChart;
  order_status_breakdown: OrderStatusBreakdownItem[];
}

/**
 * Represents a single revenue record for time-series charts.
 */
export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

/**
 * Represents a product with inventory below the threshold.
 */
export interface LowStockProduct {
  name: string;
  stock_quantity: number;
}
