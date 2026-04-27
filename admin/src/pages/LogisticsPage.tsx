import React, { useState, useRef } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import type { MapRef, ViewStateChangeEvent } from "react-map-gl";
import useSupercluster from "use-supercluster";
import { Truck } from "lucide-react";

// 🛠️ Hook & Utils
import { useLogistics } from "@/hooks/useLogistics";
import type { LogisticsPointProperties } from "@/hooks/useLogistics";
import { cn } from "@/lib/utils";
import type { Vehicle, VehicleStatus } from "@/types";

// Components
import GeocoderControl from "@/components/Logistics/GeocoderControl";
import { MapControls, mapStyles } from "@/components/Logistics/MapControls";
import { LogisticsSidebar } from "@/components/Logistics/LogisticsSidebar";
import type { MapStyle } from "@/components/Logistics/MapControls";

// Styles
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

type ClusterPointProperties = {
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: number | string;
};

const isClusterProperties = (
  properties: LogisticsPointProperties | ClusterPointProperties,
): properties is ClusterPointProperties => properties.cluster === true;

const LogisticsPage: React.FC = () => {
  const mapRef = useRef<MapRef>(null);
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

  // --- 1. UI STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "All">(
    "All",
  );
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>("Default");

  // Layer Toggles
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

  // --- 2. DATA HOOK ---
  const bounds = mapRef.current
    ? (mapRef.current.getMap().getBounds().toArray().flat() as [
        number,
        number,
        number,
        number,
      ])
    : undefined;

  const {
    vehicles,
    filteredVehicles,
    selectedVehicle,
    setSelectedVehicle,
    points,
  } = useLogistics(statusFilter, searchTerm);

  // --- 3. CLUSTERING ---
  const { clusters, supercluster } = useSupercluster<LogisticsPointProperties>({
    points,
    bounds,
    zoom: viewState.zoom,
    options: { radius: 75, maxZoom: 20 },
  });

  // --- 4. HANDLERS ---
  const handleVehicleSelect = (v: Vehicle) => {
    setSelectedVehicle(v);
    mapRef.current?.flyTo({
      center: [v.longitude, v.latitude],
      duration: 1500,
      zoom: 14,
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-3 bg-[#F1F5F9] dark:bg-zinc-950 p-3 transition-colors duration-300">
      {/* MAP SECTION */}
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm overflow-hidden relative border border-white dark:border-zinc-800">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
          mapStyle={mapStyles[currentMapStyle]}
          mapboxAccessToken={MAPBOX_TOKEN}
          antialias={true}
        >
          {/* TRAFFIC LAYER */}
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

          {/* 3D BUILDINGS */}
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

          {/* CLUSTERS & VEHICLE MARKERS */}
          {clusters.map((cluster) => {
            const [lon, lat] = cluster.geometry.coordinates;
            const properties = cluster.properties as
              | LogisticsPointProperties
              | ClusterPointProperties;

            if (isClusterProperties(properties)) {
              return (
                <Marker
                  key={`cluster-${cluster.id}`}
                  latitude={lat}
                  longitude={lon}
                >
                  <div
                    className="w-9 h-9 bg-blue-600 dark:bg-cyan-600 border-2 border-white dark:border-zinc-900 rounded-full flex items-center justify-center text-white font-black text-xs shadow-xl cursor-pointer"
                    onClick={() => {
                      if (!supercluster) return;

                      const expansionZoom = Math.min(
                        supercluster.getClusterExpansionZoom(
                          cluster.id as number,
                        ),
                        20,
                      );
                      mapRef.current?.flyTo({
                        center: [lon, lat],
                        zoom: expansionZoom,
                      });
                    }}
                  >
                    {properties.point_count}
                  </div>
                </Marker>
              );
            }

            const v = properties.vehicle;
            const isActive = selectedVehicle?.id === v.id;
            return (
              <Marker key={`vehicle-${v.id}`} longitude={lon} latitude={lat}>
                <div
                  className="cursor-pointer relative group"
                  onClick={() => handleVehicleSelect(v)}
                >
                  {isActive && (
                    <div className="absolute -inset-2 bg-blue-500/20 dark:bg-cyan-500/20 rounded-full animate-ping" />
                  )}
                  <div
                    className={cn(
                      "p-1.5 rounded-full transition-all border shadow-lg",
                      isActive
                        ? "bg-blue-600 dark:bg-cyan-600 border-white dark:border-zinc-900 scale-110"
                        : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700",
                    )}
                  >
                    <Truck
                      size={16}
                      className={
                        isActive
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
