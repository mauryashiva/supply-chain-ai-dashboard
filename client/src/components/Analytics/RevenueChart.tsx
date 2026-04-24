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
// 🛠️ Fixed: Import from @/types instead of @/services/api
// 🛠️ Fixed: Used 'import type' for verbatimModuleSyntax compliance
import type { RevenueDataPoint } from "@/types";

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
          {/* Grid (theme aware) */}
          <CartesianGrid stroke="var(--grid-color)" strokeDasharray="3 3" />

          {/* Line */}
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--line-color)"
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--line-dot)" }}
            activeDot={{
              r: 6,
              stroke: "var(--line-color)",
              fill: "var(--line-dot)",
            }}
          />

          {/* X Axis — ALWAYS BOLD */}
          <XAxis
            dataKey="displayDate"
            fontSize={13}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tick={{ fontWeight: 700, fill: "var(--axis-text)" }}
          />

          {/* Y Axis — ALWAYS BOLD */}
          <YAxis
            fontSize={13}
            tickLine={false}
            axisLine={false}
            width={80}
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
            tick={{ fontWeight: 700, fill: "var(--axis-text)" }}
          />

          {/* Tooltip — ALWAYS BOLD + Theme Aware */}
          <Tooltip
            cursor={{ stroke: "var(--tooltip-cursor)", strokeWidth: 1 }}
            contentStyle={{
              backgroundColor: "var(--tooltip-bg)",
              border: "1px solid var(--tooltip-border)",
              borderRadius: "8px",
              fontWeight: "700",
              color: "var(--tooltip-text)",
            }}
            labelStyle={{ fontWeight: 700 }}
            itemStyle={{ fontWeight: 700, color: "var(--line-color)" }}
            formatter={(value: number) => `₹${value.toLocaleString()}`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
