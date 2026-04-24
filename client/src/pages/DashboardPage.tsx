import React, { useEffect, useState } from "react";
// 🛠️ Fixed: Updated to use centralized analyticsService
import { analyticsService } from "@/services/api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  IndianRupee,
  Package,
  Timer,
  Truck,
  AlertTriangle,
} from "lucide-react";

// 🛠️ Fixed: Import types from centralized types folder
import type { AnalyticsSummary, KpiCard } from "@/types";

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  change,
}) => (
  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-5 flex flex-col justify-between border border-gray-200 dark:border-zinc-800 hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-gray-500 dark:text-zinc-400 truncate">
        {title}
      </h3>
      <Icon className="h-5 w-5 text-gray-400 dark:text-zinc-400 flex-shrink-0" />
    </div>

    <div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>

      {change && (
        <p
          className={`text-xs mt-1 font-bold ${
            change.startsWith("+")
              ? "text-green-600 dark:text-green-400"
              : change.startsWith("-")
                ? "text-red-600 dark:text-red-400"
                : "text-gray-500 dark:text-zinc-400"
          }`}
        >
          {change}
        </p>
      )}
    </div>
  </div>
);

const iconMap: { [key: string]: React.ElementType } = {
  "Total Orders": Package,
  Revenue: IndianRupee,
  "On-Time Deliveries": Timer,
  "Pending Orders": Truck,
  "Low Stock Items": AlertTriangle,
  "Inventory Value": IndianRupee,
};

const DashboardPage: React.FC = () => {
  const [summaryData, setSummaryData] = useState<AnalyticsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // 🛠️ Fixed: Updated state type to match modular types
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);
  const [monthlyRevenueLoading, setMonthlyRevenueLoading] = useState(true);
  const [monthlyRevenueError, setMonthlyRevenueError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        // 🛠️ Fixed: Changed to analyticsService.getSummary()
        const response = await analyticsService.getSummary();
        setSummaryData(response.data);
      } catch (error) {
        console.error(error);
        setSummaryError("Could not load dashboard summary.");
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchMonthlyRevenue = async () => {
      setMonthlyRevenueLoading(true);
      setMonthlyRevenueError(null);
      try {
        // 🛠️ Fixed: Changed to analyticsService.getMonthlyRevenue()
        const response = await analyticsService.getMonthlyRevenue(6);
        setMonthlyRevenueData(response.data.data);
      } catch (error) {
        console.error(error);
        setMonthlyRevenueError("Could not load monthly revenue chart.");
      } finally {
        setMonthlyRevenueLoading(false);
      }
    };
    fetchMonthlyRevenue();
  }, []);

  return (
    <div className="flex flex-col gap-6 bg-gray-50 dark:bg-zinc-950 min-h-screen p-6 transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
        Dashboard Overview
      </h1>

      {/* KPI Cards Section */}
      {summaryLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 rounded-xl p-5 h-[108px] animate-pulse border border-gray-200 dark:border-zinc-800"
            >
              <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : summaryError ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 font-bold">
          {summaryError}
        </div>
      ) : summaryData?.kpi_cards ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaryData.kpi_cards.map((card: KpiCard) => (
            <KPICard
              key={card.title}
              title={card.title}
              value={card.value}
              change={card.change}
              icon={iconMap[card.title] || IndianRupee}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-zinc-400 font-bold">
          No summary data available.
        </p>
      )}

      {/* Monthly Revenue Chart Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-sm p-6 border border-gray-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Monthly Revenue (Last 6 Months)
        </h2>

        <div style={{ width: "100%", height: 350 }}>
          {monthlyRevenueLoading ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-zinc-400 font-bold animate-pulse">
              Preparing data visualization...
            </div>
          ) : monthlyRevenueError ? (
            <div className="h-full flex items-center justify-center text-red-600 dark:text-red-400 font-bold bg-red-50/50 dark:bg-red-950/20 rounded-xl">
              {monthlyRevenueError}
            </div>
          ) : monthlyRevenueData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid
                  stroke="#e5e7eb"
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.5}
                />

                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontWeight: 700, fill: "currentColor" }}
                  dy={10}
                />

                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tick={{ fontWeight: 700, fill: "currentColor" }}
                  tickFormatter={(value) => {
                    if (value >= 10000000)
                      return `₹${(value / 10000000).toFixed(1)}Cr`;
                    if (value >= 100000)
                      return `₹${(value / 100000).toFixed(1)}L`;
                    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                    return `₹${value}`;
                  }}
                />

                <Tooltip
                  cursor={{ fill: "#f3f4f6", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    fontWeight: "700",
                  }}
                  itemStyle={{ fontWeight: 800, color: "#2563eb" }}
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                />

                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-zinc-400 font-bold bg-gray-100 dark:bg-zinc-800 rounded-xl border-2 border-dashed">
              No revenue transactions recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
