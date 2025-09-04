// client/src/types/index.ts

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
  // UPDATE: Humne image_url ko add kiya hai jo aapke model mein hai
  image_url?: string;
}

export interface ProductCreate {
  name: string;
  sku: string;
  stock_quantity: number;
  status: ProductStatus;
  // UPDATE: Humne image_url ko add kiya hai jo aapke model mein hai
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
  // UPDATE: Humne 'shipping_address' add kiya hai taaki data consistent rahe
  shipping_address: string;
}

export interface OrderCreate {
  customer_name: string;
  amount: number;
  shipping_address: string;
  status: OrderStatus;
}

// UPDATE: Humne 'OrderUpdate' ko aur bhi flexible bana diya hai
// 'Partial' ka matlab hai ki saari fields optional hain.
// Isse hum status ke alawa future mein kuch aur bhi update kar payenge.
export type OrderUpdate = Partial<OrderCreate>;

export interface Vehicle {
  id: number;
  vehicle_number: string;
  driver_name: string;
  status: VehicleStatus;
  orders_count: number;
  live_temp: number;
  fuel_level: number;
  // UPDATE: latitude aur longitude ko add kiya
  latitude: number;
  longitude: number;
}

export interface DashboardSummary {
  total_orders: number;
  total_revenue: number;
  on_time_deliveries: number;
  pending_orders: number;
}
