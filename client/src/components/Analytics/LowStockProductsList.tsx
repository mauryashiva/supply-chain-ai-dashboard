import React, { useEffect, useState } from "react";
import { getLowStockProducts } from "@/services/api";
import type { LowStockProduct } from "@/types";
import { AlertTriangle, Loader } from "lucide-react";

export const LowStockProductsList: React.FC = () => {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLowStock = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getLowStockProducts();
        setProducts(response.data.data);
      } catch (err) {
        console.error(err);
        setError("Could not load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLowStock();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 h-full">
      {/* Title — ALWAYS BOLD */}
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <AlertTriangle size={20} className="text-yellow-500" />
        Low Stock Items
      </h2>

      <div className="h-[300px] overflow-y-auto pr-2">
        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-600 font-bold">
            <Loader className="animate-spin mr-2" />
            Loading...
          </div>
        ) : error ? (
          /* Error — ALWAYS BOLD */
          <div className="flex flex-col items-center justify-center h-full text-red-600 font-bold">
            <AlertTriangle size={24} />
            <p className="mt-2 text-sm font-bold">{error}</p>
          </div>
        ) : products.length === 0 ? (
          /* Empty — ALWAYS BOLD */
          <div className="flex items-center justify-center h-full text-gray-600 font-bold">
            All products are well-stocked
          </div>
        ) : (
          /* Product List */
          <ul className="space-y-3">
            {products.map((product) => (
              <li
                key={product.name}
                className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition p-3 rounded-lg border border-gray-200"
              >
                {/* Product Name — BOLD */}
                <span className="text-sm font-bold text-gray-900">
                  {product.name}
                </span>

                {/* Quantity — BOLD */}
                <span className="text-sm font-bold text-yellow-600">
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
