import { apiClient } from "./client";

export const catalogService = {
  // Matches backend: GET /api/customer/catalog/products
  getProducts: () => apiClient.get("/customer/catalog/products"),

  // Matches backend: GET /api/customer/catalog/products/{id}
  getProductDetails: (id: number) =>
    apiClient.get(`/customer/catalog/products/${id}`),
};
