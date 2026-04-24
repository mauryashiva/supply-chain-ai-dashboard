import { useState, useEffect } from "react";
import { analyticsService } from "@/services/api";
import type { AnalyticsSummary } from "@/types";

export const useDashboardStats = () => {
  const [summaryData, setSummaryData] = useState<AnalyticsSummary | null>(null);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, revenueRes] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getMonthlyRevenue(6),
      ]);

      setSummaryData(summaryRes.data);
      setMonthlyRevenueData(revenueRes.data.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    summaryData,
    monthlyRevenueData,
    loading,
    error,
    refetch: fetchData,
  };
};
