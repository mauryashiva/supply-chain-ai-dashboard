import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AnalyticsSummary } from "@/types"; // Path alias

// Define colors for the pie chart slices (On-Time, Delayed)
const DELIVERY_COLORS = ["#22d3ee", "#f43f5e"]; // Cyan, Red

interface DeliveryPieChartProps {
  data: AnalyticsSummary["delivery_status"];
}

export const DeliveryPieChart: React.FC<DeliveryPieChartProps> = ({ data }) => {
  // Format the incoming data for the PieChart component
  const chartData = [
    { name: "On-Time", value: data.on_time },
    { name: "Delayed", value: data.delayed },
  ];

  const totalDeliveries = data.on_time + data.delayed;

  // Handle the case where there is no data to display
  if (totalDeliveries === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-zinc-500">
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
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={DELIVERY_COLORS[index % DELIVERY_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "0.5rem",
            }}
            // Custom tooltip formatter to show count and percentage
            formatter={(value: number) =>
              `${value} (${((value / totalDeliveries) * 100).toFixed(1)}%)`
            }
          />
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
