import React, { useEffect, useState } from "react";
// Path aliases ka use
import {
  getDashboardSummary,
  getRevenueOverTime,
  type RevenueDataPoint,
} from "@/services/api";
import type { AnalyticsSummary } from "@/types";
// Lucide icons
import { Download, AlertTriangle, TrendingUp, ListChecks } from "lucide-react";
// Sabhi analytics components ko alag-alag import kiya
import { KpiCardGrid } from "@/components/Analytics/KpiCardGrid";
import { TopProductsChart } from "@/components/Analytics/TopProductsChart";
import { DeliveryPieChart } from "@/components/Analytics/DeliveryPieChart";
import { OrderStatusChart } from "@/components/Analytics/OrderStatusChart";
import { RevenueChart } from "@/components/Analytics/RevenueChart";
// --- NAYA COMPONENT IMPORT KAREIN ---
import { LowStockProductsList } from "@/components/Analytics/LowStockProductsList";

// --- Confirmation Modal Component (Poora code) ---
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
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-sm relative border border-zinc-700 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 mb-4">
          <AlertTriangle className="h-6 w-6 text-blue-500" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-zinc-400 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Download Again
          </button>
        </div>
      </div>
    </div>
  );
};
// --- End of Modal ---

// --- MAIN ANALYTICS PAGE COMPONENT ---
const AnalyticsPage: React.FC = () => {
  // State for Summary data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(
    null
  );
  const [summaryLoading, setSummaryLoading] = useState(true);

  // State for Revenue data
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  // State for Download Report
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Fetch Summary Data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setSummaryLoading(true);
      try {
        const response = await getDashboardSummary();
        setAnalyticsData(response.data);
      } catch (error) {
        console.error("Failed to fetch analytics summary:", error);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Fetch Revenue Data
  useEffect(() => {
    const fetchRevenue = async () => {
      setRevenueLoading(true);
      setRevenueError(null);
      try {
        const response = await getRevenueOverTime(30);
        const sortedData = response.data.data.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setRevenueData(sortedData);
      } catch (error) {
        console.error("Failed to fetch revenue data:", error);
        setRevenueError("Could not load revenue chart data.");
      } finally {
        setRevenueLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  // Reset download status
  useEffect(() => {
    if (analyticsData) {
      setHasDownloaded(false);
    }
  }, [analyticsData]);

  // Download Report Logic (Poora code)
  const performDownload = () => {
    if (!analyticsData) return;

    const escapeCsv = (str: string | undefined | null): string => {
      if (str === undefined || str === null) return '""';
      const s = String(str);
      return `"${s.replace(/"/g, '""')}"`;
    };

    let csvContent = "KPI Summary\n";
    csvContent += "Metric,Value\n";
    analyticsData.kpi_cards.forEach((card) => {
      csvContent += `${escapeCsv(card.title)},${escapeCsv(card.value)}\n`;
    });
    csvContent += "\n";

    csvContent += "Top Selling Products\n";
    csvContent += "Product Name,Units Sold\n";
    analyticsData.top_selling_products.forEach((product) => {
      csvContent += `${escapeCsv(product.name)},${product.value}\n`;
    });
    csvContent += "\n";

    csvContent += "Delivery Status\n";
    csvContent += "Status,Count\n";
    csvContent += `On-Time,${analyticsData.delivery_status.on_time}\n`;
    csvContent += `Delayed,${analyticsData.delivery_status.delayed}\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics-summary-report-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setHasDownloaded(true);
    setIsConfirmModalOpen(false);
  };

  const handleDownloadReport = () => {
    if (hasDownloaded) {
      setIsConfirmModalOpen(true);
    } else {
      performDownload();
    }
  };

  // Determine overall loading state
  const isLoading = summaryLoading || revenueLoading;

  return (
    <>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={performDownload}
        title="Confirm Download"
        message="You have already downloaded this report. Do you want to download it again?"
      />

      <div className="flex flex-col gap-6">
        {/* Header and Download Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Analytics & Reports
            </h1>
            <p className="text-sm text-zinc-400">
              Deep dive into your supply chain performance.
            </p>
          </div>
          <button
            onClick={handleDownloadReport}
            disabled={!analyticsData || summaryLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span>Download Summary</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <svg
              className="animate-spin -ml-1 mr-3 h-10 w-10 text-cyan-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-zinc-400">Loading analytics...</p>
          </div>
        ) : // Error State
        !analyticsData && !summaryLoading ? (
          <div className="flex justify-center items-center h-64 bg-zinc-900 rounded-lg p-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <p className="mt-4 text-lg font-semibold text-red-400">
                Could not load summary data.
              </p>
              <p className="text-zinc-400 text-sm">
                Please try refreshing the page.
              </p>
            </div>
          </div>
        ) : (
          // --- Refactored Content Grid ---
          analyticsData && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* KPI Cards */}
              {analyticsData.kpi_cards && analyticsData.kpi_cards.length > 0 ? (
                <KpiCardGrid kpi_cards={analyticsData.kpi_cards} />
              ) : (
                <div className="bg-zinc-900 rounded-lg shadow-lg p-4 border border-zinc-800 md:col-span-2 xl:col-span-3 text-center text-zinc-500">
                  KPI Cards data is unavailable.
                </div>
              )}

              {/* --- NAYA COMPONENT YAHAN ADD KIYA GAYA HAI --- */}
              <LowStockProductsList />

              {/* Top Selling Products */}
              <div className="bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-800">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Top Selling Products
                </h2>
                <TopProductsChart data={analyticsData.top_selling_products} />
              </div>

              {/* Delivery Status */}
              <div className="bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-800">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Delivery Status
                </h2>
                <DeliveryPieChart data={analyticsData.delivery_status} />
              </div>

              {/* Order Status Breakdown */}
              <div className="bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-800">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <ListChecks size={20} className="text-amber-400" />
                  Order Status Breakdown
                </h2>
                {analyticsData.order_status_breakdown &&
                analyticsData.order_status_breakdown.length > 0 ? (
                  <OrderStatusChart
                    data={analyticsData.order_status_breakdown}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-zinc-500">
                    No order status data available.
                  </div>
                )}
              </div>

              {/* Revenue Chart */}
              <div className="bg-zinc-900 rounded-lg shadow-lg p-6 md:col-span-2 xl:col-span-3 border border-zinc-800">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-cyan-400" />
                  Revenue Over Last 30 Days
                </h2>
                {revenueLoading ? (
                  <div className="h-[300px] flex items-center justify-center text-zinc-500">
                    <svg
                      className="animate-spin h-8 w-8 text-cyan-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="ml-3">Loading chart data...</span>
                  </div>
                ) : revenueError ? (
                  <div className="h-[300px] flex flex-col items-center justify-center text-red-400 bg-red-900/10 rounded-md p-4">
                    <AlertTriangle className="w-8 h-8 mb-2" />
                    <p className="font-semibold">{revenueError}</p>
                  </div>
                ) : revenueData.length > 0 ? (
                  <RevenueChart data={revenueData} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-zinc-500 bg-zinc-800/50 rounded-md">
                    No revenue data available for this period.
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
};

export default AnalyticsPage;
