import { apiClient } from "./client";
import type { Product, ProductCreate, ProductUpdate } from "@/types";

export const inventoryService = {
  // Interceptor turns "/inventory/products" into "/api/admin/inventory/products"
  getProducts: () => apiClient.get<Product[]>("/inventory/products"),

  createProduct: (data: ProductCreate) =>
    apiClient.post<Product>("/inventory/products", data),

  updateProduct: (id: number, data: ProductUpdate) =>
    apiClient.put<Product>(`/inventory/products/${id}`, data),

  deleteProduct: (id: number) => apiClient.delete(`/inventory/products/${id}`),
};
