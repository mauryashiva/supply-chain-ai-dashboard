import React, { useEffect, useState } from "react";
import { getLowStockProducts } from "@/services/api";
import type { LowStockProduct } from "@/types";
// --- YAHAN BADLAAV KIYA GAYA HAI ---
import { AlertTriangle, Loader } from "lucide-react"; // 'PackageWarning' ko 'AlertTriangle' se badal diya hai

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
        console.error("Failed to fetch low stock products:", err);
        setError("Could not load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchLowStock();
  }, []);

  return (
    <div className="bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-800 h-full">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        {/* --- YAHAN BHI BADLAAV KIYA GAYA HAI --- */}
        <AlertTriangle size={20} className="text-yellow-400" />
        Low Stock Items
      </h2>
      <div className="h-[300px] overflow-y-auto pr-2">
        {loading ? (
          <div className="flex items-center justify-center h-full text-zinc-500">
            <Loader className="animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400">
            <AlertTriangle size={24} />
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p>All products are well-stocked!</p>
          </div>
        ) : (
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
