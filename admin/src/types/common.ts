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

export interface MediaItem {
  id?: number;
  media_url: string;
  media_type: MediaType;
}

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
  country?: string;
}
