// src/services/api/analytics.ts
import { apiClient } from "./client";
import type {
  AnalyticsSummary,
  LowStockProduct,
  RevenueDataPoint,
} from "@/types";

export const analyticsService = {
  getSummary: () => apiClient.get<AnalyticsSummary>("/analytics/summary"),

  getLowStock: () =>
    apiClient.get<{ data: LowStockProduct[] }>("/analytics/low-stock-products"),

  getRevenue: (days = 30) =>
    apiClient.get<{ data: RevenueDataPoint[] }>(
      "/analytics/revenue-over-time",
      { params: { days } },
    ),

  // 🛠️ Added this missing method
  getMonthlyRevenue: (months = 6) =>
    apiClient.get<{ data: { month: string; revenue: number }[] }>(
      "/analytics/monthly-revenue",
      {
        params: { months },
      },
    ),

  exportMonthly: () =>
    apiClient.get("/analytics/export-monthly-csv", { responseType: "blob" }),

  exportYearly: () =>
    apiClient.get("/analytics/export-yearly-csv", { responseType: "blob" }),
};
