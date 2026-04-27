import { apiClient } from "./client";
import type { Order, OrderCreate, OrderUpdate } from "@/types";

export const orderService = {
  getOrders: () => apiClient.get<Order[]>("/orders/"),

  createOrder: (data: OrderCreate) => apiClient.post<Order>("/orders/", data),

  updateOrder: (id: number, data: OrderUpdate) =>
    apiClient.put<Order>(`/orders/${id}`, data),

  deleteOrder: (id: number) => apiClient.delete(`/orders/${id}`),
};
