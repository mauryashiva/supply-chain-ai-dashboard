import { apiClient } from "./client";

export const authService = {
  signup: (data: any) => apiClient.post("/auth/signup", data),

  login: (formData: FormData) =>
    apiClient.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};
