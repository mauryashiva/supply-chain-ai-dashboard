import type { VehicleStatus } from "./common";

/**
 * Represents a single vehicle in the logistics fleet.
 */
export interface Vehicle {
  id: number;
  vehicle_number: string;
  driver_name: string;
  status: VehicleStatus;
  orders_count: number;
  live_temp: number;
  fuel_level: number;
  latitude: number;
  longitude: number;
}
