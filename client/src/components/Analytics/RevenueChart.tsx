import React from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RevenueDataPoint } from "@/services/api";

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date + "T00:00:00Z").toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", timeZone: "UTC" },
    ),
  }));

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
        >
          {/* Grid */}
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />

          {/* Line */}
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4, fill: "#1d4ed8" }}
            activeDot={{ r: 6, stroke: "#2563eb", fill: "#1d4ed8" }}
          />

          {/* X Axis — ALWAYS BOLD */}
          <XAxis
            dataKey="displayDate"
            stroke="#374151"
            fontSize={13}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tick={{ fontWeight: 700, fill: "#111827" }}
          />

          {/* Y Axis — ALWAYS BOLD */}
          <YAxis
            stroke="#374151"
            fontSize={13}
            tickLine={false}
            axisLine={false}
            width={80}
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
            tick={{ fontWeight: 700, fill: "#111827" }}
          />

          {/* Tooltip — ALL TEXT BOLD */}
          <Tooltip
            cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontWeight: "700",
              color: "#111827",
            }}
            labelStyle={{ fontWeight: 700 }}
            itemStyle={{ fontWeight: 700, color: "#2563eb" }}
            formatter={(value: number) => `₹${value.toLocaleString()}`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
