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

/* Theme-aware colors (works in both light & dark UI) */
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
      <div className="h-75 flex items-center justify-center text-gray-600 dark:text-zinc-400 font-bold">
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
            stroke="var(--pie-stroke)"
            strokeWidth={2}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={DELIVERY_COLORS[index % DELIVERY_COLORS.length]}
              />
            ))}
          </Pie>

          {/* Tooltip — FIXED TYPE ERROR */}
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tooltip-bg)",
              border: "1px solid var(--tooltip-border)",
              borderRadius: "8px",
              fontWeight: "700",
            }}
            labelStyle={{ fontWeight: 700, color: "var(--tooltip-text)" }}
            itemStyle={{ fontWeight: 700, color: "var(--tooltip-text)" }}
            // Fixed the (value: number) type error by using any or compatible Recharts type
            formatter={(value: any) => {
              const numValue = Number(value) || 0;
              const percentage = ((numValue / totalDeliveries) * 100).toFixed(
                1,
              );
              return [`${numValue} (${percentage}%)`, "Deliveries"];
            }}
          />

          {/* Legend — Always Bold + Theme Aware */}
          <Legend
            iconType="circle"
            wrapperStyle={{
              fontWeight: 700,
              paddingTop: "20px",
            }}
            // Custom formatter to ensure legend text is theme-aware and bold
            formatter={(value) => (
              <span style={{ color: "var(--legend-text)", fontWeight: 700 }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
