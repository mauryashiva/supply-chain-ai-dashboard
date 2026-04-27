import { useState } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Mail,
  CheckCircle,
} from "lucide-react";

export const ForecastExport = ({
  forecastData,
  todayForecasts,
  accuracy,
  historical,
}: {
  forecastData: any[];
  todayForecasts: any[];
  accuracy: any;
  historical: any;
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportedType, setExportedType] = useState<string | null>(null);

  const exportToCSV = () => {
    setIsExporting(true);
    setExportedType(null);

    try {
      // Prepare forecast data CSV
      const forecastHeaders = [
        "Date",
        "Day",
        "Demand Estimate",
        "Confidence Lower",
        "Confidence Upper",
        "Linear Forecast",
        "ARIMA Forecast",
      ];
      const forecastRows = forecastData.map((row) => [
        row.date,
        row.day_name,
        row.demand_estimate,
        row.confidence_lower,
        row.confidence_upper,
        row.linear_forecast || "",
        row.arima_forecast || "",
      ]);

      // Prepare today's forecast CSV
      const todayHeaders = [
        "Product Name",
        "SKU",
        "Predicted Demand",
        "Current Stock",
        "Stock Status",
        "Trend",
        "Confidence Score",
        "Avg Daily Demand",
        "Days of Stock",
      ];
      const todayRows = todayForecasts.map((row) => [
        row.name,
        row.sku,
        row.predicted_demand,
        row.current_stock,
        row.stock_status,
        row.trend,
        row.confidence_score,
        row.avg_daily_demand,
        row.days_of_stock,
      ]);

      // Create CSV content
      const csvContent = [
        "FORECAST DATA",
        forecastHeaders.join(","),
        ...forecastRows.map((row) => row.join(",")),
        "",
        "TODAY'S PRODUCT FORECASTS",
        todayHeaders.join(","),
        ...todayRows.map((row) => row.join(",")),
        "",
        "MODEL METRICS",
        `MAE,${accuracy?.mae || 0}`,
        `RMSE,${accuracy?.rmse || 0}`,
        `MAPE,${accuracy?.mape || 0}%`,
        "",
        "HISTORICAL SUMMARY",
        `Total Days,${historical?.total_days || 0}`,
        `Avg Daily Demand,${historical?.avg_daily_demand || 0}`,
        `Max Daily Demand,${historical?.max_daily_demand || 0}`,
        `Total Demand,${historical?.total_demand || 0}`,
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `forecast-report-${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportedType("CSV");
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    setExportedType(null);

    try {
      const exportData = {
        generated_at: new Date().toISOString(),
        forecast_data: forecastData,
        today_forecasts: todayForecasts,
        model_metrics: accuracy,
        historical_summary: historical,
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], {
        type: "application/json;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `forecast-report-${new Date().toISOString().split("T")[0]}.json`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportedType("JSON");
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const shareViaEmail = () => {
    const subject = `Supply Chain Forecast Report - ${new Date().toLocaleDateString()}`;
    const body = `
Supply Chain AI Dashboard - Forecast Report

Generated on: ${new Date().toLocaleString()}

Key Metrics:
- Total Forecast Days: ${forecastData.length}
- Products Monitored: ${todayForecasts.length}
- Model Accuracy (MAPE): ${accuracy?.mape || 0}%

Critical Stock Alerts: ${todayForecasts.filter((p) => p.stock_status === "critical").length}

Please find the detailed forecast data attached.

Best regards,
Supply Chain AI Dashboard
    `.trim();

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-lg min-w-0 overflow-hidden wrap-break-word">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
            <Download className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Export Forecast Data
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Download reports and share insights
            </p>
          </div>
        </div>
        {exportedType && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={16} />
            <span className="font-medium">
              {exportedType} exported successfully
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* CSV Export */}
        <button
          onClick={exportToCSV}
          disabled={isExporting}
          className="w-full p-4 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-green-300 disabled:to-emerald-400 text-white rounded-xl border border-green-500 transition-all duration-200 flex items-center justify-center gap-3 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          <FileSpreadsheet size={20} />
          <div className="text-left">
            <span className="text-sm font-semibold uppercase tracking-wide">
              {isExporting ? "Exporting..." : "Export CSV"}
            </span>
            <p className="text-xs opacity-90">
              Spreadsheet format for Excel/Google Sheets
            </p>
          </div>
        </button>

        {/* JSON Export */}
        <button
          onClick={exportToJSON}
          disabled={isExporting}
          className="w-full p-4 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-400 text-white rounded-xl border border-blue-500 transition-all duration-200 flex items-center justify-center gap-3 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          <FileText size={20} />
          <div className="text-left">
            <span className="text-sm font-semibold uppercase tracking-wide">
              {isExporting ? "Exporting..." : "Export JSON"}
            </span>
            <p className="text-xs opacity-90">
              Structured data for developers/APIs
            </p>
          </div>
        </button>

        {/* Email Share */}
        <button
          onClick={shareViaEmail}
          className="w-full p-4 bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl border border-purple-500 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
        >
          <Mail size={20} />
          <div className="text-left">
            <span className="text-sm font-semibold uppercase tracking-wide">
              Share via Email
            </span>
            <p className="text-xs opacity-90">
              Send summary report to stakeholders
            </p>
          </div>
        </button>

        {/* Export Info */}
        <div className="p-4 bg-linear-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wide">
            Report Includes:
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle size={12} className="text-emerald-500" />
              <span>30-day forecast data</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={12} className="text-emerald-500" />
              <span>Today's product forecasts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={12} className="text-emerald-500" />
              <span>Model accuracy metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={12} className="text-emerald-500" />
              <span>Historical performance data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
