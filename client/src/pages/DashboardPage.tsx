import React, { useEffect, useState } from "react";
import { getDashboardSummary } from "@/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { IndianRupee, Package, Timer, Truck } from "lucide-react";
import type { AnalyticsSummary, KpiCard } from "@/types";

// CHANGE 1: Yahaan exchange rate set karein
const USD_TO_INR_RATE = 83.5;

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  change: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  change,
}) => (
  <div className="bg-zinc-900 rounded-lg shadow-lg p-5 flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
      <Icon className="h-5 w-5 text-zinc-500" />
    </div>
    <div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-400 mt-1">{change}</p>
    </div>
  </div>
);

const iconMap: { [key: string]: React.ElementType } = {
  "Total Orders": Package,
  Revenue: IndianRupee,
  "On-Time Deliveries": Timer,
  "Pending Orders": Truck,
};

// NOTE: Ye chart data abhi bhi hardcoded hai. Agar ye bhi USD mein hai, to isko bhi convert karna padega.
const chartData = [
  { name: "Jan", revenue: 4000 },
  { name: "Feb", revenue: 3000 },
  { name: "Mar", revenue: 5000 },
  { name: "Apr", revenue: 4500 },
  { name: "May", revenue: 6000 },
  { name: "Jun", revenue: 5500 },
];

const DashboardPage: React.FC = () => {
  const [summaryData, setSummaryData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await getDashboardSummary();
        setSummaryData(response.data);
      } catch (error) {
        console.error("Failed to fetch summary data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* ... Loading state ... */}
        </div>
      ) : summaryData ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryData.kpi_cards.map((card: KpiCard) => {
            let displayValue = card.value;

            // CHANGE 2: Revenue card ke liye value ko convert aur format karein
            if (card.title === "Revenue") {
              // Pehle string se number nikalein (e.g., "$85,620" -> 85620)
              const numericValue = parseFloat(
                card.value.replace(/[^0-9.-]+/g, "")
              );

              // USD se INR mein convert karein
              const valueInInr = numericValue * USD_TO_INR_RATE;

              // Converted value ko Indian currency format mein display karein
              displayValue = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(valueInInr);
            }

            return (
              <KPICard
                key={card.title}
                title={card.title}
                value={displayValue} // Yahaan converted value use hogi
                change={card.change}
                icon={iconMap[card.title] || IndianRupee}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-red-400">Could not load dashboard data.</p>
      )}

      <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Monthly Revenue
        </h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${Number(value) / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: "#ffffff10" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Bar dataKey="revenue" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
