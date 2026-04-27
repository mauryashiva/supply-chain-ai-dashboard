import React, { memo } from "react";
import {
  Search,
  X,
  GaugeCircle,
  MapPin,
  Box,
  Thermometer,
  Battery,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vehicle, VehicleStatus } from "@/types";

interface LogisticsSidebarProps {
  vehicles: Vehicle[];
  filteredVehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: VehicleStatus | "All";
  setStatusFilter: (status: VehicleStatus | "All") => void;
  onVehicleSelect: (v: Vehicle) => void;
  onClearSelection: () => void;
}

// --- Internal Sub-components ---

const CompactStatusIndicator = memo(
  ({ status, isSelected }: { status: VehicleStatus; isSelected: boolean }) => {
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
        <span
          className={cn(
            "text-[9px] font-black uppercase tracking-tighter transition-colors",
            isSelected ? "text-blue-100" : "text-slate-500 dark:text-zinc-400",
          )}
        >
          {status}
        </span>
      </div>
    );
  },
);

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
    <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700/50 p-2 rounded-xl transition-colors">
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className="text-blue-600 dark:text-cyan-400 scale-75 origin-left">
          {icon}
        </div>
        <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-tighter leading-none">
          {label}
        </p>
      </div>
      {value && (
        <p className="font-black text-slate-900 dark:text-white text-xs leading-none">
          {value}
        </p>
      )}
      {children}
    </div>
  ),
);

export const LogisticsSidebar: React.FC<LogisticsSidebarProps> = ({
  filteredVehicles,
  selectedVehicle,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onVehicleSelect,
  onClearSelection,
}) => {
  return (
    <aside className="w-full md:w-85 flex flex-col gap-3 h-full">
      {/* 1. Fleet Monitor Header & Search */}
      <div className="bg-white dark:bg-zinc-900 rounded-[20px] p-4 shadow-sm border border-white dark:border-zinc-800 transition-colors">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Fleet Monitor
          </h2>
          <div className="bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
            {filteredVehicles.length} Vehicles
          </div>
        </div>

        <div className="relative mb-3">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
            size={14}
          />
          <input
            type="text"
            placeholder="Search ID/Driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
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
                  ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-zinc-900 shadow-md"
                  : "bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Scrollable Vehicle List */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 rounded-[20px] border border-white dark:border-zinc-800 shadow-sm p-2 no-scrollbar transition-colors">
        <div className="space-y-1">
          {filteredVehicles.length === 0 ? (
            <div className="py-10 text-center opacity-30 flex flex-col items-center dark:text-zinc-500">
              <GaugeCircle size={32} />
              <p className="text-[10px] font-black mt-2 uppercase">No Match</p>
            </div>
          ) : (
            filteredVehicles.map((v) => {
              const isSelected = selectedVehicle?.id === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => onVehicleSelect(v)}
                  className={cn(
                    "px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center justify-between border",
                    isSelected
                      ? "bg-blue-600 dark:bg-cyan-600 border-blue-500 dark:border-cyan-500 shadow-lg -translate-y-0.5"
                      : "hover:bg-slate-50 dark:hover:bg-zinc-800 border-transparent",
                  )}
                >
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "font-black text-xs leading-none mb-1 truncate",
                        isSelected
                          ? "text-white"
                          : "text-slate-900 dark:text-zinc-200",
                      )}
                    >
                      {v.vehicle_number}
                    </p>
                    <p
                      className={cn(
                        "text-[9px] font-bold leading-none truncate",
                        isSelected
                          ? "text-blue-100 dark:text-cyan-100"
                          : "text-slate-400 dark:text-zinc-500",
                      )}
                    >
                      {v.driver_name}
                    </p>
                  </div>
                  <CompactStatusIndicator
                    status={v.status}
                    isSelected={isSelected}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Live Telemetry Panel */}
      {selectedVehicle && (
        <div className="bg-white dark:bg-zinc-900 rounded-[20px] p-4 shadow-xl border border-white dark:border-zinc-800 animate-in slide-in-from-bottom-2 duration-300 transition-colors">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-50 dark:bg-cyan-500/10 rounded-lg flex items-center justify-center text-blue-600 dark:text-cyan-400">
                <MapPin size={14} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-[11px] leading-none">
                  Telemetry
                </h3>
                <p className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                  Live Sync
                </p>
              </div>
            </div>
            <button
              onClick={onClearSelection}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full text-slate-400 dark:text-zinc-500 transition-colors"
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
                <div className="flex-1 bg-slate-200 dark:bg-zinc-700 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-cyan-500 h-full transition-all"
                    style={{ width: `${selectedVehicle.fuel_level}%` }}
                  />
                </div>
                <span className="text-[8px] font-black text-slate-900 dark:text-zinc-200">
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
  );
};
