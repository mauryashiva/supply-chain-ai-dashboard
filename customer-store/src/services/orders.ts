import { apiClient } from "./client";

export const orderService = {
  // Matches backend: POST /api/customer/orders/place-order
  placeOrder: (data: any) =>
    apiClient.post("/customer/orders/place-order", data),

  // Matches backend: GET /api/customer/orders/my-orders
  getMyOrders: () => apiClient.get("/customer/orders/my-orders"),
};
