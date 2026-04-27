import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Waves, TrendingUp, Activity, BarChart3 } from "lucide-react";

export const SeasonalDecompositionChart = ({
  decomposition,
  loading,
}: {
  decomposition: any;
  loading: boolean;
}) => {
  // Prepare data for seasonal decomposition
  const chartData = decomposition
    ? decomposition.trend.map((trend: number, index: number) => ({
        day: `Day ${index + 1}`,
        trend: trend,
        seasonal: decomposition.seasonal[index],
        residual: decomposition.residual[index],
      }))
    : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3
                className="text-blue-600 dark:text-blue-400"
                size={16}
              />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {label}
            </p>
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {entry.name}:
                </span>
                <span
                  className="font-semibold text-sm"
                  style={{ color: entry.color }}
                >
                  {entry.value?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Waves className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Seasonal Decomposition
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Trend, seasonal, and residual analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Activity size={16} />
          <span className="font-medium">Time Series Analysis</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-100 w-full mb-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Analyzing seasonal patterns...
            </span>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                className="dark:stroke-slate-700"
              />
              <XAxis
                dataKey="day"
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
              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                  fontWeight: "500",
                  paddingTop: "20px",
                }}
              />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#06b6d4"
                strokeWidth={3}
                name="Trend"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="seasonal"
                stroke="#10b981"
                strokeWidth={2}
                name="Seasonal"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="residual"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Residual"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Activity size={48} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Insufficient data for seasonal analysis
            </span>
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-xs">
              Need at least 14 days of historical data to perform seasonal
              decomposition
            </p>
          </div>
        )}
      </div>

      {/* Decomposition Explanation */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-linear-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-cyan-500 rounded-lg">
                <TrendingUp className="text-white" size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">
                  Trend
                </p>
                <p className="text-xs text-cyan-600 dark:text-cyan-400">
                  Long-term direction
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Overall demand direction over time
            </p>
          </div>
          <div className="p-4 bg-linear-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Waves className="text-white" size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                  Seasonal
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Weekly patterns
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Recurring patterns by day/week
            </p>
          </div>
          <div className="p-4 bg-linear-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <Activity className="text-white" size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">
                  Residual
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Random variation
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Unexplained noise in the data
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
