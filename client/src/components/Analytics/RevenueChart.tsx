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
import type { RevenueDataPoint } from "@/services/api"; // Path alias

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  // Format the raw date data (e.g., "2025-10-28") into a user-friendly string (e.g., "Oct 28")
  // We add 'T00:00:00Z' and 'timeZone: "UTC"' to ensure dates are parsed consistently
  // without being shifted by the user's local time zone.
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date + "T00:00:00Z").toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", timeZone: "UTC" }
    ),
  }));

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
        >
          {/* Defines the main line on the chart */}
          <Line
            type="monotone" // Creates a smooth, curved line
            dataKey="revenue" // The key from 'formattedData' to use for the Y-axis
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 4, fill: "#0e7490" }} // Style for the small dots on the line
            activeDot={{ r: 6, stroke: "#38bdf8", fill: "#0e7490" }} // Style for the dot on hover
          />
          {/* Renders the background grid */}
          <CartesianGrid stroke="#3f3f46" strokeDasharray="3 3" />
          {/* Defines the X-axis (horizontal) */}
          <XAxis
            dataKey="displayDate" // The key from 'formattedData' to use for labels
            stroke="#a1a1aa"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd" // Ensures the first and last labels are always shown
          />
          {/* Defines the Y-axis (vertical) */}
          <YAxis
            stroke="#a1a1aa"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            // Formats the axis tick labels (e.g., 50000 -> ₹50,000)
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
            width={70} // Reserves space for the Y-axis labels
          />
          {/* Configures the tooltip that appears on hover */}
          <Tooltip
            cursor={{ stroke: "#ffffff30", strokeWidth: 1 }} // Style for the vertical hover line
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "0.5rem",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            itemStyle={{ color: "#38bdf8" }}
            // Formats the value inside the tooltip (e.g., 50000 -> ₹50,000)
            formatter={(value: number) => `₹${value.toLocaleString()}`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
