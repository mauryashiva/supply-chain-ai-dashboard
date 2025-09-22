// --- Type Aliases ---
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

// --- Interface Definitions ---

export interface MediaItem {
  id?: number;
  media_url: string;
  media_type: MediaType;
}

// Represents product details within a fetched order
export interface ItemProductDetail {
  name: string;
  sku: string;
}

// Represents an Item with its quantity inside an Order
export interface ItemInOrder {
  quantity: number;
  product: ItemProductDetail;
}

// Represents an item when creating a new Order
export interface OrderItemCreate {
  product_id: number;
  quantity: number;
}

// The main Order object received from the API
export interface Order {
  id: number;
  order_date: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  status: OrderStatus;
  shipping_provider?: ShippingProvider;
  tracking_id?: string;
  vehicle_id?: number;
  items: ItemInOrder[];
}

// Payload for creating a new Order
export interface OrderCreate {
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  status: OrderStatus;
  shipping_provider?: ShippingProvider;
  tracking_id?: string;
  vehicle_id?: number;
  items: OrderItemCreate[];
}

// Payload for updating an Order's fulfillment details
export interface OrderUpdate {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  shipping_provider?: ShippingProvider;
  tracking_id?: string;
  vehicle_id?: number;
}

// --- USER INTERFACES ---
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
}

// --- PRODUCT INTERFACES ---
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
  gst_rate?: number; // --- ADDED ---
  last_restocked?: string;
  images?: MediaItem[];
}

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
  gst_rate?: number; // --- ADDED ---
  last_restocked?: string;
  images?: MediaItem[];
}

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
  gst_rate?: number; // --- ADDED ---
  last_restocked?: string;
  images?: MediaItem[];
}

// --- VEHICLE INTERFACE ---
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

// --- NEW INTERFACES: For App Settings ---
export interface AppSetting {
  setting_key: string;
  setting_value: string;
}

export interface AppSettingsUpdate {
  settings: AppSetting[];
}

// --- ANALYTICS INTERFACES ---
export interface KpiCard {
  title: string;
  value: string;
  change: string;
}
export interface TopProduct {
  name: string;
  value: number;
}
export interface DeliveryStatusChart {
  on_time: number;
  delayed: number;
}
export interface AnalyticsSummary {
  kpi_cards: KpiCard[];
  top_selling_products: TopProduct[];
  delivery_status: DeliveryStatusChart;
}
