import React, { useEffect, useState } from "react";
// UPDATE: .ts extension add kiya gaya hai taaki Vite isey sahi se dhoondh sake
import { getDashboardSummary } from "@/services/api.ts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download } from "lucide-react";
import type { AnalyticsSummary } from "@/types";

// Donut chart ke liye colors
const COLORS = ["#22d3ee", "#f43f5e"]; // Cyan for On-Time, Red for Delayed

// --- TOP SELLING PRODUCTS CHART ---
const TopProductsChart: React.FC<{
  data: AnalyticsSummary["top_selling_products"];
}> = ({ data }) => (
  <div style={{ width: "100%", height: 300 }}>
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#a1a1aa"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip
          cursor={{ fill: "#ffffff10" }}
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "0.5rem",
          }}
          labelStyle={{ color: "#a1a1aa" }}
        />
        <Bar
          dataKey="value"
          fill="#38bdf8"
          radius={[0, 4, 4, 0]}
          background={{ fill: "#ffffff10", radius: 4 }}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// --- DELIVERY STATUS PIE CHART ---
const DeliveryPieChart: React.FC<{
  data: AnalyticsSummary["delivery_status"];
}> = ({ data }) => {
  const chartData = [
    { name: "On-Time", value: data.on_time },
    { name: "Delayed", value: data.delayed },
  ];

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "0.5rem",
            }}
          />
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- MAIN ANALYTICS PAGE COMPONENT ---
const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await getDashboardSummary();
        setAnalyticsData(response.data);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics & Reports</h1>
          <p className="text-sm text-zinc-400">
            Deep dive into your supply chain performance.
          </p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors border border-zinc-700">
          <Download size={16} />
          <span>Download Report</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-zinc-400">Loading analytics...</p>
        </div>
      ) : analyticsData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Top Selling Products
            </h2>
            <TopProductsChart data={analyticsData.top_selling_products} />
          </div>
          <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              On-Time vs. Delayed Deliveries
            </h2>
            <DeliveryPieChart data={analyticsData.delivery_status} />
          </div>
          <div className="bg-zinc-900 rounded-lg shadow-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">
              Demand Forecast (AI - Coming Soon)
            </h2>
            <div className="h-[300px] flex items-center justify-center text-zinc-500">
              AI-powered demand forecast chart will be displayed here.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-red-400">Could not load analytics data.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
