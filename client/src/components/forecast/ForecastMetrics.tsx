import React from "react";
import {
  TrendingUp,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle,
  Target,
  Calendar,
} from "lucide-react";

// 🛠️ Fixed: Updated to type-only imports from your new modular types
import type {
  ForecastAccuracy,
  SeasonalDecomposition,
  HistoricalSummary,
} from "@/types";

interface ForecastMetricsProps {
  accuracy?: ForecastAccuracy;
  decomposition?: SeasonalDecomposition | null;
  historical?: HistoricalSummary;
  confidence: number;
}

export const ForecastMetrics: React.FC<ForecastMetricsProps> = ({
  accuracy,
  decomposition,
  historical,
  confidence,
}) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (conf >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getConfidenceBgColor = (conf: number) => {
    if (conf >= 80)
      return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
    if (conf >= 60)
      return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
    return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  };

  const getConfidenceIcon = (conf: number) => {
    if (conf >= 80)
      return <CheckCircle size={20} className="text-emerald-500" />;
    if (conf >= 60) return <AlertCircle size={20} className="text-amber-500" />;
    return <AlertCircle size={20} className="text-red-500" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg">
          <BarChart3 className="text-white" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Model Performance Metrics
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Forecast accuracy and reliability indicators
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Model Confidence */}
        <div
          className={`p-6 rounded-xl border transition-all ${getConfidenceBgColor(confidence)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getConfidenceIcon(confidence)}
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  Model Confidence
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Forecast reliability score
                </p>
              </div>
            </div>
            <div
              className={`text-3xl font-black ${getConfidenceColor(confidence)}`}
            >
              {confidence.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Accuracy Metrics */}
        {accuracy && (
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Target
                size={16}
                className="text-slate-600 dark:text-slate-400"
              />
              Accuracy Metrics
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    MAE
                  </p>
                  <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
                    {accuracy.mae.toFixed(1)}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 mt-1">
                    Mean Absolute Error
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    RMSE
                  </p>
                  <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
                    {accuracy.rmse.toFixed(1)}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 mt-1">
                    Root Mean Square Error
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    MAPE
                  </p>
                  <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
                    {accuracy.mape.toFixed(1)}%
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 mt-1">
                    Mean Absolute % Error
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Historical Summary */}
        {historical && (
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                <Activity className="text-white" size={16} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  Historical Performance
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Data analysis summary
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Data Points
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {historical.total_days} days
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Avg Daily
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {historical.avg_daily_demand.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Peak
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {historical.max_daily_demand}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Total
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {historical.total_demand}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Seasonal Insights */}
        {decomposition && (
          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500 rounded-lg shadow-sm">
                <TrendingUp className="text-white" size={16} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  Seasonal Pattern
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Time series analysis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-purple-100 dark:border-purple-900/30">
              <Calendar size={16} className="text-purple-500" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Weekly seasonality identified in demand
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
