import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AnalyticsSummary } from "@/types";

/* Light UI friendly colors */
const DELIVERY_COLORS = ["#2563eb", "#ef4444"]; // Blue, Red

interface DeliveryPieChartProps {
  data: AnalyticsSummary["delivery_status"];
}

export const DeliveryPieChart: React.FC<DeliveryPieChartProps> = ({ data }) => {
  const chartData = [
    { name: "On-Time", value: data.on_time },
    { name: "Delayed", value: data.delayed },
  ];

  const totalDeliveries = data.on_time + data.delayed;

  if (totalDeliveries === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-600 font-bold">
        No delivery data available.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={DELIVERY_COLORS[index % DELIVERY_COLORS.length]}
              />
            ))}
          </Pie>

          {/* Tooltip — ALL TEXT BOLD */}
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontWeight: "700", // Bold
              color: "#111827",
            }}
            labelStyle={{ fontWeight: 700 }}
            itemStyle={{ fontWeight: 700 }}
            formatter={(value: number) =>
              `${value} (${((value / totalDeliveries) * 100).toFixed(1)}%)`
            }
          />

          {/* Legend — ALWAYS BOLD */}
          <Legend
            iconType="circle"
            wrapperStyle={{
              fontWeight: 700,
              color: "#111827",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
