import React, { useEffect, useState } from "react";
// 🛠️ Fixed: Updated to use centralized analyticsService
import { analyticsService } from "@/services/api";
// 🛠️ Fixed: Updated to type-only import for standard compliance
import type { LowStockProduct } from "@/types";
import { AlertTriangle, Loader } from "lucide-react";

export const LowStockProductsList: React.FC = () => {
  // --- 1. STATE MANAGEMENT ---
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 2. DATA FETCHING ---
  useEffect(() => {
    const fetchLowStock = async () => {
      setLoading(true);
      setError(null);
      try {
        // 🛠️ Fixed: Changed getLowStockProducts() to analyticsService.getLowStock()
        const response = await analyticsService.getLowStock();
        // Accessing .data.data because the backend response is wrapped in a "data" field
        setProducts(response.data.data);
      } catch (err) {
        console.error("Failed to fetch low stock products:", err);
        setError("Could not load stock data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLowStock();
  }, []);

  return (
    <div
      className="
        bg-white dark:bg-zinc-900
        rounded-xl shadow-sm
        p-6
        border border-gray-200 dark:border-zinc-800
        h-full
        transition-colors duration-300
      "
    >
      {/* Title — ALWAYS BOLD */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="text-yellow-500" size={20} />
        Low Stock Items
      </h2>

      <div className="h-75 overflow-y-auto pr-2 custom-scrollbar">
        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-600 dark:text-zinc-400 font-bold">
            <Loader className="animate-spin mr-2" size={20} />
            Loading...
          </div>
        ) : error ? (
          /* Error State — ALWAYS BOLD */
          <div className="flex flex-col items-center justify-center h-full text-red-600 dark:text-red-400 font-bold">
            <AlertTriangle size={24} className="mb-2" />
            <p className="text-sm font-bold text-center">{error}</p>
          </div>
        ) : products.length === 0 ? (
          /* Empty State — ALWAYS BOLD */
          <div className="flex items-center justify-center h-full text-gray-600 dark:text-zinc-400 font-bold text-center">
            All products are well-stocked
          </div>
        ) : (
          /* Product List */
          <ul className="space-y-3">
            {products.map((product) => (
              <li
                key={product.name}
                className="
                  flex justify-between items-center
                  bg-gray-50 dark:bg-zinc-800/50
                  hover:bg-gray-100 dark:hover:bg-zinc-800
                  transition-all duration-200
                  p-3
                  rounded-lg
                  border border-gray-200 dark:border-zinc-700
                "
              >
                {/* Product Name — ALWAYS BOLD */}
                <span className="text-sm font-bold text-gray-900 dark:text-zinc-100 truncate mr-4">
                  {product.name}
                </span>

                {/* Quantity — ALWAYS BOLD */}
                <span className="text-sm font-bold text-yellow-600 dark:text-yellow-500 whitespace-nowrap bg-yellow-100/50 dark:bg-yellow-500/10 px-2 py-1 rounded">
                  {product.stock_quantity} units
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
