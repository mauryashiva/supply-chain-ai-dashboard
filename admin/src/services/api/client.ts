import axios from "axios";

// 1. Base Configuration
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

/**
 * REQUEST INTERCEPTOR
 * 1. Attaches the Bearer Token automatically.
 * 2. Dynamically rewrites URLs to point to the 'admin' domain for dashboard calls.
 */
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // Attach Authorization Header
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // --- 🚀 AUTOMATIC DOMAIN ROUTING ---
  // If the URL doesn't start with 'auth' or 'customer', we assume it's an admin request.
  // This maps '/inventory' -> '/admin/inventory' automatically.
  if (config.url) {
    const url = config.url.startsWith("/") ? config.url.slice(1) : config.url;

    const isAuth = url.startsWith("auth");
    const isCustomer = url.startsWith("customer");
    const alreadyHasAdmin = url.startsWith("admin");

    if (!isAuth && !isCustomer && !alreadyHasAdmin) {
      config.url = `admin/${url}`;
    }
  }

  return config;
});

/**
 * RESPONSE INTERCEPTOR
 * 1. Handles automatic 1-time retry on failure.
 * 2. Handles 401 Unauthorized by clearing local state and redirecting.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Retry logic (1 attempt after 1.5s delay)
    if (config && !config._retry) {
      config._retry = true;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return apiClient(config);
    }

    // Auth Failure Handling
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login if not already there
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }

    return Promise.reject(error);
  },
);
