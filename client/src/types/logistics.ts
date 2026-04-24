import { VehicleStatus } from "./common";

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

export interface AppSetting {
  setting_key: string;
  setting_value: string;
}

export interface AppSettingsUpdate {
  settings: AppSetting[];
}
