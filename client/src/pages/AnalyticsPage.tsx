import React, { useEffect, useState } from "react";
// Import API functions and types using path aliases
import {
  getDashboardSummary,
  getRevenueOverTime,
  type RevenueDataPoint,
} from "@/services/api";
import type { AnalyticsSummary } from "@/types";
// Import Lucide icons
import { Download, AlertTriangle, TrendingUp, ListChecks } from "lucide-react";
// Import individual analytics components
import { KpiCardGrid } from "@/components/Analytics/KpiCardGrid";
import { TopProductsChart } from "@/components/Analytics/TopProductsChart";
import { DeliveryPieChart } from "@/components/Analytics/DeliveryPieChart";
import { OrderStatusChart } from "@/components/Analytics/OrderStatusChart";
import { RevenueChart } from "@/components/Analytics/RevenueChart";
// Import the component for displaying low stock products
import { LowStockProductsList } from "@/components/Analytics/LowStockProductsList";

/**
 * Confirmation Modal Component
 * A simple modal used to confirm if the user wants to download the report again.
 * Note: Consider replacing this with a more reusable ConfirmationModal component
 * that accepts button text and confirmation logic as props if needed elsewhere.
 */
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
// --- End of ConfirmationModal ---

/**
 * Main Analytics Page Component
 * Fetches and displays various analytics summaries and charts.
 */
const AnalyticsPage: React.FC = () => {
  // State for overall analytics summary data (KPIs, charts)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(
    null
  );
  const [summaryLoading, setSummaryLoading] = useState(true);

  // State specifically for the revenue over time chart data
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  // State to manage the download report functionality
  const [hasDownloaded, setHasDownloaded] = useState(false); // Tracks if the report was downloaded in the current session
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Controls the confirmation modal

  // Effect to fetch the main analytics summary data on component mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      setSummaryLoading(true);
      try {
        const response = await getDashboardSummary();
        setAnalyticsData(response.data);
      } catch (error) {
        console.error("Failed to fetch analytics summary:", error);
        // Optionally set an error state here
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchAnalytics();
  }, []); // Empty dependency array ensures this runs only once

  // Effect to fetch revenue data over the last 30 days on component mount
  useEffect(() => {
    const fetchRevenue = async () => {
      setRevenueLoading(true);
      setRevenueError(null);
      try {
        const response = await getRevenueOverTime(30); // Fetch data for 30 days
        // Sort data chronologically before setting state
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
  }, []); // Empty dependency array ensures this runs only once

  // Effect to reset the download status when new analytics data is loaded
  useEffect(() => {
    if (analyticsData) {
      setHasDownloaded(false);
    }
  }, [analyticsData]);

  /**
   * Generates and triggers the download of a CSV summary report.
   */
  const performDownload = () => {
    if (!analyticsData) return;

    // Helper function to safely escape values for CSV format
    const escapeCsv = (str: string | undefined | null): string => {
      if (str === undefined || str === null) return '""';
      const s = String(str);
      // Double up existing double quotes and wrap the string in double quotes
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
    // Add Order Status Breakdown if needed
    // csvContent += "\nOrder Status Breakdown\n";
    // csvContent += "Status,Count\n";
    // analyticsData.order_status_breakdown.forEach(item => {
    //   csvContent += `${escapeCsv(item.status)},${item.value}\n`;
    // });

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split("T")[0]; // Get current date YYYY-MM-DD
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics-summary-report-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the object URL

    setHasDownloaded(true); // Mark as downloaded for this session
    setIsConfirmModalOpen(false); // Close confirmation modal if it was open
  };

  /**
   * Handles the click on the "Download Summary" button.
   * Opens confirmation modal if already downloaded, otherwise performs download.
   */
  const handleDownloadReport = () => {
    if (hasDownloaded) {
      setIsConfirmModalOpen(true);
    } else {
      performDownload();
    }
  };

  // Determine the overall loading state based on both data fetches
  const isLoading = summaryLoading || revenueLoading;

  return (
    <>
      {/* Confirmation Modal for re-downloading */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={performDownload}
        title="Confirm Download"
        message="You have already downloaded this report. Do you want to download it again?"
      />

      <div className="flex flex-col gap-6">
        {/* Page Header and Download Button */}
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
            disabled={!analyticsData || summaryLoading} // Disable if no data or still loading summary
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span>Download Summary</span>
          </button>
        </div>

        {/* --- UI States: Loading, Error, Content --- */}

        {/* Loading State: Displayed when either summary or revenue data is loading */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            {/* Simple SVG Spinner */}
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
        ) : // Error State: Displayed if summary data failed to load
        !analyticsData && !summaryLoading ? ( // Check !summaryLoading ensures this doesn't show momentarily before loading finishes
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
          // Content Grid: Displayed when data is successfully loaded
          analyticsData && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* KPI Cards Grid */}
              {analyticsData.kpi_cards && analyticsData.kpi_cards.length > 0 ? (
                <KpiCardGrid kpi_cards={analyticsData.kpi_cards} />
              ) : (
                // Placeholder if KPI data is missing/empty
                <div className="bg-zinc-900 rounded-lg shadow-lg p-4 border border-zinc-800 md:col-span-2 xl:col-span-3 text-center text-zinc-500">
                  KPI Cards data is unavailable.
                </div>
              )}

              {/* Low Stock Products List Component */}
              <LowStockProductsList />

              {/* Top Selling Products Chart */}
              <div className="bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-800">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Top Selling Products
                </h2>
                <TopProductsChart data={analyticsData.top_selling_products} />
              </div>

              {/* Delivery Status Pie Chart */}
              <div className="bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-800">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Delivery Status
                </h2>
                <DeliveryPieChart data={analyticsData.delivery_status} />
              </div>

              {/* Order Status Breakdown Chart */}
              <div className="bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-800">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <ListChecks size={20} className="text-amber-400" />
                  Order Status Breakdown
                </h2>
                {/* Check if breakdown data exists and is not empty */}
                {analyticsData.order_status_breakdown &&
                analyticsData.order_status_breakdown.length > 0 ? (
                  <OrderStatusChart
                    data={analyticsData.order_status_breakdown}
                  />
                ) : (
                  // Placeholder if order status data is missing/empty
                  <div className="h-[300px] flex items-center justify-center text-zinc-500">
                    No order status data available.
                  </div>
                )}
              </div>

              {/* Revenue Over Time Line Chart */}
              <div className="bg-zinc-900 rounded-lg shadow-lg p-6 md:col-span-2 xl:col-span-3 border border-zinc-800">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-cyan-400" />
                  Revenue Over Last 30 Days
                </h2>
                {/* Conditional rendering for the revenue chart's loading/error/data states */}
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
                  // Render the chart if data is available
                  <RevenueChart data={revenueData} />
                ) : (
                  // Placeholder if no revenue data exists for the period
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
