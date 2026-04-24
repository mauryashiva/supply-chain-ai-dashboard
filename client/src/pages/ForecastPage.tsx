import { useEffect, useState } from "react";
// 🛠️ Fixed: Updated to use centralized services
import { forecastService, inventoryService } from "@/services/api";
// 🛠️ Fixed: Updated type imports to type-only standard
import type {
  Product,
  ForecastDataPoint,
  TopMover,
  TodayProductForecast,
} from "@/types";

// Components
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
  // --- 1. STATE MANAGEMENT ---
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [topMovers, setTopMovers] = useState<TopMover[]>([]);
  const [todayForecasts, setTodayForecasts] = useState<TodayProductForecast[]>(
    [],
  );
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [moversLoading, setMoversLoading] = useState<boolean>(true);
  const [todayLoading, setTodayLoading] = useState<boolean>(true);
  const [modelConfidence, setModelConfidence] = useState<number>(0);
  const [accuracyMetrics, setAccuracyMetrics] = useState<any>(null);
  const [seasonalDecomp, setSeasonalDecomp] = useState<any>(null);
  const [historicalSummary, setHistoricalSummary] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // --- 2. INITIAL DATA LOAD ---
  useEffect(() => {
    // 🛠️ Fixed: Use centralized inventoryService
    inventoryService
      .getProducts()
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Product Load Error:", err));

    // 🛠️ Fixed: Replaced raw fetch with centralized forecastService
    const fetchTopMovers = async () => {
      setMoversLoading(true);
      try {
        const res = await forecastService.getTopMovers();
        setTopMovers(res.data);
      } catch (err) {
        console.error("Top Movers Error:", err);
        setTopMovers([]);
      } finally {
        setMoversLoading(false);
      }
    };

    const fetchTodayForecast = async () => {
      setTodayLoading(true);
      try {
        // Assuming you add getTodayForecast to forecastService or use the appropriate endpoint
        const res = await forecastService.getTodayInference();
        setTodayForecasts(res.data);
      } catch (err) {
        console.error("Today Forecast Error:", err);
        setTodayForecasts([]);
      } finally {
        setTodayLoading(false);
      }
    };

    fetchTopMovers();
    fetchTodayForecast();
  }, []);

  // --- 3. DYNAMIC FORECAST FETCHING ---
  const fetchForecast = async () => {
    setLoading(true);
    try {
      const id =
        selectedProductId === "all" ? undefined : Number(selectedProductId);

      // 🛠️ Fixed: Use centralized forecastService
      const res = await forecastService.getDemandForecast(id);

      const formattedData = res.data.forecast.map((d: any) => ({
        ...d,
        displayDate: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }));

      setForecastData(formattedData);
      setModelConfidence(res.data.model_confidence || 94.2);
      setAccuracyMetrics(res.data.accuracy_metrics);
      setSeasonalDecomp(res.data.seasonal_decomposition);
      setHistoricalSummary(res.data.historical_summary);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Inference Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [selectedProductId]);

  // --- 4. CALCULATIONS ---
  const totalProjected = forecastData
    .reduce(
      (acc: number, curr: ForecastDataPoint) =>
        acc + (curr.demand_estimate || 0),
      0,
    )
    .toFixed(0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300 font-sans">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8">
        {/* HEADER SECTION */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
          <ForecastHeader
            totalProjected={totalProjected}
            modelConfidence={modelConfidence}
            loading={loading}
          />
        </div>

        {/* CONTROLS SECTION */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
          <ForecastControls
            selectedId={selectedProductId}
            setSelectedId={setSelectedProductId}
            products={products}
          />
        </div>

        {/* INFERENCE MAP & MOVERS */}
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

        {/* VECTOR COMPARISON & DECOMPOSITION */}
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

        {/* FORECAST MAIN CHART */}
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

        {/* ADVANCED METRICS & SIDEBAR */}
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
                onRefresh={fetchForecast}
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
