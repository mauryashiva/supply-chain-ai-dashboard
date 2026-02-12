import axios from "axios";

// Step 1: Set the Base URL to the root API path
const API_URL = "http://127.0.0.1:8000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Step 2: Add an Interceptor to automatically attach the JWT Token
// This is essential for the "Amazon-grade" security we planned.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- CUSTOMER STOREFRONT CALLS ---
export const getStorefrontProducts = () => apiClient.get("/customer/products");
export const getProductDetails = (id: number) =>
  apiClient.get(`/customer/products/${id}`);

// --- AUTHENTICATION CALLS ---
export const signupUser = (userData: any) =>
  apiClient.post("/auth/signup", userData);

// Login uses Form Data as required by FastAPI OAuth2
export const loginUser = (credentials: FormData) =>
  apiClient.post("/auth/login", credentials, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

// --- ORDER CALLS ---
export const placeOrder = (orderData: any) =>
  apiClient.post("/customer/orders/place-order", orderData);

export const getMyOrders = () => apiClient.get("/customer/orders/my-orders");
