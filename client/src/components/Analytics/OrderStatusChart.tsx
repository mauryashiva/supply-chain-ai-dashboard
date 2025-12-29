import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { OrderStatusBreakdownItem } from "@/types"; // Path alias

// Color mapping for each order status
const STATUS_COLORS: { [key: string]: string } = {
  Pending: "#f59e0b",
  Processing: "#3b82f6",
  Shipped: "#8b5cf6",
  "In Transit": "#a855f7",
  Delivered: "#22c55e",
  Cancelled: "#ef4444",
  Returned: "#f43f5e",
  default: "#6b7280", // Fallback color for any unknown status
};

interface OrderStatusChartProps {
  data: OrderStatusBreakdownItem[];
}

export const OrderStatusChart: React.FC<OrderStatusChartProps> = ({ data }) => {
  // Map the incoming data to include the 'fill' color from our STATUS_COLORS object
  const coloredData = data.map((item) => ({
    ...item,
    fill: STATUS_COLORS[item.status] || STATUS_COLORS.default,
  }));

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={coloredData}
          layout="vertical" // Display as a horizontal bar chart
          margin={{ left: 10, right: 30 }}
        >
          {/* XAxis is numerical but hidden; labels will be on the bars or tooltip */}
          <XAxis type="number" hide />
          {/* YAxis displays the category names (order statuses) */}
          <YAxis
            type="category"
            dataKey="status"
            stroke="#a1a1aa"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={80} // Allocate space for status labels
            interval={0} // Ensure all labels are shown
          />
          <Tooltip
            cursor={{ fill: "#ffffff10" }} // Light hover effect on bars
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "0.5rem",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            itemStyle={{ color: "#eee" }}
          />
          {/* This first <Bar> component acts as a background/track for the main bar */}
          <Bar
            dataKey="value"
            fill="#ffffff10"
            background={{ fill: "transparent" }}
            radius={4}
            barSize={20}
            isAnimationActive={false}
          />
          {/* This second <Bar> is the main component that displays the data */}
          <Bar dataKey="value" radius={4} barSize={20}>
            {/* We iterate over the data and use <Cell> to apply a specific color to each bar */}
            {coloredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
