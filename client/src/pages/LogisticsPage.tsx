import React, { useEffect, useState, useRef, useMemo } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import type { MapRef, ViewStateChangeEvent } from "react-map-gl";
import useSupercluster from "use-supercluster";
import { Truck } from "lucide-react";

// 🛠️ Fixed: Updated to use centralized logisticsService
import { logisticsService } from "@/services/api";
import { cn } from "@/lib/utils";
// 🛠️ Fixed: Updated type imports to be type-only for standard compliance
import type { Vehicle, VehicleStatus } from "@/types";

// Components
import GeocoderControl from "@/components/Logistics/GeocoderControl";
import { MapControls, mapStyles } from "@/components/Logistics/MapControls";
import { LogisticsSidebar } from "@/components/Logistics/LogisticsSidebar";
import type { MapStyle } from "@/components/Logistics/MapControls";

// Styles
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const LogisticsPage: React.FC = () => {
  // --- 1. STATE MANAGEMENT ---
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "All">(
    "All",
  );

  // Toggle States linked to MapControls
  const [showTraffic, setShowTraffic] = useState(false);
  const [show3D, setShow3D] = useState(true);
  const [showPublicTransport, setShowPublicTransport] = useState(false);
  const [showBicycling, setShowBicycling] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [showWildfires, setShowWildfires] = useState(false);
  const [showAirQuality, setShowAirQuality] = useState(false);

  const [viewState, setViewState] = useState({
    longitude: 73.8567,
    latitude: 18.5204,
    zoom: 11,
    pitch: 45,
    bearing: 0,
  });

  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>("Default");
  const mapRef = useRef<MapRef>(null);
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

  // --- 2. DATA FETCHING ---
  const fetchVehicles = async () => {
    try {
      // 🛠️ Fixed: Changed getVehicles() to logisticsService.getVehicles()
      const response = await logisticsService.getVehicles();
      setVehicles(response.data);

      // Select the first vehicle if none is selected yet
      if (response.data.length > 0 && !selectedVehicle) {
        setSelectedVehicle(response.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // --- 3. INTERACTION LOGIC ---
  const handleVehicleSelect = (v: Vehicle) => {
    setSelectedVehicle(v);
    mapRef.current?.flyTo({
      center: [v.longitude, v.latitude],
      duration: 1500,
      zoom: 14,
    });
  };

  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => statusFilter === "All" || v.status === statusFilter)
      .filter(
        (v) =>
          v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.driver_name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
  }, [vehicles, searchTerm, statusFilter]);

  // Clustering logic for Mapbox
  const points = useMemo(
    () =>
      filteredVehicles.map((v) => ({
        type: "Feature",
        properties: { cluster: false, vehicleId: v.id, vehicle: v },
        geometry: { type: "Point", coordinates: [v.longitude, v.latitude] },
      })),
    [filteredVehicles],
  );

  const bounds = mapRef.current
    ? (mapRef.current.getMap().getBounds().toArray().flat() as [
        number,
        number,
        number,
        number,
      ])
    : undefined;

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options: { radius: 75, maxZoom: 20 },
  });

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-3 bg-[#F1F5F9] dark:bg-zinc-950 p-3 font-sans transition-colors duration-300">
      {/* MAP SECTION */}
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[24px] shadow-sm overflow-hidden relative border border-white dark:border-zinc-800">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
          mapStyle={mapStyles[currentMapStyle]}
          mapboxAccessToken={MAPBOX_TOKEN}
          antialias={true}
        >
          {/* --- LAYER: TRAFFIC --- */}
          {showTraffic && (
            <Source
              id="mapbox-traffic"
              type="vector"
              url="mapbox://mapbox.mapbox-traffic-v1"
            >
              <Layer
                id="traffic-layer"
                type="line"
                source-layer="traffic"
                paint={{
                  "line-width": 2,
                  "line-color": [
                    "match",
                    ["get", "congestion"],
                    "low",
                    "#22c55e",
                    "moderate",
                    "#eab308",
                    "heavy",
                    "#f97316",
                    "severe",
                    "#ef4444",
                    "#cbd5e1",
                  ],
                }}
              />
            </Source>
          )}

          {/* --- LAYER: 3D BUILDINGS --- */}
          {show3D && (
            <Layer
              id="3d-buildings"
              source="composite"
              source-layer="building"
              filter={["==", "extrude", "true"]}
              type="fill-extrusion"
              minzoom={15}
              paint={{
                "fill-extrusion-color": "#aaa",
                "fill-extrusion-height": ["get", "height"],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.6,
              }}
            />
          )}

          {/* MAP OVERLAYS */}
          <div className="absolute top-4 left-4 z-10 w-64 scale-90 origin-top-left">
            <GeocoderControl
              mapboxAccessToken={MAPBOX_TOKEN}
              position="top-left"
            />
          </div>

          <div className="absolute top-4 right-4 z-10 scale-90 origin-top-right">
            <MapControls
              currentStyle={currentMapStyle}
              onStyleChange={setCurrentMapStyle}
              showTraffic={showTraffic}
              onTrafficToggle={() => setShowTraffic(!showTraffic)}
              show3D={show3D}
              on3DToggle={() => setShow3D(!show3D)}
              showPublicTransport={showPublicTransport}
              onPublicTransportToggle={() =>
                setShowPublicTransport(!showPublicTransport)
              }
              showBicycling={showBicycling}
              onBicyclingToggle={() => setShowBicycling(!showBicycling)}
              showStreetView={showStreetView}
              onStreetViewToggle={() => setShowStreetView(!showStreetView)}
              showWildfires={showWildfires}
              onWildfiresToggle={() => setShowWildfires(!showWildfires)}
              showAirQuality={showAirQuality}
              onAirQualityToggle={() => setShowAirQuality(!showAirQuality)}
            />
          </div>

          {/* CLUSTERS & MARKERS */}
          {clusters.map((cluster) => {
            const [lon, lat] = cluster.geometry.coordinates;
            const { cluster: isCluster, point_count: count } =
              cluster.properties;

            if (isCluster) {
              return (
                <Marker key={`c-${cluster.id}`} latitude={lat} longitude={lon}>
                  <div
                    className="w-9 h-9 bg-blue-600 dark:bg-cyan-600 border-2 border-white dark:border-zinc-900 rounded-full flex items-center justify-center text-white font-black text-xs shadow-xl cursor-pointer"
                    onClick={() => {
                      const z = Math.min(
                        supercluster.getClusterExpansionZoom(
                          cluster.id as number,
                        ),
                        20,
                      );
                      mapRef.current?.flyTo({ center: [lon, lat], zoom: z });
                    }}
                  >
                    {count}
                  </div>
                </Marker>
              );
            }

            const v = cluster.properties.vehicle as Vehicle;
            const active = selectedVehicle?.id === v.id;
            return (
              <Marker key={`v-${v.id}`} longitude={lon} latitude={lat}>
                <div
                  className="cursor-pointer relative group"
                  onClick={() => handleVehicleSelect(v)}
                >
                  {active && (
                    <div className="absolute -inset-2 bg-blue-500/20 dark:bg-cyan-500/20 rounded-full animate-ping" />
                  )}
                  <div
                    className={cn(
                      "p-1.5 rounded-full transition-all border shadow-lg",
                      active
                        ? "bg-blue-600 dark:bg-cyan-600 border-white dark:border-zinc-900 scale-110"
                        : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700",
                    )}
                  >
                    <Truck
                      size={16}
                      className={
                        active
                          ? "text-white"
                          : "text-blue-600 dark:text-cyan-400"
                      }
                      strokeWidth={2.5}
                    />
                  </div>
                </div>
              </Marker>
            );
          })}
        </Map>
      </div>

      {/* SIDEBAR */}
      <LogisticsSidebar
        vehicles={vehicles}
        filteredVehicles={filteredVehicles}
        selectedVehicle={selectedVehicle}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onVehicleSelect={handleVehicleSelect}
        onClearSelection={() => setSelectedVehicle(null)}
      />
    </div>
  );
};

export default LogisticsPage;
