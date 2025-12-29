import React, { useEffect, useState } from "react";
// Import API functions and types
import {
  getDashboardSummary,
  getMonthlyRevenue,
  type MonthlyRevenueDataPoint,
} from "@/services/api";
// Import Recharts components for the bar chart
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid, // Added CartesianGrid for better readability
} from "recharts";
// Import icons from lucide-react
import {
  IndianRupee,
  Package,
  Timer,
  Truck,
  AlertTriangle, // Added AlertTriangle for 'Low Stock'
} from "lucide-react";
// Import custom types
import type { AnalyticsSummary, KpiCard } from "@/types";

// Props interface for the individual KPI card
interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string; // Optional percentage change (e.g., "+5.2%")
}

/**
 * A reusable component to display a single Key Performance Indicator (KPI).
 */
const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  change,
}) => (
  // The card layout, now with a border and no minimum height for better flexibility
  <div className="bg-zinc-900 rounded-lg shadow-lg p-5 flex flex-col justify-between border border-zinc-800">
    <div className="flex items-center justify-between">
      {/* Title is truncated if it's too long */}
      <h3 className="text-sm font-medium text-zinc-400 truncate">{title}</h3>
      {/* Icon won't shrink if the title is long */}
      <Icon className="h-5 w-5 text-zinc-500 flex-shrink-0" />
    </div>
    <div>
      {/* The main value, allowed to wrap if needed */}
      <p className="text-3xl font-bold text-white">{value}</p>
      {/* Conditionally render the 'change' indicator with dynamic coloring */}
      {change && (
        <p
          className={`text-xs mt-1 ${
            change.startsWith("+")
              ? "text-green-400" // Green for positive
              : change.startsWith("-")
              ? "text-red-400" // Red for negative
              : "text-zinc-400" // Neutral color
          }`}
        >
          {change}
        </p>
      )}
    </div>
  </div>
);

// Maps the 'title' string from the API's KPI cards to a specific Lucide icon component
const iconMap: { [key: string]: React.ElementType } = {
  "Total Orders": Package,
  Revenue: IndianRupee,
  "On-Time Deliveries": Timer, // Using Timer icon
  "Pending Orders": Truck,
  "Low Stock Items": AlertTriangle, // Using AlertTriangle icon
  "Inventory Value": IndianRupee, // Using IndianRupee icon
};

/**
 * The main component for the Dashboard page.
 * It fetches and displays KPI cards and a monthly revenue chart.
 */
const DashboardPage: React.FC = () => {
  // State for the main summary data (KPIs, etc.)
  const [summaryData, setSummaryData] = useState<AnalyticsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // State for the Monthly Revenue chart data
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<
    MonthlyRevenueDataPoint[]
  >([]);
  const [monthlyRevenueLoading, setMonthlyRevenueLoading] = useState(true);
  const [monthlyRevenueError, setMonthlyRevenueError] = useState<string | null>(
    null
  );

  // Effect to fetch the KPI summary data when the component mounts
  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const response = await getDashboardSummary();
        setSummaryData(response.data);
      } catch (error) {
        console.error("Failed to fetch summary data:", error);
        setSummaryError("Could not load dashboard summary.");
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, []); // Empty dependency array ensures this runs only once

  // Effect to fetch the monthly revenue data when the component mounts
  useEffect(() => {
    const fetchMonthlyRevenue = async () => {
      setMonthlyRevenueLoading(true);
      setMonthlyRevenueError(null);
      try {
        // Fetch data for the last 6 months
        const response = await getMonthlyRevenue(6);
        setMonthlyRevenueData(response.data.data); // Access the nested 'data' array
      } catch (error) {
        console.error("Failed to fetch monthly revenue data:", error);
        setMonthlyRevenueError("Could not load monthly revenue chart.");
      } finally {
        setMonthlyRevenueLoading(false);
      }
    };
    fetchMonthlyRevenue();
  }, []); // Runs once on mount

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>

      {/* KPI Cards Section */}
      {summaryLoading ? (
        // Show skeleton loaders while KPIs are loading
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900 rounded-lg p-5 h-[108px] animate-pulse border border-zinc-800"
            >
              <div className="h-4 bg-zinc-700 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-zinc-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : summaryError ? (
        // Show an error message if KPI fetching failed
        <p className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-800">
          {summaryError}
        </p>
      ) : summaryData?.kpi_cards ? (
        // Render the KPI cards
        // The grid layout is adjusted to 3 columns on large screens for better spacing
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaryData.kpi_cards.map((card: KpiCard) => (
            <KPICard
              key={card.title}
              title={card.title}
              value={card.value} // Use pre-formatted value from backend
              change={card.change}
              icon={iconMap[card.title] || IndianRupee} // Use mapped icon or fallback
            />
          ))}
        </div>
      ) : (
        // Show if no data is available
        <p className="text-zinc-500">No summary data available.</p>
      )}

      {/* Monthly Revenue Chart Section */}
      <div className="bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-800">
        <h2 className="text-xl font-semibold text-white mb-4">
          Monthly Revenue (Last 6 Months)
        </h2>
        <div style={{ width: "100%", height: 300 }}>
          {/* Conditional rendering for the chart's state (loading, error, data) */}
          {monthlyRevenueLoading ? (
            <div className="h-full flex items-center justify-center text-zinc-500">
              Loading chart...
            </div>
          ) : monthlyRevenueError ? (
            <div className="h-full flex items-center justify-center text-red-400">
              {monthlyRevenueError}
            </div>
          ) : monthlyRevenueData.length > 0 ? (
            // Render the Bar Chart when data is ready
            <ResponsiveContainer>
              <BarChart data={monthlyRevenueData}>
                {/* Faint horizontal grid lines */}
                <CartesianGrid
                  stroke="#3f3f46"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="month" // Use the 'month' string from the API
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  // Formatter to abbreviate large numbers (Lakhs, Crores)
                  tickFormatter={(value) => {
                    if (value >= 10000000)
                      return `₹${(value / 10000000).toFixed(1)}Cr`; // Crores
                    if (value >= 100000)
                      return `₹${(value / 100000).toFixed(1)}L`; // Lakhs
                    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`; // Thousands
                    return `₹${value}`; // Below 1k
                  }}
                  width={70} // Reserve space for labels
                />
                <Tooltip
                  cursor={{ fill: "#ffffff10" }} // Light hover effect
                  // Dark theme styling for the tooltip box
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  itemStyle={{ color: "#22d3ee" }} // Match bar color
                  // Format the value inside the tooltip with currency and commas
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                />
                <Bar
                  dataKey="revenue" // The key for the bar values
                  fill="#22d3ee" // Cyan color
                  radius={[4, 4, 0, 0]} // Rounded top corners
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            // Show if data array is empty
            <div className="h-full flex items-center justify-center text-zinc-500">
              No revenue data for the selected period.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
