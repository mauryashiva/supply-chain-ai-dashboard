import axios from "axios";

// Backend ka base URL
const API_URL = "http://127.0.0.1:8000/api/customer";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getStorefrontProducts = () => apiClient.get("/products");
export const getProductDetails = (id: number) =>
  apiClient.get(`/products/${id}`);
