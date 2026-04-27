// src/components/MapControls.tsx

import React, { useState, useRef, useEffect } from "react";
import {
  Layers,
  Car,
  Building,
  Bus,
  Bike,
  Navigation,
  Flame,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const mapStyles = {
  Default: "mapbox://styles/mapbox/dark-v11",
  Satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  Terrain: "mapbox://styles/mapbox/outdoors-v12",
};
export type MapStyle = keyof typeof mapStyles;

interface MapControlsProps {
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
  showTraffic: boolean;
  onTrafficToggle: () => void;
  show3D: boolean;
  on3DToggle: () => void;
  showPublicTransport: boolean;
  onPublicTransportToggle: () => void;
  showBicycling: boolean;
  onBicyclingToggle: () => void;
  showStreetView: boolean;
  onStreetViewToggle: () => void;
  showWildfires: boolean;
  onWildfiresToggle: () => void;
  showAirQuality: boolean;
  onAirQualityToggle: () => void;
  className?: string;
}

function useOnClickOutside(
  ref: React.RefObject<HTMLDivElement | null>,
  handler: () => void,
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export const MapControls: React.FC<MapControlsProps> = ({
  currentStyle,
  onStyleChange,
  showTraffic,
  onTrafficToggle,
  show3D,
  on3DToggle,
  showPublicTransport,
  onPublicTransportToggle,
  showBicycling,
  onBicyclingToggle,
  showStreetView,
  onStreetViewToggle,
  showWildfires,
  onWildfiresToggle,
  showAirQuality,
  onAirQualityToggle,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(controlRef, () => setIsOpen(false));

  const mapDetails = [
    {
      id: "traffic",
      label: "Traffic",
      icon: Car,
      state: showTraffic,
      action: onTrafficToggle,
    },
    {
      id: "3d",
      label: "3D Buildings",
      icon: Building,
      state: show3D,
      action: on3DToggle,
    },
    {
      id: "public",
      label: "Public Transport",
      icon: Bus,
      state: showPublicTransport,
      action: onPublicTransportToggle,
    },
    {
      id: "bike",
      label: "Bicycling",
      icon: Bike,
      state: showBicycling,
      action: onBicyclingToggle,
    },
    {
      id: "street",
      label: "Street View",
      icon: Navigation,
      state: showStreetView,
      action: onStreetViewToggle,
    },
    {
      id: "wildfire",
      label: "Wildfires",
      icon: Flame,
      state: showWildfires,
      action: onWildfiresToggle,
    },
    {
      id: "air",
      label: "Air Quality",
      icon: Wind,
      state: showAirQuality,
      action: onAirQualityToggle,
    },
  ];

  return (
    <div
      ref={controlRef}
      className={cn("relative transition-colors duration-300", className)}
    >
      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md text-zinc-900 dark:text-white p-2.5 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700/50 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
        aria-label="Toggle map layers"
      >
        <Layers size={20} />
      </button>

      {/* Control Panel */}
      {isOpen && (
        <div className="absolute top-0 right-0 mt-14 w-64 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700/50 text-zinc-900 dark:text-white animate-in fade-in-0 zoom-in-95 duration-200 origin-top-right">
          {/* Map Type Section */}
          <div className="p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3 text-gray-500 dark:text-zinc-400 ml-1">
              Map Type
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(mapStyles) as MapStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => onStyleChange(style)}
                  className={cn(
                    "px-2 py-2 text-xs font-bold rounded-lg transition-all",
                    currentStyle === style
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                      : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700",
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Map Details Section */}
          <div className="border-t border-gray-100 dark:border-zinc-700/50 p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3 text-gray-500 dark:text-zinc-400 ml-1">
              Map Details
            </h4>
            <div className="space-y-1 max-h-65 overflow-y-auto pr-1 custom-scrollbar">
              {mapDetails.map((detail) => (
                <label
                  key={detail.id}
                  htmlFor={detail.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <detail.icon
                      size={18}
                      className="text-gray-400 dark:text-zinc-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
                      {detail.label}
                    </span>
                  </div>

                  {/* Premium Toggle Switch */}
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id={detail.id}
                      className="sr-only peer"
                      checked={detail.state}
                      onChange={detail.action}
                    />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600 shadow-inner"></div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
