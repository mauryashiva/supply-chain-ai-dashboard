import React, { useEffect, useState, useRef } from "react";
import { getVehicles } from "@/services/api.ts";
import { Truck, Battery, Thermometer, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vehicle, VehicleStatus } from "@/types";

// Imports for react-map-gl v8
import Map, { Marker } from "react-map-gl";
import type { MapRef, ViewStateChangeEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // Don't forget to import the CSS

// --- Helper Components ---
const VehicleStatusBadge = ({ status }: { status: VehicleStatus }) => {
  const statusMap: Record<VehicleStatus, string> = {
    "On Route": "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Idle: "bg-zinc-700 text-zinc-300 border border-zinc-600/50",
    "In-Shop": "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  };
  return (
    <span
      className={cn(
        "px-2 py-1 text-xs font-medium rounded-full",
        statusMap[status]
      )}
    >
      {status}
    </span>
  );
};

// --- MAIN LOGISTICS PAGE COMPONENT ---
const LogisticsPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [viewState, setViewState] = useState({
    longitude: 73.8567, // Default location (Pune)
    latitude: 18.5204,
    zoom: 10,
  });

  const mapRef = useRef<MapRef>(null);

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await getVehicles();
        setVehicles(response.data);
        if (response.data.length > 0) {
          const firstVehicle = response.data[0];
          setSelectedVehicle(firstVehicle);
          // Set initial view to the first vehicle's location
          setViewState({
            longitude: firstVehicle.longitude,
            latitude: firstVehicle.latitude,
            zoom: 12,
          });
        }
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    // Animate map to the selected vehicle's location
    mapRef.current?.flyTo({
      center: [vehicle.longitude, vehicle.latitude],
      duration: 2000,
      zoom: 14,
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6">
      <div className="flex-1 bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
        {!MAPBOX_TOKEN ? (
          <div className="h-full flex items-center justify-center text-center text-zinc-500 p-4">
            <p>
              Map cannot be displayed. <br /> Please add your
              VITE_MAPBOX_ACCESS_TOKEN to the .env file.
            </p>
          </div>
        ) : (
          <Map
            ref={mapRef}
            {...viewState}
            onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={MAPBOX_TOKEN} // Correct prop for v8
          >
            {vehicles.map((vehicle) => (
              <Marker
                key={vehicle.id}
                longitude={vehicle.longitude}
                latitude={vehicle.latitude}
              >
                <div
                  className="cursor-pointer group"
                  onClick={() => handleVehicleSelect(vehicle)}
                >
                  <Truck
                    className={cn(
                      "h-8 w-8 transition-all duration-300 transform group-hover:scale-125",
                      selectedVehicle?.id === vehicle.id
                        ? "text-cyan-400"
                        : "text-zinc-900"
                    )}
                    stroke="white"
                    strokeWidth={0.5}
                    fill={
                      selectedVehicle?.id === vehicle.id ? "#22d3ee" : "#4b5563"
                    }
                  />
                </div>
              </Marker>
            ))}
          </Map>
        )}
      </div>

      <div className="w-full md:w-96 bg-zinc-900 rounded-lg shadow-lg p-6 flex flex-col">
        <h2 className="text-xl font-bold text-white mb-4">Vehicle Fleet</h2>
        <div className="flex-1 overflow-y-auto -mr-4 pr-4">
          {loading ? (
            <p className="text-zinc-400 text-center mt-8">
              Loading vehicles...
            </p>
          ) : vehicles.length === 0 ? (
            <p className="text-zinc-400 text-center mt-8">No vehicles found.</p>
          ) : (
            vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => handleVehicleSelect(vehicle)}
                className={cn(
                  "p-4 mb-3 rounded-lg cursor-pointer transition-all border",
                  selectedVehicle?.id === vehicle.id
                    ? "bg-cyan-600/10 border-cyan-500"
                    : "bg-zinc-800/50 border-transparent hover:bg-zinc-800"
                )}
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-white">
                    {vehicle.vehicle_number}
                  </p>
                  <VehicleStatusBadge status={vehicle.status} />
                </div>
                <p className="text-sm text-zinc-400">{vehicle.driver_name}</p>
              </div>
            ))
          )}
        </div>
        {selectedVehicle && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <h3 className="font-bold text-lg text-white mb-3">
              {selectedVehicle.vehicle_number} - Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Truck size={16} className="text-cyan-400" />{" "}
                <span className="text-zinc-300">
                  Driver: {selectedVehicle.driver_name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Box size={16} className="text-cyan-400" />{" "}
                <span className="text-zinc-300">
                  Orders: {selectedVehicle.orders_count}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Thermometer size={16} className="text-cyan-400" />{" "}
                <span className="text-zinc-300">
                  Live Temp: {selectedVehicle.live_temp}°C
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Battery size={16} className="text-cyan-400" />{" "}
                <span className="text-zinc-300">
                  Fuel: {selectedVehicle.fuel_level}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogisticsPage;
