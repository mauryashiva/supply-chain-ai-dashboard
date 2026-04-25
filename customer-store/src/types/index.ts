// src/types/index.ts

// --- PRODUCT & MEDIA ---
export interface MediaItem {
  id: number;
  media_url: string;
  media_type: "image" | "video";
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  selling_price: number;
  stock_quantity: number;
  category?: string;
  images?: MediaItem[];
  status?: string;
}

// --- ADDRESS ---
export interface Address {
  id: number;
  full_name: string;
  phone_number: string;
  flat: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string; // ✅ ADD THIS LINE
  is_default: boolean;
}

export type AddressCreate = Omit<Address, "id">;

// --- ORDER ---
export interface OrderItem {
  product_id: number;
  quantity: number;
  product_name?: string;
  unit_price?: number;
}

export interface Order {
  id: number;
  order_date: string;
  status: string;
  total_amount: number;
  total_gst: number;
  items: OrderItem[];
  shipping_address: string;
  payment_method: string;
  payment_status: string;
}

// --- RAZORPAY & CHECKOUT ---
export interface RazorpayOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

// Fixed: Ensure the payment_method matches exactly what the backend expects
export interface OrderCreateRequest {
  address_id: number;
  items: { product_id: number; quantity: number }[];
  payment_method: string; // Simplified to string to avoid strict enum errors during API calls
  discount_value?: number;
  discount_type?: "percentage" | "fixed";
  shipping_charges?: number;
}

export interface RazorpayVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// --- ANALYTICS / FORECAST ---
export interface DemandForecastPoint {
  date: string;
  demand_estimate: number;
  day_name: string;
}

export interface DemandForecast {
  forecast: DemandForecastPoint[];
  model_confidence: number;
}
