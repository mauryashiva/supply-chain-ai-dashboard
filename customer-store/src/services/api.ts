import axios from "axios";

/*
  BASE URL
  Local  -> http://127.0.0.1:8000
  Prod   -> https://your-render-backend.onrender.com
*/
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
  Attach JWT automatically
*/
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/*
  GLOBAL RESPONSE HANDLER
  → Auto logout on 401 (token expired)
*/
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth";
    }
    return Promise.reject(err);
  },
);

/* ================================
   AUTH APIs
================================ */

export const signupUser = (data: { email: string; password: string }) =>
  apiClient.post("/auth/signup", data);

export const loginUser = (formData: FormData) =>
  apiClient.post("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/* ================================
   PRODUCT APIs
================================ */

export const getStorefrontProducts = () => apiClient.get("/customer/products");

export const getProductDetails = (id: number) =>
  apiClient.get(`/customer/products/${id}`);

/* ================================
   ORDER APIs
================================ */

export const placeOrder = (data: any) =>
  apiClient.post("/customer/orders/place-order", data);

export const getMyOrders = () => apiClient.get("/customer/orders/my-orders");

/* ================================
   ADDRESS APIs
================================ */

export const getMyAddresses = () =>
  apiClient.get("/customer/address/my-addresses");

export const createAddress = (data: any) =>
  apiClient.post("/customer/address/add", data);

export const updateAddress = (id: number, data: any) =>
  apiClient.put(`/customer/address/update/${id}`, data);

export const deleteAddress = (id: number) =>
  apiClient.delete(`/customer/address/delete/${id}`);
