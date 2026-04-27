import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Package, AlertTriangle, Clock } from "lucide-react";
// 🛠️ Fixed: Ensure type-only import and that TodayProductForecast is exported in @/types/index.ts
import type { TodayProductForecast } from "@/types";

export const TodayForecastChart = ({
  data,
  loading,
}: {
  data: TodayProductForecast[];
  loading: boolean;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "#ef4444";
      case "low":
        return "#f59e0b";
      default:
        return "#10b981";
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const forecastData = payload[0].payload as TodayProductForecast;
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="text-blue-600 dark:text-blue-400" size={16} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                {forecastData.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                SKU: {forecastData.sku}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Predicted Demand:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {forecastData.predicted_demand} units
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Current Stock:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {forecastData.current_stock} units
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Days of Stock:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {forecastData.days_of_stock} days
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Confidence:
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {(forecastData.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Prepare data for chart (top 10 products)
  const chartData = data.slice(0, 10).map((item) => ({
    ...item,
    displayName:
      item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
  }));

  const criticalCount = data.filter(
    (item) => item.stock_status === "critical",
  ).length;
  const lowCount = data.filter((item) => item.stock_status === "low").length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Package className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Today's Demand Forecast
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Real-time product demand predictions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Clock size={16} />
          <span className="font-medium">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-100 w-full mb-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Analyzing demand patterns...
            </span>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                className="dark:stroke-slate-700"
              />
              <XAxis
                dataKey="displayName"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={11}
                fontWeight="500"
                stroke="#64748b"
                className="dark:stroke-slate-400"
              />
              <YAxis
                fontSize={11}
                stroke="#64748b"
                className="dark:stroke-slate-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="predicted_demand" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getStatusColor(entry.stock_status)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Package size={48} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No forecast data available
            </span>
          </div>
        )}
      </div>

      {/* Status Summary */}
      {!loading && chartData.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                Sufficient
              </p>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                {
                  data.filter((item) => item.stock_status === "sufficient")
                    .length
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 uppercase tracking-wide">
                Low Stock
              </p>
              <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                {lowCount}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20 transition-colors">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div>
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                Critical
              </p>
              <p className="text-sm font-bold text-red-800 dark:text-red-300">
                {criticalCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Critical Items Alert */}
      {criticalCount > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle
                className="text-red-600 dark:text-red-400"
                size={16}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                {criticalCount} product{criticalCount > 1 ? "s" : ""} need
                {criticalCount === 1 ? "s" : ""} immediate attention
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Consider restocking or adjusting forecasts
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
