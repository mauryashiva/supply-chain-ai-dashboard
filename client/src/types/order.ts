import type {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShippingProvider,
  DiscountType,
  Address,
} from "./common";
import type { User } from "@/types/user";

export interface ItemProductDetail {
  name: string;
  sku: string;
  selling_price: number;
  gst_rate: number;
}

export interface ItemInOrder {
  quantity: number;
  product: ItemProductDetail;
  product_id: number;
  product_name: string;
  product_sku: string;
  unit_price: number;
  gst_rate: number;
  gst_amount: number;
  subtotal: number;
}

export interface OrderItemCreate {
  product_id: number;
  quantity: number;
}

export interface Order {
  id: number;
  order_date: string;
  customer_name: string;
  customer_email?: string;
  phone_number?: string;
  shipping_address: string;
  address?: Address;
  subtotal: number;
  discount_value?: number;
  discount_type?: DiscountType;
  total_gst: number;
  shipping_charges?: number;
  total_amount: number;
  amount?: number; // Legacy
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  status: OrderStatus;
  shipping_provider?: ShippingProvider;
  tracking_id?: string;
  vehicle_id?: number;
  items: ItemInOrder[];
  user?: User;
}

export interface OrderCreate extends Omit<
  Order,
  "id" | "order_date" | "items" | "subtotal" | "total_gst" | "total_amount"
> {
  items: OrderItemCreate[];
}

export interface OrderUpdate extends Partial<Omit<Order, "id" | "items">> {}
