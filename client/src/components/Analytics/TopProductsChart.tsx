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
import type { AnalyticsSummary } from "@/types";

interface TopProductsChartProps {
  data: AnalyticsSummary["top_selling_products"];
}

export const TopProductsChart: React.FC<TopProductsChartProps> = ({ data }) => (
  <div style={{ width: "100%", height: 300 }}>
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        {/* Grid */}
        <CartesianGrid stroke="#e5e7eb" horizontal={false} />

        {/* X Axis — Hidden numeric */}
        <XAxis type="number" hide />

        {/* Y Axis — ALWAYS BOLD */}
        <YAxis
          type="category"
          dataKey="name"
          stroke="#374151"
          fontSize={13}
          tickLine={false}
          axisLine={false}
          width={120}
          interval={0}
          tick={{ fontWeight: 700, fill: "#111827" }} // Bold text
        />

        {/* Tooltip — ALL TEXT BOLD */}
        <Tooltip
          cursor={{ fill: "#f3f4f6" }}
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontWeight: "700",
            color: "#111827",
          }}
          labelStyle={{ fontWeight: 700 }}
          itemStyle={{ fontWeight: 700 }}
        />

        {/* Bars */}
        <Bar
          dataKey="value"
          fill="#2563eb"
          radius={[0, 6, 6, 0]}
          background={{ fill: "#f3f4f6", radius: 6 }}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
