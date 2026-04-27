import { useState } from "react";
import { useForecast } from "@/hooks/useForecast";

// Component Imports
import { ForecastHeader } from "@/components/forecast/ForecastHeader";
import { ForecastControls } from "@/components/forecast/ForecastControls";
import { ForecastChart } from "@/components/forecast/ForecastChart";
import { ForecastInsights } from "@/components/forecast/ForecastInsights";
import { ForecastLogs } from "@/components/forecast/ForecastLogs";
import { ForecastMoverCard } from "@/components/forecast/ForecastMoverCard";
import { TodayForecastChart } from "@/components/forecast/TodayForecastChart";
import { ForecastMetrics } from "@/components/forecast/ForecastMetrics";
import { ModelComparisonChart } from "@/components/forecast/ModelComparisonChart";
import { SeasonalDecompositionChart } from "@/components/forecast/SeasonalDecompositionChart";
import { RealTimeForecastUpdates } from "@/components/forecast/RealTimeForecastUpdates";
import { ForecastExport } from "@/components/forecast/ForecastExport";

const ForecastPage = () => {
  const [selectedProductId, setSelectedProductId] = useState<string>("all");

  // --- 🛠️ Logic separated into Custom Hook ---
  const {
    products,
    forecastData,
    topMovers,
    todayForecasts,
    loading,
    moversLoading,
    todayLoading,
    modelConfidence,
    accuracyMetrics,
    seasonalDecomp,
    historicalSummary,
    lastUpdate,
    totalProjected,
    refreshForecast,
  } = useForecast(selectedProductId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300 font-sans">
      <div className="max-w-400 mx-auto p-6 space-y-8">
        {/* SECTION 1: Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
          <ForecastHeader
            totalProjected={totalProjected}
            modelConfidence={modelConfidence}
            loading={loading}
          />
        </div>

        {/* SECTION 2: Controls */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
          <ForecastControls
            selectedId={selectedProductId}
            setSelectedId={setSelectedProductId}
            products={products}
          />
        </div>

        {/* SECTION 3: Snapshot Maps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden">
            <h2 className="text-xl font-black uppercase tracking-tighter mb-6 dark:text-white">
              Today's Inference Map
            </h2>
            <TodayForecastChart data={todayForecasts} loading={todayLoading} />
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <ForecastMoverCard movers={topMovers} loading={moversLoading} />
          </div>
        </div>

        {/* SECTION 4: Analysis Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-black uppercase text-zinc-500 mb-4 tracking-widest">
              Model Vector Comparison
            </h3>
            <ModelComparisonChart data={forecastData} loading={loading} />
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-black uppercase text-zinc-500 mb-4 tracking-widest">
              Seasonal Decomposition
            </h3>
            <SeasonalDecompositionChart
              decomposition={seasonalDecomp}
              loading={loading}
            />
          </div>
        </div>

        {/* SECTION 5: Main Time Series */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200 dark:border-zinc-800">
          <ForecastChart data={forecastData} loading={loading} />

          <div className="mt-8 flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-4">
              <div
                className={`w-3 h-3 rounded-full animate-pulse ${
                  modelConfidence > 90 ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
                Engine Confidence: {modelConfidence}%
              </span>
            </div>

            <div className="w-1/3 bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full transition-all duration-1000"
                style={{ width: `${modelConfidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: Advanced Metrics & Side Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 min-w-0">
            <h3 className="text-lg font-black uppercase mb-6 tracking-tighter italic dark:text-white">
              Engine Advanced Metrics
            </h3>
            <ForecastMetrics
              accuracy={accuracyMetrics}
              decomposition={seasonalDecomp}
              historical={historicalSummary}
              confidence={modelConfidence}
            />
          </div>

          <div className="flex flex-col gap-6 min-w-0">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden">
              <RealTimeForecastUpdates
                onRefresh={refreshForecast}
                lastUpdate={lastUpdate}
              />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden">
              <ForecastExport
                forecastData={forecastData}
                todayForecasts={todayForecasts}
                accuracy={accuracyMetrics}
                historical={historicalSummary}
              />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden">
              <ForecastInsights
                confidence={modelConfidence}
                selectedId={selectedProductId}
              />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden">
              <ForecastLogs />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastPage;
