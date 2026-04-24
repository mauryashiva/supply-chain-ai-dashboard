import { apiClient } from "./client";

export const authService = {
  login: (formData: FormData | URLSearchParams) =>
    apiClient.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }),

  signup: (data: { email: string; password: string }) =>
    apiClient.post("/auth/signup", data),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/auth";
  },
};
