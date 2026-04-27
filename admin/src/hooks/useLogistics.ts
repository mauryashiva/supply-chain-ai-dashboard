import { useState, useEffect, useMemo } from "react";
// 🛠️ Matches your centralized API
import { logisticsService } from "@/services/api";
// 🛠️ Matches your modular types
import type { Vehicle, VehicleStatus } from "@/types";

export type LogisticsPointProperties = {
  cluster: false;
  vehicleId: number;
  vehicle: Vehicle;
};

export const useLogistics = (
  statusFilter: VehicleStatus | "All",
  searchTerm: string,
) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    try {
      const response = await logisticsService.getVehicles();
      setVehicles(response.data);

      // Auto-select first vehicle on initial load if none selected
      if (response.data.length > 0 && !selectedVehicle && loading) {
        setSelectedVehicle(response.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates every 30 seconds
  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => statusFilter === "All" || v.status === statusFilter)
      .filter(
        (v) =>
          v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.driver_name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
  }, [vehicles, searchTerm, statusFilter]);

  // Convert vehicles to GeoJSON Points for use-supercluster
  const points = useMemo<
    {
      type: "Feature";
      properties: LogisticsPointProperties;
      geometry: {
        type: "Point";
        coordinates: [number, number];
      };
    }[]
  >(
    () =>
      filteredVehicles.map((v) => ({
        type: "Feature" as const,
        properties: { cluster: false, vehicleId: v.id, vehicle: v },
        geometry: {
          type: "Point" as const,
          coordinates: [v.longitude, v.latitude],
        },
      })),
    [filteredVehicles],
  );

  return {
    vehicles,
    filteredVehicles,
    selectedVehicle,
    setSelectedVehicle,
    points,
    loading,
  };
};
