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
import { Brain, TrendingUp, Zap, Target } from "lucide-react";

export const ModelComparisonChart = ({
  data,
  loading,
}: {
  data: any[];
  loading: boolean;
}) => {
  const comparisonData = data.map((item) => ({
    date: item.displayDate,
    ensemble: item.demand_estimate,
    linear: item.linear_forecast || item.demand_estimate,
    arima: item.arima_forecast || item.demand_estimate,
    upper: item.confidence_upper,
    lower: item.confidence_lower,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-2xl">
          <p className="text-sm font-semibold mb-3 text-slate-800 dark:text-white">
            {label}
          </p>

          <div className="space-y-2">
            {payload.map((entry: any) => (
              <div
                key={entry.dataKey}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-300">
                    {entry.name}
                  </span>
                </div>
                <span className="font-semibold" style={{ color: entry.color }}>
                  {entry.value?.toFixed(1)}
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-lg overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-linear-to-brrom-purple-500 to-pink-600 rounded-xl shadow-lg shrink-0">
            <Brain className="text-white" size={22} />
          </div>

          <div className="min-w-0">
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white truncate">
              Model Performance Comparison
            </h3>
            <p className="text-xs md:text-sm text-slate-500 truncate">
              Ensemble vs individual forecasting models
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 shrink-0">
          <Target size={16} />
          <span>Accuracy Analysis</span>
        </div>
      </div>

      {/* ----------- IMPROVED GRAPH ----------- */}
      <div className="h-87.5 md:h-100 w-full mb-6 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-sm text-slate-500">
              Analyzing model performance...
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={comparisonData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              {/* GRID */}
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />

              {/* AXIS */}
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                  paddingTop: "10px",
                }}
              />

              {/* MAIN LINE (ENSEMBLE - HIGHLIGHTED) */}
              <Line
                type="monotone"
                dataKey="ensemble"
                stroke="#7c3aed"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                name="Ensemble Forecast"
              />

              {/* SECONDARY */}
              <Line
                type="monotone"
                dataKey="linear"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Linear Regression"
              />

              <Line
                type="monotone"
                dataKey="arima"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="10 5"
                dot={false}
                name="ARIMA Model"
              />

              {/* CONFIDENCE */}
              <Line
                type="monotone"
                dataKey="upper"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                name="Confidence Upper"
              />

              <Line
                type="monotone"
                dataKey="lower"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                name="Confidence Lower"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* CARDS */}
      {!loading && comparisonData.length > 0 && (
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          <div className="p-4 rounded-xl border bg-linear-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
            <div className="flex gap-3 mb-2">
              <Zap className="shrink-0 text-purple-600" size={16} />
              <div>
                <p className="font-semibold text-sm text-purple-700">
                  Ensemble
                </p>
                <p className="text-xs text-purple-500">
                  Best overall performance
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Combines multiple models for superior accuracy and reliability
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-linear-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
            <div className="flex gap-3 mb-2">
              <TrendingUp className="shrink-0 text-emerald-600" size={16} />
              <div>
                <p className="font-semibold text-sm text-emerald-700">Linear</p>
                <p className="text-xs text-emerald-500">Fast & reliable</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Simple regression model with consistent performance
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <div className="flex gap-3 mb-2">
              <Target className="shrink-0 text-amber-600" size={16} />
              <div>
                <p className="font-semibold text-sm text-amber-700">ARIMA</p>
                <p className="text-xs text-amber-500">Advanced time series</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Sophisticated seasonal and trend analysis
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
