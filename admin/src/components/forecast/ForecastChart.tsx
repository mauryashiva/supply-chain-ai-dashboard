import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Loader } from "lucide-react";

export const ForecastChart = ({
  data,
  loading,
}: {
  data: any[];
  loading: boolean;
}) => (
  <div className="relative overflow-hidden rounded-[2.5rem] p-8 shadow-xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-br from-white via-slate-50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    {/* Soft Glow Background */}
    <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />

    {/* Header */}
    <div className="flex items-center justify-between mb-8 relative z-10 flex-wrap gap-4">
      <h3 className="font-bold uppercase tracking-tight italic flex items-center gap-2 text-lg md:text-xl text-zinc-800 dark:text-zinc-100">
        <TrendingUp size={20} className="text-cyan-500" />
        Predictive Timeline
      </h3>

      <div className="hidden sm:flex gap-6 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="inline-block w-4 h-1.5 rounded bg-cyan-500" />
          Forecast
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded border border-cyan-400 bg-cyan-400/10" />
          Uncertainty Range
        </span>
      </div>
    </div>

    {/* Chart */}
    <div className="h-95 md:h-105 w-full relative z-10">
      {loading ? (
        <div className="h-full flex flex-col items-center justify-center gap-4">
          <Loader className="animate-spin text-cyan-500" size={42} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-500/60">
            Computing Forecast...
          </span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            {/* Gradient */}
            <defs>
              <linearGradient id="mainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Grid */}
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              strokeOpacity={0.1}
            />

            {/* Axis */}
            <XAxis
              dataKey="displayDate"
              fontSize={11}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a" }}
            />
            <YAxis
              fontSize={11}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a" }}
            />

            {/* Tooltip */}
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(24,24,27,0.95)",
                backdropFilter: "blur(8px)",
              }}
              labelStyle={{
                color: "#22d3ee",
                fontWeight: "600",
                marginBottom: "6px",
              }}
              itemStyle={{
                fontSize: "12px",
              }}
            />

            {/* Uncertainty */}
            <Area
              type="monotone"
              dataKey="confidence_upper"
              stroke="none"
              fill="#06b6d4"
              fillOpacity={0.08}
            />
            <Area
              type="monotone"
              dataKey="confidence_lower"
              stroke="none"
              fill="#06b6d4"
              fillOpacity={0.08}
            />

            {/* Main Forecast Line */}
            <Area
              type="monotone"
              dataKey="demand_estimate"
              stroke="#06b6d4"
              strokeWidth={3}
              fill="url(#mainGradient)"
              dot={false}
              activeDot={{ r: 5 }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);
