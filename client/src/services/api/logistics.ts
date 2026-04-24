// logistics.ts
import { apiClient } from "./client";
import type { Vehicle } from "@/types";

export const logisticsService = {
  getVehicles: () => apiClient.get<Vehicle[]>("/logistics/vehicles"),
};
