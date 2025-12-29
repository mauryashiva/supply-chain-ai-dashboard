import axios from "axios";
// Import all necessary types from the types definition file
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

// Define the base URL for the API, falling back to localhost
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Create a pre-configured axios instance for all API calls
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Type definition for daily revenue data points
export interface RevenueDataPoint {
  date: string; // 'YYYY-MM-DD'
  revenue: number;
}

// Type definition for monthly revenue data points
export interface MonthlyRevenueDataPoint {
  month: string; // e.g., "Jan", "Feb"
  revenue: number;
}

// -- Data Fetching Functions --

// Fetches the main analytics summary for the dashboard
export const getDashboardSummary = () =>
  apiClient.get<AnalyticsSummary>("/analytics/summary");

// Fetches the list of all products
export const getProducts = () =>
  apiClient.get<Product[]>("/inventory/products");

// Fetches the list of all orders
export const getOrders = () => apiClient.get<Order[]>("/orders/");

// Fetches the list of all vehicles
export const getVehicles = () =>
  apiClient.get<Vehicle[]>("/logistics/vehicles");

// Fetches the list of all users
export const getUsers = () => apiClient.get<User[]>("/users/");

/**
 * Fetches a list of products that are low in stock.
 */
export const getLowStockProducts = () =>
  apiClient.get<{ data: LowStockProduct[] }>("/analytics/low-stock-products");

/**
 * Fetches 30-day demand forecast.
 * @param productId (Optional) If provided, forecasts for this specific product ID.
 */
export const getDemandForecast = (productId?: number) =>
  apiClient.get<DemandForecast>("/forecast", {
    params: { product_id: productId }, // Pass product_id as a query param if it exists
  });

/**
 * Fetches daily revenue for a specified number of past days.
 * @param days Number of past days (default: 30).
 */
export const getRevenueOverTime = (days: number = 30) =>
  apiClient.get<{ data: RevenueDataPoint[] }>("/analytics/revenue-over-time", {
    params: { days },
  });

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
/**
 * Calls the AI endpoint to generate a product description.
 */
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

/**
 * Uploads an inventory CSV file.
 * Expects 'multipart/form-data'.
 */
export const uploadInventoryCSV = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<{
    message: string;
    products_added: number;
    products_updated: number;
    errors: string[];
    error_report_id?: string; // ID to download an error report if any
  }>("/bulk/inventory/upload-csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Uploads an orders CSV file.
 * Expects 'multipart/form-data'.
 */
export const uploadOrdersCSV = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<{
    message: string;
    orders_created: number;
    errors: string[];
    error_report_id?: string; // ID to download an error report if any
  }>("/bulk/orders/upload-csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// --- CSV EXPORT FUNCTIONS ---
// These endpoints return a file Blob.
export const exportInventoryCSV = () =>
  apiClient.get("/bulk/inventory/export-csv", { responseType: "blob" });
export const exportOrdersCSV = () =>
  apiClient.get("/bulk/orders/export-csv", { responseType: "blob" });

// --- CSV TEMPLATE DOWNLOAD FUNCTIONS ---
// These endpoints return a file Blob.
export const downloadInventoryTemplate = () =>
  apiClient.get("/bulk/inventory/template", { responseType: "blob" });
export const downloadOrderTemplate = () =>
  apiClient.get("/bulk/orders/template", { responseType: "blob" });

// --- ERROR FILE DOWNLOAD FUNCTIONS ---
// These endpoints return a file Blob using a specific report ID.
export const downloadInventoryErrorFile = (reportId: string) =>
  apiClient.get(`/bulk/inventory/download-errors/${reportId}`, {
    responseType: "blob",
  });
export const downloadOrderErrorFile = (reportId: string) =>
  apiClient.get(`/bulk/orders/download-errors/${reportId}`, {
    responseType: "blob",
  });
