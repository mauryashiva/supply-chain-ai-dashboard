import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import type { OrderStatusBreakdownItem } from "@/types";

/* Color mapping */
const STATUS_COLORS: { [key: string]: string } = {
  Pending: "#f59e0b",
  Processing: "#3b82f6",
  Shipped: "#8b5cf6",
  "In Transit": "#a855f7",
  Delivered: "#22c55e",
  Cancelled: "#ef4444",
  Returned: "#f43f5e",
  default: "#9ca3af",
};

interface OrderStatusChartProps {
  data: OrderStatusBreakdownItem[];
}

export const OrderStatusChart: React.FC<OrderStatusChartProps> = ({ data }) => {
  const coloredData = data.map((item) => ({
    ...item,
    fill: STATUS_COLORS[item.status] || STATUS_COLORS.default,
  }));

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={coloredData}
          layout="vertical"
          margin={{ left: 10, right: 30 }}
        >
          {/* Grid (theme aware) */}
          <CartesianGrid stroke="var(--grid-color)" horizontal={false} />

          {/* Hidden X axis */}
          <XAxis type="number" hide />

          {/* Y axis — ALWAYS BOLD */}
          <YAxis
            type="category"
            dataKey="status"
            fontSize={13}
            tickLine={false}
            axisLine={false}
            width={110}
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

          {/* Background Track */}
          <Bar
            dataKey="value"
            fill="var(--track-bg)"
            background={{ fill: "transparent" }}
            radius={6}
            barSize={22}
            isAnimationActive={false}
          />

          {/* Main Bars */}
          <Bar dataKey="value" radius={6} barSize={22}>
            {coloredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
