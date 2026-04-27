import React from "react";
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

// 🛠️ Hook & Types
import { useDashboardStats } from "@/hooks/useDashboardStats";
import type { KpiCard } from "@/types";

// --- Sub-Component: KPI Card ---
const KPICard = ({
  title,
  value,
  icon: Icon,
  change,
}: {
  title: string;
  value: string;
  icon: any;
  change?: string;
}) => (
  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-5 flex flex-col justify-between border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-all">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-gray-500 dark:text-zinc-400 truncate">
        {title}
      </h3>
      <Icon className="h-5 w-5 text-gray-400 dark:text-zinc-400 shrink-0" />
    </div>
    <div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      {change && (
        <p
          className={`text-xs mt-1 font-bold ${change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
        >
          {change}
        </p>
      )}
    </div>
  </div>
);

const iconMap: Record<string, any> = {
  "Total Orders": Package,
  Revenue: IndianRupee,
  "On-Time Deliveries": Timer,
  "Pending Orders": Truck,
  "Low Stock Items": AlertTriangle,
  "Inventory Value": IndianRupee,
};

const DashboardPage: React.FC = () => {
  // 🛠️ All logic abstracted into the hook
  const { summaryData, monthlyRevenueData, loading, error } =
    useDashboardStats();

  if (error) {
    return (
      <div className="p-6 text-red-600 font-bold bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 m-6">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 bg-gray-50 dark:bg-zinc-950 min-h-screen p-6 transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
        Dashboard Overview
      </h1>

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 rounded-xl p-5 h-27 animate-pulse border border-gray-200 dark:border-zinc-800"
              />
            ))
          : summaryData?.kpi_cards.map((card: KpiCard) => (
              <KPICard
                key={card.title}
                title={card.title}
                value={card.value}
                change={card.change}
                icon={iconMap[card.title] || IndianRupee}
              />
            ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm p-6 border border-gray-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Monthly Revenue (Last 6 Months)
        </h2>
        <div style={{ width: "100%", height: 350 }}>
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-400 font-bold animate-pulse">
              Loading charts...
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
                  tick={{ fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tick={{ fontWeight: 700 }}
                  tickFormatter={(val) =>
                    val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
                  }
                />
                <Tooltip
                  cursor={{ fill: "#f3f4f6", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    fontWeight: "700",
                  }}
                  formatter={(value: any) => {
                    const numValue = Number(value) || 0;
                    return [`₹${numValue.toLocaleString()}`, "Revenue"];
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 font-bold border-2 border-dashed rounded-xl">
              No data found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
