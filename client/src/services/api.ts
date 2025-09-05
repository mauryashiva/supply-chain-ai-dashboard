import axios from "axios";
import type {
  AnalyticsSummary, // <-- FIX: Changed from DashboardSummary
  Order,
  Product,
  User,
  Vehicle,
  UserCreate,
  ProductCreate,
  ProductUpdate,
  UserUpdate,
  OrderCreate,
  OrderUpdate,
} from "@/types";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// -- Data Fetching Functions --
export const getDashboardSummary = () =>
  apiClient.get<AnalyticsSummary>("/analytics/summary"); // <-- FIX: Changed from DashboardSummary

export const getProducts = () =>
  apiClient.get<Product[]>("/inventory/products");

export const getOrders = () => apiClient.get<Order[]>("/orders/");

export const getVehicles = () =>
  apiClient.get<Vehicle[]>("/logistics/vehicles");

export const getUsers = () => apiClient.get<User[]>("/users/");

// -- Data Creation Functions --
export const createUser = (userData: UserCreate) =>
  apiClient.post<User>("/users/", userData);

export const createProduct = (productData: ProductCreate) =>
  apiClient.post<Product>("/inventory/products", productData);

export const createOrder = (orderData: OrderCreate) =>
  apiClient.post<Order>("/orders/", orderData);

// -- Data Modification Functions --
export const updateProduct = (productId: number, productData: ProductUpdate) =>
  apiClient.put<Product>(`/inventory/products/${productId}`, productData);

export const deleteProduct = (productId: number) =>
  apiClient.delete(`/inventory/products/${productId}`);

export const updateUser = (userId: number, userData: UserUpdate) =>
  apiClient.put<User>(`/users/${userId}`, userData);

export const deleteUser = (userId: number) =>
  apiClient.delete(`/users/${userId}`);

export const updateOrder = (orderId: number, orderData: OrderUpdate) =>
  apiClient.put<Order>(`/orders/${orderId}`, orderData);

export const deleteOrder = (orderId: number) =>
  apiClient.delete(`/orders/${orderId}`);
