import React, { useEffect, useState } from "react";
import {
  getDashboardSummary,
  getRevenueOverTime,
  type RevenueDataPoint,
} from "@/services/api";
import type { AnalyticsSummary } from "@/types";

import { Download, AlertTriangle, TrendingUp, ListChecks } from "lucide-react";

import { KpiCardGrid } from "@/components/Analytics/KpiCardGrid";
import { TopProductsChart } from "@/components/Analytics/TopProductsChart";
import { DeliveryPieChart } from "@/components/Analytics/DeliveryPieChart";
import { OrderStatusChart } from "@/components/Analytics/OrderStatusChart";
import { RevenueChart } from "@/components/Analytics/RevenueChart";
import { LowStockProductsList } from "@/components/Analytics/LowStockProductsList";

/* ---------------- Confirmation Modal ---------------- */

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm border border-gray-200 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 mb-4">
          <AlertTriangle className="h-6 w-6 text-blue-600" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>

        <p className="text-gray-600 font-medium mb-6">{message}</p>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 rounded-lg transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Download Again
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main Analytics Page ---------------- */

const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(
    null,
  );
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setSummaryLoading(true);
      try {
        const response = await getDashboardSummary();
        setAnalyticsData(response.data);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  useEffect(() => {
    const fetchRevenue = async () => {
      setRevenueLoading(true);
      setRevenueError(null);
      try {
        const response = await getRevenueOverTime(30);
        const sorted = response.data.data.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        setRevenueData(sorted);
      } catch {
        setRevenueError("Could not load revenue chart data.");
      } finally {
        setRevenueLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  useEffect(() => {
    if (analyticsData) setHasDownloaded(false);
  }, [analyticsData]);

  const performDownload = () => {
    if (!analyticsData) return;

    const escapeCsv = (str: any) =>
      `"${String(str ?? "").replace(/"/g, '""')}"`;

    let csv = "KPI Summary\nMetric,Value\n";
    analyticsData.kpi_cards.forEach((c) => {
      csv += `${escapeCsv(c.title)},${escapeCsv(c.value)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setHasDownloaded(true);
    setIsConfirmModalOpen(false);
  };

  const handleDownloadReport = () => {
    if (hasDownloaded) setIsConfirmModalOpen(true);
    else performDownload();
  };

  const isLoading = summaryLoading || revenueLoading;

  return (
    <>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={performDownload}
        title="Confirm Download"
        message="You already downloaded this report. Download again?"
      />

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics & Reports
            </h1>
            <p className="text-gray-600 font-semibold">
              Deep insights into your supply chain performance
            </p>
          </div>

          <button
            onClick={handleDownloadReport}
            disabled={!analyticsData || summaryLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow-sm disabled:opacity-50"
          >
            <Download size={16} />
            Download Summary
          </button>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <svg
              className="animate-spin h-10 w-10 text-blue-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5 0 0 5 0 12h4z"
              />
            </svg>
          </div>
        ) : !analyticsData ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-lg font-bold text-red-600">
              Could not load analytics data
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <KpiCardGrid kpi_cards={analyticsData.kpi_cards} />

            <LowStockProductsList />

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Top Selling Products
              </h2>
              <TopProductsChart data={analyticsData.top_selling_products} />
            </div>

            {/* Delivery Pie */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Delivery Status
              </h2>
              <DeliveryPieChart data={analyticsData.delivery_status} />
            </div>

            {/* Order Status */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ListChecks size={20} className="text-amber-500" />
                Order Status Breakdown
              </h2>
              <OrderStatusChart data={analyticsData.order_status_breakdown} />
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 md:col-span-2 xl:col-span-3">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Revenue Over Last 30 Days
              </h2>

              {revenueError ? (
                <div className="text-red-600 font-semibold text-center">
                  {revenueError}
                </div>
              ) : (
                <RevenueChart data={revenueData} />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AnalyticsPage;
