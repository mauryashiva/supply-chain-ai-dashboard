import React, { useState, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Download, AlertTriangle, TrendingUp, ListChecks } from "lucide-react";

// Child Components
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-200 dark:border-zinc-800 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 mb-4">
          <AlertTriangle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-zinc-400 font-medium mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white font-bold py-2.5 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main Analytics Page ---------------- */

const AnalyticsPage: React.FC = () => {
  // --- 🛠️ Logic extracted to Hook ---
  const {
    analyticsData,
    revenueData,
    revenueError,
    summaryLoading,
    isLoading,
  } = useAnalytics(30);

  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Reset download flag when new data arrives
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
    link.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setHasDownloaded(true);
    setIsConfirmModalOpen(false);
  };

  const handleDownloadReport = () => {
    if (hasDownloaded) setIsConfirmModalOpen(true);
    else performDownload();
  };

  return (
    <>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={performDownload}
        title="Duplicate Download"
        message="You have already downloaded a copy of this report. Would you like to download it again?"
      />

      <div className="flex flex-col gap-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Analytics & Reports
            </h1>
            <p className="text-sm font-bold text-gray-500 dark:text-zinc-400">
              Deep insights into your supply chain performance
            </p>
          </div>

          <button
            onClick={handleDownloadReport}
            disabled={!analyticsData || summaryLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md shadow-blue-600/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download size={18} />
            Export Summary
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-80 gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-blue-100 dark:border-zinc-800 border-t-blue-600 animate-spin" />
            <p className="text-gray-500 dark:text-zinc-400 font-bold animate-pulse">
              Aggregating Data...
            </p>
          </div>
        ) : !analyticsData ? (
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm p-12 text-center border border-gray-200 dark:border-zinc-800">
            <AlertTriangle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Data Unavailable
            </h2>
            <p className="mt-2 text-gray-500 dark:text-zinc-400 max-w-xs mx-auto">
              We encountered an issue while fetching your analytics. Please
              refresh the page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <KpiCardGrid kpi_cards={analyticsData.kpi_cards} />
            <LowStockProductsList />

            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm p-6 border border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Top Selling Products
              </h2>
              <TopProductsChart data={analyticsData.top_selling_products} />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm p-6 border border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Delivery Status
              </h2>
              <DeliveryPieChart data={analyticsData.delivery_status} />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm p-6 border border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <ListChecks size={22} className="text-amber-500" />
                Status Distribution
              </h2>
              <OrderStatusChart data={analyticsData.order_status_breakdown} />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm p-8 border border-gray-200 dark:border-zinc-800 md:col-span-2 xl:col-span-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp
                    size={20}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                Revenue Performance (30 Days)
              </h2>
              {revenueError ? (
                <div className="py-20 text-center">
                  <AlertTriangle className="mx-auto h-10 w-10 text-red-400 mb-2" />
                  <p className="text-red-600 dark:text-red-400 font-bold">
                    {revenueError}
                  </p>
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
