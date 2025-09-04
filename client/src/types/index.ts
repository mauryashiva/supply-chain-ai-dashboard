// Status types for badges
export type OrderStatus = "Delivered" | "Shipped" | "Pending" | "Cancelled";
export type ProductStatus = "In Stock" | "Low Stock" | "Out of Stock";
export type VehicleStatus = "On Route" | "Idle" | "In-Shop";
export type UserRole = "admin" | "user";

// --- Interface Definitions ---

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

export interface Product {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  status: ProductStatus;
  image_url?: string;
}

export interface ProductCreate {
  name: string;
  sku: string;
  stock_quantity: number;
  status: ProductStatus;
  image_url?: string;
}

export interface ProductUpdate {
  name?: string;
  sku?: string;
  stock_quantity?: number;
  status?: ProductStatus;
  image_url?: string;
}

export interface Order {
  id: number;
  customer_name: string;
  order_date: string;
  status: OrderStatus;
  amount: number;
  shipping_address: string;
}

export interface OrderCreate {
  customer_name: string;
  amount: number;
  shipping_address: string;
  status: OrderStatus;
}

export type OrderUpdate = Partial<OrderCreate>;

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

// UPDATE: Humne DashboardSummary ko hata kar AnalyticsSummary ke andar daal diya hai
// taaki saara data ek hi jagah se aaye.

// UPDATE: Yeh naye types Analytics page ke charts ke liye hain.
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

// UPDATE: Yeh naya, detailed type Analytics aur Dashboard, dono pages use karenge.
export interface AnalyticsSummary {
  kpi_cards: KpiCard[];
  top_selling_products: TopProduct[];
  delivery_status: DeliveryStatusChart;
}
