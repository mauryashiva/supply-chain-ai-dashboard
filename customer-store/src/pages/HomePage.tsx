import React, { useEffect, useState } from "react";
import { getStorefrontProducts } from "@/services/api";
import { ProductCard } from "@/components/product/ProductCard";
import { Navbar } from "@/components/common/Navbar";
import { useInventorySocket } from "@/hooks/useInventorySocket";

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await getStorefrontProducts();
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useInventorySocket(fetchProducts);

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="h-screen bg-gray-50 text-gray-900 flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-6 sm:py-10">
        <div className="container mx-auto">
          {/* Loading */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-[60vh]">
              <div className="h-10 w-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-blue-600 font-bold uppercase tracking-[0.3em] text-[10px]">
                Syncing Inventory
              </p>
            </div>
          ) : (
            /* Grid */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product: any) => (
                <div key={product.id} className="flex justify-center">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 opacity-40">
              <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl font-bold">∅</span>
              </div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
                No Products Found
              </p>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(37, 99, 235, 0.4);
        }
        main {
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.15) transparent;
        }
      `}</style>
    </div>
  );
};
