import type { ProductStatus, MediaItem } from "./common";

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
  gst_rate?: number;
  last_restocked?: string;
  images?: MediaItem[];
}

export interface ProductCreate extends Omit<Product, "id"> {}
export interface ProductUpdate extends Partial<ProductCreate> {}
