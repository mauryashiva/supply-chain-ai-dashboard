import React, { useEffect, useState } from "react";
import { getLowStockProducts } from "@/services/api";
import type { LowStockProduct } from "@/types";
// Import icons from lucide-react. 'AlertTriangle' is used for warnings.
import { AlertTriangle, Loader } from "lucide-react";

export const LowStockProductsList: React.FC = () => {
  // State for storing the product list
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  // State for managing the loading indicator
  const [loading, setLoading] = useState(true);
  // State for storing any potential errors
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetches low stock products from the API when the component mounts
    const fetchLowStock = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getLowStockProducts();
        setProducts(response.data.data);
      } catch (err) {
        console.error("Failed to fetch low stock products:", err);
        setError("Could not load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchLowStock();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-800 h-full">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        {/* Use the imported AlertTriangle icon in the title */}
        <AlertTriangle size={20} className="text-yellow-400" />
        Low Stock Items
      </h2>
      <div className="h-[300px] overflow-y-auto pr-2">
        {loading ? (
          // Display a loading spinner while data is being fetched
          <div className="flex items-center justify-center h-full text-zinc-500">
            <Loader className="animate-spin" />
          </div>
        ) : error ? (
          // Display an error message if the API call fails
          <div className="flex flex-col items-center justify-center h-full text-red-400">
            <AlertTriangle size={24} />
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : products.length === 0 ? (
          // Display a message if there are no low stock products
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p>All products are well-stocked!</p>
          </div>
        ) : (
          // Render the list of low stock products
          <ul className="space-y-3">
            {products.map((product) => (
              <li
                key={product.name}
                className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-md"
              >
                <span className="text-sm font-medium text-zinc-300">
                  {product.name}
                </span>
                <span className="text-sm font-bold text-yellow-400">
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
