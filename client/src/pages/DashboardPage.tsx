import React, { useEffect, useState } from "react";
import {
  getDashboardSummary,
  getMonthlyRevenue,
  type MonthlyRevenueDataPoint,
} from "@/services/api";

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
  <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col justify-between border border-gray-200 hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-gray-500 truncate">{title}</h3>
      <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
    </div>

    <div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>

      {change && (
        <p
          className={`text-xs mt-1 font-bold ${
            change.startsWith("+")
              ? "text-green-600"
              : change.startsWith("-")
                ? "text-red-600"
                : "text-gray-500"
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

  const [monthlyRevenueData, setMonthlyRevenueData] = useState<
    MonthlyRevenueDataPoint[]
  >([]);
  const [monthlyRevenueLoading, setMonthlyRevenueLoading] = useState(true);
  const [monthlyRevenueError, setMonthlyRevenueError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const response = await getDashboardSummary();
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
        const response = await getMonthlyRevenue(6);
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
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>

      {/* KPI Cards */}
      {summaryLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-5 h-[108px] animate-pulse border border-gray-200"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : summaryError ? (
        <p className="text-red-600 font-bold bg-red-50 p-4 rounded-lg border border-red-200">
          {summaryError}
        </p>
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
        <p className="text-gray-500 font-bold">No summary data available.</p>
      )}

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Monthly Revenue (Last 6 Months)
        </h2>

        <div style={{ width: "100%", height: 300 }}>
          {monthlyRevenueLoading ? (
            <div className="h-full flex items-center justify-center text-gray-500 font-bold">
              Loading chart...
            </div>
          ) : monthlyRevenueError ? (
            <div className="h-full flex items-center justify-center text-red-600 font-bold">
              {monthlyRevenueError}
            </div>
          ) : monthlyRevenueData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid
                  stroke="#e5e7eb"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontWeight: 700 }}
                />

                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tick={{ fontWeight: 700 }}
                  tickFormatter={(value) => {
                    if (value >= 10000000)
                      return `₹${(value / 10000000).toFixed(1)}Cr`;
                    if (value >= 100000)
                      return `₹${(value / 100000).toFixed(1)}L`;
                    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
                    return `₹${value}`;
                  }}
                />

                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontWeight: "700",
                  }}
                  labelStyle={{ fontWeight: 700 }}
                  itemStyle={{ fontWeight: 700, color: "#2563eb" }}
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                />

                <Bar
                  dataKey="revenue"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 font-bold">
              No revenue data available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
