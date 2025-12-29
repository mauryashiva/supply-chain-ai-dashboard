import React, { useEffect, useState } from "react";
import { Brain, TrendingUp, Loader, AlertTriangle } from "lucide-react";
// Import API functions and types for forecasting and products
import { getDemandForecast, getProducts } from "@/services/api";
import type { ForecastDataPoint, Product } from "@/types";
// Import Recharts components for the line chart
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

/**
 * ForecastPage Component
 * Displays an AI-generated demand forecast for products.
 * Allows users to select a specific product or view the total demand forecast.
 */
const ForecastPage: React.FC = () => {
  // State for storing the fetched forecast data points
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  // State for managing loading indicators
  const [loading, setLoading] = useState(true);
  // State for storing error messages
  const [error, setError] = useState<string | null>(null);

  // State for the product dropdown selector
  const [products, setProducts] = useState<Product[]>([]); // List of all available products
  const [selectedProductId, setSelectedProductId] = useState<string>("all"); // Currently selected product ID ('all' for total)
  const [selectedProductName, setSelectedProductName] =
    useState("All Products"); // Name of the selected product for the chart title

  // Effect hook to fetch the list of all products for the dropdown on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        setProducts(response.data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        // Optionally set an error state or show a notification
      }
    };
    fetchProducts();
  }, []); // Empty dependency array ensures this runs only once

  // Effect hook to fetch the forecast data whenever the selectedProductId changes
  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      setError(null);

      // Convert 'all' to 'undefined' for the API call to get the total forecast
      const productId =
        selectedProductId === "all" ? undefined : Number(selectedProductId);

      try {
        const response = await getDemandForecast(productId);
        // Assuming API response structure is { data: { forecast: [...] } }
        setForecastData(response.data.forecast);
      } catch (err) {
        console.error("Failed to fetch forecast:", err);
        setError("Could not load forecast data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [selectedProductId]); // Dependency array: re-runs when selectedProductId changes

  // Handles changes in the product selection dropdown
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedProductId(newId);

    // Update the product name for the chart title based on the selection
    if (newId === "all") {
      setSelectedProductName("All Products");
    } else {
      const product = products.find((p) => p.id === Number(newId));
      setSelectedProductName(product ? product.name : "Selected Product");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
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

        {/* Product Selector Dropdown */}
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
            {/* Populate dropdown with fetched products */}
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
          {/* Dynamic chart title */}
          30-Day Forecast for: {selectedProductName}
        </h2>

        {/* Chart Container - height is fixed */}
        <div className="h-[400px]">
          {/* Conditional rendering based on loading/error state */}
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
            // Render the chart when data is available
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={forecastData}
                margin={{ top: 5, right: 20, left: -20, bottom: 5 }} // Adjust margins for axis labels
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />{" "}
                {/* Grid lines */}
                <XAxis
                  dataKey="date"
                  stroke="#a1a1aa"
                  fontSize={12}
                  // Format the date labels on the X-axis (e.g., "29/10")
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    // Adjust for UTC if dates are coming as YYYY-MM-DD
                    const utcDate = new Date(
                      date.getUTCFullYear(),
                      date.getUTCMonth(),
                      date.getUTCDate()
                    );
                    return `${utcDate.getDate()}/${utcDate.getMonth() + 1}`;
                  }}
                />
                <YAxis stroke="#a1a1aa" fontSize={12} /> {/* Y-axis */}
                <Tooltip
                  // Style the tooltip for the dark theme
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#3f3f46",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: "#ffffff" }} // Tooltip label color
                />
                <Legend /> {/* Chart legend */}
                <Line
                  type="monotone" // Smooth curve
                  dataKey="value" // The data field for the Y-axis
                  name="Forecasted Demand (Units)" // Legend label
                  stroke="#22d3ee" // Line color (cyan)
                  strokeWidth={2}
                  dot={false} // Hide dots on the line
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
