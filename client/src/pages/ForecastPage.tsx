import React, { useEffect, useState } from "react";
import { Brain, TrendingUp, Loader, AlertTriangle } from "lucide-react";
// --- CHANGE 1: Naye API functions aur types import karein ---
import { getDemandForecast, getProducts } from "@/services/api";
import type { ForecastDataPoint, Product } from "@/types";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";

const ForecastPage: React.FC = () => {
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- CHANGE 2: Naye states dropdown ke liye ---
  const [products, setProducts] = useState<Product[]>([]); // Saare products ki list
  const [selectedProductId, setSelectedProductId] = useState<string>("all"); // Default "All Products"
  const [selectedProductName, setSelectedProductName] =
    useState("All Products");

  // --- CHANGE 3: Pehle, saare products ko fetch karein ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        setProducts(response.data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    fetchProducts();
  }, []);

  // --- CHANGE 4: 'selectedProductId' badalne par forecast ko dobara fetch karein ---
  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      setError(null);

      // 'all' ko undefined mein convert karein taaki API total forecast de
      const productId =
        selectedProductId === "all" ? undefined : Number(selectedProductId);

      try {
        const response = await getDemandForecast(productId);
        setForecastData(response.data.forecast);
      } catch (err) {
        console.error("Failed to fetch forecast:", err);
        setError("Could not load forecast data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [selectedProductId]); // Ab yeh selectedProductId par depend karta hai

  // Dropdown change ko handle karein
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedProductId(newId);

    if (newId === "all") {
      setSelectedProductName("All Products");
    } else {
      const product = products.find((p) => p.id === Number(newId));
      setSelectedProductName(product ? product.name : "Selected Product");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain size={28} className="text-purple-400" />
            AI Demand Forecast
          </h1>
          <p className="text-sm text-zinc-400">
            Predict future product demand using historical order data.
          </p>
        </div>

        {/* --- CHANGE 5: Naya Product Selector Dropdown --- */}
        <div className="w-full sm:w-64">
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Select Product to Forecast
          </label>
          <select
            value={selectedProductId}
            onChange={handleProductChange}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Products (Total Demand)</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-800">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-cyan-400" />
          {/* Title ab dynamic hai */}
          30-Day Forecast for: {selectedProductName}
        </h2>

        <div className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
              <Loader className="animate-spin h-8 w-8" />
              <span className="ml-3">Generating forecast...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400">
              <AlertTriangle size={32} />
              <p className="mt-3 font-semibold">{error}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={forecastData}
                margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis
                  dataKey="date"
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis stroke="#a1a1aa" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#3f3f46",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: "#ffffff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Forecasted Demand (Units)"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastPage;
