import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AnalyticsSummary } from "@/types"; // Path alias

interface TopProductsChartProps {
  data: AnalyticsSummary["top_selling_products"];
}

// This component renders a horizontal bar chart for top selling products
export const TopProductsChart: React.FC<TopProductsChartProps> = ({ data }) => (
  <div style={{ width: "100%", height: 300 }}>
    <ResponsiveContainer>
      <BarChart
        data={data}
        layout="vertical" // Makes the bar chart horizontal
        margin={{ left: 20 }} // Adds space on the left for Y-axis labels
      >
        {/* The X-axis (value axis) is numerical but hidden */}
        <XAxis type="number" hide />

        {/* The Y-axis (category axis) displays the product names */}
        <YAxis
          type="category"
          dataKey="name" // Uses the 'name' field from the data for labels
          stroke="#a1a1aa"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={100} // Allocates 100px width for long product names
          interval={0} // Ensures all product names are displayed
        />

        {/* Customizes the tooltip appearance for a dark theme */}
        <Tooltip
          cursor={{ fill: "#ffffff10" }} // Light hover effect on the bar
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "0.5rem",
          }}
          labelStyle={{ color: "#a1a1aa" }}
        />

        {/* Defines the bars in the chart */}
        <Bar
          dataKey="value" // Uses the 'value' field for the bar length
          fill="#38bdf8"
          radius={[0, 4, 4, 0]} // Rounds the top-right and bottom-right corners
          background={{ fill: "#ffffff10", radius: 4 }} // Adds a faint background track
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
