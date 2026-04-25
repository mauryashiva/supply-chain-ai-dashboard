import { apiClient } from "./client";
import type { DemandForecast, TodayProductForecast } from "@/types";

export const forecastService = {
  getDemandForecast: (productId?: number) =>
    apiClient.get<DemandForecast>("/forecast", {
      params: { product_id: productId },
    }),

  // getTopMovers: () => apiClient.get("/forecast/top-movers-tomorrow"),
  getTodayInference: () =>
    apiClient.get<TodayProductForecast[]>("/forecast/today-forecast"),
};
