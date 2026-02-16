import React, { useEffect, useState, useRef, useMemo, memo } from "react";
import { getVehicles } from "@/services/api.ts";
import {
  Truck,
  Battery,
  Thermometer,
  Box,
  Search,
  X,
  GaugeCircle,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vehicle, VehicleStatus } from "@/types";

// --- Mapbox GL JS and React Map GL Imports ---
import Map, { Marker } from "react-map-gl";
import type { MapRef, ViewStateChangeEvent } from "react-map-gl";
import useSupercluster from "use-supercluster";
import GeocoderControl from "@/components/Logistics/GeocoderControl";
import { MapControls, mapStyles } from "@/components/Logistics/MapControls";
import type { MapStyle } from "@/components/MapControls";

// --- CSS Imports ---
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

// --- Sub-components (Compact White Premium Styling) ---

const CompactStatusIndicator = memo(({ status }: { status: VehicleStatus }) => {
  const colors: Record<VehicleStatus, string> = {
    "On Route": "bg-emerald-500",
    Idle: "bg-amber-500",
    "In-Shop": "bg-rose-500",
  };
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          colors[status],
          status === "On Route" && "animate-pulse",
        )}
      />
      <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500">
        {status}
      </span>
    </div>
  );
});

const CompactTelemetryItem = memo(
  ({
    icon,
    label,
    value,
    children,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string | number;
    children?: React.ReactNode;
  }) => (
    <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className="text-blue-600 scale-75 origin-left">{icon}</div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">
          {label}
        </p>
      </div>
      {value && (
        <p className="font-black text-slate-900 text-xs leading-none">
          {value}
        </p>
      )}
      {children}
    </div>
  ),
);

const LogisticsPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  // loading removed as it was unused
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "All">(
    "All",
  );

  // States for MapControls to fix Error 2740
  const [showTraffic, setShowTraffic] = useState(false);
  const [show3D, setShow3D] = useState(false);
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

  const fetchVehicles = async () => {
    try {
      const response = await getVehicles();
      setVehicles(response.data);
      if (response.data.length > 0 && !selectedVehicle) {
        setSelectedVehicle(response.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 30000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-3 bg-[#F1F5F9] p-3 font-sans">
      {/* --- Map Section --- */}
      <div className="flex-1 bg-white rounded-[24px] shadow-sm overflow-hidden relative border border-white">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
          mapStyle={mapStyles[currentMapStyle]}
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          {/* Floating Controls */}
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
              className="bg-white/90 backdrop-blur-md rounded-xl border border-white p-1 shadow-lg"
            />
          </div>

          {clusters.map((cluster) => {
            const [lon, lat] = cluster.geometry.coordinates;
            const { cluster: isCluster, point_count: count } =
              cluster.properties;

            if (isCluster) {
              return (
                <Marker key={`c-${cluster.id}`} latitude={lat} longitude={lon}>
                  <div
                    className="w-9 h-9 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white font-black text-xs shadow-xl cursor-pointer"
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
                    <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping" />
                  )}
                  <div
                    className={cn(
                      "p-1.5 rounded-full transition-all border shadow-lg",
                      active
                        ? "bg-blue-600 border-white scale-110"
                        : "bg-white border-slate-200 hover:scale-105",
                    )}
                  >
                    <Truck
                      size={16}
                      className={active ? "text-white" : "text-blue-600"}
                      strokeWidth={2.5}
                    />
                  </div>
                </div>
              </Marker>
            );
          })}
        </Map>
      </div>

      {/* --- Sidebar Section (Vertical Stack) --- */}
      <aside className="w-full md:w-[340px] flex flex-col gap-3">
        {/* 1. Fleet Monitor Search */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm border border-white">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
              Fleet Monitor
            </h2>
            <div className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
              {filteredVehicles.length} Vehicles
            </div>
          </div>

          <div className="relative mb-3">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search ID/Driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white transition-all"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {["All", "On Route", "Idle", "In-Shop"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as any)}
                className={cn(
                  "px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all border whitespace-nowrap",
                  statusFilter === s
                    ? "bg-slate-900 border-slate-900 text-white shadow-md"
                    : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Scrollable Vehicle List */}
        <div className="flex-1 overflow-y-auto bg-white rounded-[20px] border border-white shadow-sm p-2 no-scrollbar">
          <div className="space-y-1">
            {filteredVehicles.length === 0 ? (
              <div className="py-10 text-center opacity-30 flex flex-col items-center">
                <GaugeCircle size={32} />
                <p className="text-[10px] font-black mt-2 uppercase">
                  No Match
                </p>
              </div>
            ) : (
              filteredVehicles.map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleVehicleSelect(v)}
                  className={cn(
                    "px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center justify-between border",
                    selectedVehicle?.id === v.id
                      ? "bg-blue-600 border-blue-500 shadow-lg -translate-y-0.5"
                      : "hover:bg-slate-50 border-transparent",
                  )}
                >
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "font-black text-xs leading-none mb-1 truncate",
                        selectedVehicle?.id === v.id
                          ? "text-white"
                          : "text-slate-900",
                      )}
                    >
                      {v.vehicle_number}
                    </p>
                    <p
                      className={cn(
                        "text-[9px] font-bold leading-none truncate",
                        selectedVehicle?.id === v.id
                          ? "text-blue-100"
                          : "text-slate-400",
                      )}
                    >
                      {v.driver_name}
                    </p>
                  </div>
                  <CompactStatusIndicator status={v.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Live Telemetry */}
        {selectedVehicle && (
          <div className="bg-white rounded-[20px] p-4 shadow-xl border border-white animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <MapPin size={14} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-[11px] leading-none">
                    Telemetry
                  </h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Live Sync
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <CompactTelemetryItem
                icon={<Box size={14} />}
                label="Payload"
                value={`${selectedVehicle.orders_count} Jobs`}
              />
              <CompactTelemetryItem
                icon={<Thermometer size={14} />}
                label="Temp"
                value={`${selectedVehicle.live_temp}°C`}
              />
              <CompactTelemetryItem
                icon={<Battery size={14} />}
                label="Fuel Supply"
              >
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 bg-slate-200 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full"
                      style={{ width: `${selectedVehicle.fuel_level}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-black text-slate-900">
                    {selectedVehicle.fuel_level}%
                  </span>
                </div>
              </CompactTelemetryItem>
              <CompactTelemetryItem
                icon={<Truck size={14} />}
                label="Driver"
                value={selectedVehicle.driver_name.split(" ")[0]}
              />
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default LogisticsPage;
