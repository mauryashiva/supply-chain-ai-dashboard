import axios from "axios";
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

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Type for Daily Revenue Data
export interface RevenueDataPoint {
  date: string; // 'YYYY-MM-DD'
  revenue: number;
}

// --- CHANGE 1: Define type for Monthly Revenue Data ---
export interface MonthlyRevenueDataPoint {
  month: string; // e.g., "Jan", "Feb"
  revenue: number;
}

// -- Data Fetching Functions --
export const getDashboardSummary = () =>
  apiClient.get<AnalyticsSummary>("/analytics/summary");
export const getProducts = () =>
  apiClient.get<Product[]>("/inventory/products");
export const getOrders = () => apiClient.get<Order[]>("/orders/");
export const getVehicles = () =>
  apiClient.get<Vehicle[]>("/logistics/vehicles");
export const getUsers = () => apiClient.get<User[]>("/users/");

/**
 * Fetches a list of products that are low in stock.
 */
export const getLowStockProducts = () =>
  apiClient.get<{ data: LowStockProduct[] }>("/analytics/low-stock-products");

// --- CHANGE 2: Naya forecast function add karein ---
// --- YAHAN BADLAAV KIYA GAYA HAI ---
/**
 * Fetches 30-day demand forecast.
 * @param productId (Optional) If provided, forecasts for this specific product ID.
 */
export const getDemandForecast = (productId?: number) =>
  apiClient.get<DemandForecast>("/forecast", {
    params: { product_id: productId },
  });
// --- BADLAAV KHATAM ---

// Fetches daily revenue
export const getRevenueOverTime = (days: number = 30) =>
  apiClient.get<{ data: RevenueDataPoint[] }>("/analytics/revenue-over-time", {
    params: { days },
  });

// --- CHANGE 2: Add function to fetch Monthly Revenue ---
/**
 * Fetches revenue data grouped by month for the specified number of months.
 * @param months Number of past months to fetch data for (default: 6).
 */
export const getMonthlyRevenue = (months: number = 6) =>
  apiClient.get<{ data: MonthlyRevenueDataPoint[] }>(
    "/analytics/monthly-revenue",
    {
      params: { months }, // Pass 'months' as a query parameter
    }
  );

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

// -- AI Helper Functions --
export const generateDescription = (productName: string, category?: string) =>
  apiClient.post<{ description: string }>("/ai/generate-description", {
    product_name: productName,
    category: category,
  });

// -- App Settings Functions --
export const getSettings = () => apiClient.get<AppSetting[]>("/settings/");
export const updateSettings = (settingsData: AppSettingsUpdate) =>
  apiClient.put<AppSetting[]>("/settings/", settingsData);

// --- CSV UPLOAD FUNCTIONS ---
export const uploadInventoryCSV = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<{
    message: string;
    products_added: number;
    products_updated: number;
    errors: string[];
    error_report_id?: string;
  }>("/bulk/inventory/upload-csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const uploadOrdersCSV = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<{
    message: string;
    orders_created: number;
    errors: string[];
    error_report_id?: string;
  }>("/bulk/orders/upload-csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// --- CSV EXPORT FUNCTIONS ---
export const exportInventoryCSV = () =>
  apiClient.get("/bulk/inventory/export-csv", { responseType: "blob" });
export const exportOrdersCSV = () =>
  apiClient.get("/bulk/orders/export-csv", { responseType: "blob" });

// --- CSV TEMPLATE DOWNLOAD FUNCTIONS ---
export const downloadInventoryTemplate = () =>
  apiClient.get("/bulk/inventory/template", { responseType: "blob" });
export const downloadOrderTemplate = () =>
  apiClient.get("/bulk/orders/template", { responseType: "blob" });

// --- ERROR FILE DOWNLOAD FUNCTIONS ---
export const downloadInventoryErrorFile = (reportId: string) =>
  apiClient.get(`/bulk/inventory/download-errors/${reportId}`, {
    responseType: "blob",
  });
export const downloadOrderErrorFile = (reportId: string) =>
  apiClient.get(`/bulk/orders/download-errors/${reportId}`, {
    responseType: "blob",
  });
