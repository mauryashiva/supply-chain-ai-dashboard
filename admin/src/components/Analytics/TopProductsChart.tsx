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
        {/* Grid (theme aware) */}
        <CartesianGrid stroke="var(--grid-color)" horizontal={false} />

        {/* Hidden numeric axis */}
        <XAxis type="number" hide />

        {/* Y Axis — ALWAYS BOLD */}
        <YAxis
          type="category"
          dataKey="name"
          fontSize={13}
          tickLine={false}
          axisLine={false}
          width={120}
          interval={0}
          tick={{ fontWeight: 700, fill: "var(--axis-text)" }}
        />

        {/* Tooltip — ALWAYS BOLD + Theme Aware */}
        <Tooltip
          cursor={{ fill: "var(--tooltip-hover)" }}
          contentStyle={{
            backgroundColor: "var(--tooltip-bg)",
            border: "1px solid var(--tooltip-border)",
            borderRadius: "8px",
            fontWeight: "700",
            color: "var(--tooltip-text)",
          }}
          labelStyle={{ fontWeight: 700 }}
          itemStyle={{ fontWeight: 700 }}
        />

        {/* Bars */}
        <Bar
          dataKey="value"
          fill="var(--bar-color)"
          radius={[0, 6, 6, 0]}
          background={{ fill: "var(--bar-track)", radius: 6 }}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
