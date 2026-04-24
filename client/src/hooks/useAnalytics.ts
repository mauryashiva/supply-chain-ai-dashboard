import { useState, useEffect, useCallback } from "react";
// 🛠️ Matches your centralized API
import { analyticsService } from "@/services/api";
// 🛠️ Matches your modular types
import type { AnalyticsSummary, RevenueDataPoint } from "@/types";

export const useAnalytics = (revenueDays: number = 30) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(
    null,
  );
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const response = await analyticsService.getSummary();
      setAnalyticsData(response.data);
    } catch (error) {
      console.error("Summary fetch error:", error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchRevenue = useCallback(async () => {
    setRevenueLoading(true);
    setRevenueError(null);
    try {
      const response = await analyticsService.getRevenue(revenueDays);
      // Sort data chronologically for the chart
      const sorted = response.data.data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setRevenueData(sorted);
    } catch (err) {
      console.error("Revenue fetch error:", err);
      setRevenueError("Could not load revenue chart data.");
    } finally {
      setRevenueLoading(false);
    }
  }, [revenueDays]);

  useEffect(() => {
    fetchSummary();
    fetchRevenue();
  }, [fetchSummary, fetchRevenue]);

  return {
    analyticsData,
    revenueData,
    summaryLoading,
    revenueLoading,
    revenueError,
    refreshSummary: fetchSummary,
    refreshRevenue: fetchRevenue,
    isLoading: summaryLoading || revenueLoading,
  };
};
