import axios from "axios";

// ================================
// Types Import
// ================================
import type {
  AnalyticsSummary,
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
  AppSetting,
  AppSettingsUpdate,
  LowStockProduct,
  DemandForecast,
} from "@/types";

// ================================
// Base URL
// ================================
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ================================
// Axios Instance
// ================================
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10s timeout
});

// ================================
// Simple In-Memory Cache
// ================================
const cache = new Map<string, any>();

// ================================
// Request Interceptor (Attach Token)
// ================================
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ================================
// Response Interceptor (Retry + Auth)
// ================================
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Retry once (for cold start)
    if (!config._retry) {
      config._retry = true;

      await new Promise((res) => setTimeout(res, 1500));
      return apiClient(config);
    }

    // Handle Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }

    return Promise.reject(error);
  },
);

// ================================
// Helper: Cached GET
// ================================
const cachedGet = async <T>(key: string, url: string, params?: any) => {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const res = await apiClient.get<T>(url, { params });
  cache.set(key, res);
  return res;
};

// ================================
// Auth APIs
// ================================
export const loginUser = (formData: FormData | URLSearchParams) =>
  apiClient.post("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

export const signupUser = (data: { email: string; password: string }) =>
  apiClient.post("/auth/signup", data);

// ================================
// Analytics APIs
// ================================
export const getDashboardSummary = () =>
  cachedGet<AnalyticsSummary>("dashboard", "/analytics/summary");

export const getLowStockProducts = () =>
  cachedGet<{ data: LowStockProduct[] }>(
    "low-stock",
    "/analytics/low-stock-products",
  );

export const getRevenueOverTime = (days: number = 30) =>
  apiClient.get("/analytics/revenue-over-time", { params: { days } });

export const getMonthlyRevenue = (months: number = 6) =>
  apiClient.get("/analytics/monthly-revenue", {
    params: { months },
  });

// ================================
// Inventory APIs
// ================================
export const getProducts = () =>
  cachedGet<Product[]>("products", "/inventory/products");

export const createProduct = (data: ProductCreate) =>
  apiClient.post<Product>("/inventory/products", data);

export const updateProduct = (id: number, data: ProductUpdate) =>
  apiClient.put<Product>(`/inventory/products/${id}`, data);

export const deleteProduct = (id: number) =>
  apiClient.delete(`/inventory/products/${id}`);

// ================================
// Orders APIs
// ================================
export const getOrders = () => cachedGet<Order[]>("orders", "/orders/");

export const createOrder = (data: OrderCreate) =>
  apiClient.post<Order>("/orders/", data);

export const updateOrder = (id: number, data: OrderUpdate) =>
  apiClient.put<Order>(`/orders/${id}`, data);

export const deleteOrder = (id: number) => apiClient.delete(`/orders/${id}`);

// ================================
// Users APIs
// ================================
export const getUsers = () => cachedGet<User[]>("users", "/users/");

export const createUser = (data: UserCreate) =>
  apiClient.post<User>("/users/", data);

export const updateUser = (id: number, data: UserUpdate) =>
  apiClient.put<User>(`/users/${id}`, data);

export const deleteUser = (id: number) => apiClient.delete(`/users/${id}`);

// ================================
// Logistics APIs
// ================================
export const getVehicles = () =>
  cachedGet<Vehicle[]>("vehicles", "/logistics/vehicles");

// ================================
// Forecast APIs
// ================================
export const getDemandForecast = (productId?: number) =>
  apiClient.get<DemandForecast>("/forecast", {
    params: { product_id: productId },
  });

export const getTopMovers = () =>
  apiClient.get("/forecast/top-movers-tomorrow");

// ================================
// AI APIs
// ================================
export const generateDescription = (productName: string, category?: string) =>
  apiClient.post("/ai/generate-description", {
    product_name: productName,
    category,
  });

// ================================
// Settings APIs
// ================================
export const getSettings = () =>
  cachedGet<AppSetting[]>("settings", "/settings/");

export const updateSettings = (data: AppSettingsUpdate) =>
  apiClient.put<AppSetting[]>("/settings/", data);

// ================================
// CSV Upload APIs
// ================================
export const uploadInventoryCSV = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post("/bulk/inventory/upload-csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadOrdersCSV = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post("/bulk/orders/upload-csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ================================
// CSV Export APIs
// ================================
export const exportInventoryCSV = () =>
  apiClient.get("/bulk/inventory/export-csv", {
    responseType: "blob",
  });

export const exportOrdersCSV = () =>
  apiClient.get("/bulk/orders/export-csv", {
    responseType: "blob",
  });

// ================================
// CSV Template APIs
// ================================
export const downloadInventoryTemplate = () =>
  apiClient.get("/bulk/inventory/template", {
    responseType: "blob",
  });

export const downloadOrderTemplate = () =>
  apiClient.get("/bulk/orders/template", {
    responseType: "blob",
  });

// ================================
// Error File Download APIs
// ================================
export const downloadInventoryErrorFile = (id: string) =>
  apiClient.get(`/bulk/inventory/download-errors/${id}`, {
    responseType: "blob",
  });

export const downloadOrderErrorFile = (id: string) =>
  apiClient.get(`/bulk/orders/download-errors/${id}`, {
    responseType: "blob",
  });
