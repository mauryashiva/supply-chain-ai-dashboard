// --- Type Aliases ---
// Defines the possible string literal values for various status fields and types.

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "In_Transit"
  | "Delivered"
  | "Cancelled"
  | "Returned";
export type PaymentStatus = "Paid" | "Unpaid" | "Pending" | "COD" | "Refunded";
export type PaymentMethod =
  | "Credit Card"
  | "Debit Card"
  | "UPI"
  | "Net Banking"
  | "Wallet"
  | "COD";
export type ShippingProvider =
  | "Self-Delivery"
  | "BlueDart"
  | "Delhivery"
  | "DTDC";
export type ProductStatus = "In Stock" | "Low Stock" | "Out of Stock";
export type VehicleStatus = "On Route" | "Idle" | "In-Shop";
export type UserRole = "admin" | "user";
export type MediaType = "image" | "video";
export type DiscountType = "percentage" | "fixed";

// --- Interface Definitions ---

/**
 * Represents a single media item (image or video) linked to a product.
 */
export interface MediaItem {
  id?: number;
  media_url: string;
  media_type: MediaType;
}

/**
 * Represents the essential product details nested inside a fetched Order.
 */
export interface ItemProductDetail {
  name: string;
  sku: string;
  selling_price: number;
  gst_rate: number;
}

/**
 * Represents a line item within a fetched Order, including quantity and product details.
 */
export interface ItemInOrder {
  quantity: number;
  product: ItemProductDetail;
}

/**
 * Represents a line item when creating a new Order (uses product_id).
 */
export interface OrderItemCreate {
  product_id: number;
  quantity: number;
}

/**
 * The main Order object structure as received from the API.
 */
export interface Order {
  id: number;
  order_date: string;
  customer_name: string;
  customer_email: string;
  phone_number?: string;
  shipping_address: string;
  // Financial fields calculated by the backend
  subtotal: number;
  discount_value?: number;
  discount_type?: DiscountType;
  total_gst: number;
  shipping_charges?: number;
  total_amount: number;
  // Legacy amount field (may be deprecated)
  amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  status: OrderStatus;
  shipping_provider?: ShippingProvider;
  tracking_id?: string;
  vehicle_id?: number;
  items: ItemInOrder[];
}

/**
 * The payload structure required to create a new Order via the API.
 */
export interface OrderCreate {
  customer_name: string;
  customer_email: string;
  phone_number?: string;
  shipping_address: string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  status: OrderStatus;
  shipping_provider?: ShippingProvider;
  tracking_id?: string;
  vehicle_id?: number;
  // Financial fields sent during creation
  discount_value?: number;
  discount_type?: DiscountType;
  shipping_charges?: number;
  items: OrderItemCreate[];
}

/**
 * The payload structure for updating an Order's fulfillment details.
 */
export interface OrderUpdate {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  shipping_provider?: ShippingProvider;
  tracking_id?: string;
  vehicle_id?: number;
}

// --- USER INTERFACES ---

/**
 * Represents a User account as received from the API.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

/**
 * Payload for creating a new User.
 */
export interface UserCreate {
  name: string;
  email: string;
  password: string; // Password is required on creation
  role: UserRole;
}

/**
 * Payload for updating an existing User. All fields are optional.
 */
export interface UserUpdate {
  name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
}

// --- PRODUCT INTERFACES ---

/**
 * The main Product object structure as received from the API.
 */
export interface Product {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  status: ProductStatus;
  description?: string;
  category?: string;
  supplier?: string;
  reorder_level?: number;
  cost_price?: number;
  selling_price?: number;
  gst_rate?: number; // Tax rate for the product
  last_restocked?: string;
  images?: MediaItem[];
}

/**
 * Payload for creating a new Product.
 */
export interface ProductCreate {
  name: string;
  sku: string;
  stock_quantity: number;
  status: ProductStatus;
  description?: string;
  category?: string;
  supplier?: string;
  reorder_level?: number;
  cost_price?: number;
  selling_price?: number;
  gst_rate?: number;
  last_restocked?: string;
  images?: MediaItem[];
}

/**
 * Payload for updating an existing Product. All fields are optional.
 */
export interface ProductUpdate {
  name?: string;
  sku?: string;
  stock_quantity?: number;
  status?: ProductStatus;
  description?: string;
  category?: string;
  supplier?: string;
  reorder_level?: number;
  cost_price?: number;
  selling_price?: number;
  gst_rate?: number;
  last_restocked?: string;
  images?: MediaItem[];
}

// --- VEHICLE INTERFACE ---

/**
 * Represents a single vehicle in the logistics fleet.
 */
export interface Vehicle {
  id: number;
  vehicle_number: string;
  driver_name: string;
  status: VehicleStatus;
  orders_count: number;
  live_temp: number;
  fuel_level: number;
  latitude: number;
  longitude: number;
}

// --- APP SETTINGS INTERFACES ---

/**
 * Represents a single key-value application setting.
 */
export interface AppSetting {
  setting_key: string;
  setting_value: string;
}

/**
 * Payload for updating the list of application settings.
 */
export interface AppSettingsUpdate {
  settings: AppSetting[];
}

// --- ANALYTICS INTERFACES ---

/**
 * Represents a single KPI card on the dashboard.
 */
export interface KpiCard {
  title: string;
  value: string;
  change?: string;
}

/**
 * Represents a top-selling product.
 */
export interface TopProduct {
  name: string;
  value: number; // e.g., units sold
}

/**
 * Data structure for the delivery status pie chart.
 */
export interface DeliveryStatusChart {
  on_time: number;
  delayed: number;
}

/**
 * Data for a single bar in the order status breakdown chart.
 */
export interface OrderStatusBreakdownItem {
  status: string;
  value: number; // Count for that status
}

/**
 * Represents a single product in the low stock list.
 */
export interface LowStockProduct {
  name: string;
  stock_quantity: number;
}

/**
 * API response structure for the low stock products endpoint.
 */
export interface LowStockProductResponse {
  data: LowStockProduct[];
}

/**
 * The main data structure for the analytics summary endpoint.
 */
export interface AnalyticsSummary {
  kpi_cards: KpiCard[];
  top_selling_products: TopProduct[];
  delivery_status: DeliveryStatusChart;
  order_status_breakdown: OrderStatusBreakdownItem[]; // Breakdown by status
}

/**
 * A single data point for a time-series forecast.
 */
export interface ForecastDataPoint {
  date: string;
  value: number; // Forecasted value (e.g., units)'[]
}

/**
 * API response structure for the demand forecast endpoint.
 */
export interface DemandForecast {
  forecast: ForecastDataPoint[];
}
