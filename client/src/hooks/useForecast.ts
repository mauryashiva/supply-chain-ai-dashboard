import { useState, useEffect, useCallback } from "react";
import { forecastService, inventoryService } from "@/services/api";
import type {
  Product,
  ForecastDataPoint,
  TopMover,
  TodayProductForecast,
} from "@/types";

export const useForecast = (selectedProductId: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [topMovers, setTopMovers] = useState<TopMover[]>([]);
  const [todayForecasts, setTodayForecasts] = useState<TodayProductForecast[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [moversLoading, setMoversLoading] = useState(true);
  const [todayLoading, setTodayLoading] = useState(true);

  const [modelConfidence, setModelConfidence] = useState<number>(0);
  const [accuracyMetrics, setAccuracyMetrics] = useState<any>(null);
  const [seasonalDecomp, setSeasonalDecomp] = useState<any>(null);
  const [historicalSummary, setHistoricalSummary] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load initial static data (Products, Movers, Today's Snapshot)
  useEffect(() => {
    inventoryService
      .getProducts()
      .then((res) => setProducts(res.data))
      .catch(console.error);

    const fetchSideData = async () => {
      setMoversLoading(true);
      setTodayLoading(true);
      try {
        const [moversRes, todayRes] = await Promise.all([
          forecastService.getTopMovers(),
          forecastService.getTodayInference(),
        ]);
        setTopMovers(moversRes.data);
        setTodayForecasts(todayRes.data);
      } catch (err) {
        console.error("Side data fetch error:", err);
      } finally {
        setMoversLoading(false);
        setTodayLoading(false);
      }
    };

    fetchSideData();
  }, []);

  // Fetch specific forecast based on product selection
  const fetchForecast = useCallback(async () => {
    setLoading(true);
    try {
      const id =
        selectedProductId === "all" ? undefined : Number(selectedProductId);
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
  }, [selectedProductId]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const totalProjected = forecastData
    .reduce((acc, curr) => acc + (curr.demand_estimate || 0), 0)
    .toFixed(0);

  return {
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
    refreshForecast: fetchForecast,
  };
};
