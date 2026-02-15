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

  // Real-time inventory updates via WebSocket
  useInventorySocket(fetchProducts);

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    // Fixed height container to lock the screen and allow internal scrolling
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Main content area becomes the scrollable zone */}
      <main className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-6 sm:py-10">
        <div className="container mx-auto">
          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-[60vh]">
              <div className="h-10 w-10 border-4 border-zinc-800 border-t-cyan-400 rounded-full animate-spin mb-4" />
              <p className="text-cyan-400 font-black uppercase tracking-[0.3em] text-[10px]">
                Syncing_Inventory
              </p>
            </div>
          ) : (
            /* Product Grid - Starts immediately at the top */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product: any) => (
                <div key={product.id} className="flex justify-center">
                  {/* Card sizing is controlled inside ProductCard for consistency */}
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 opacity-30">
              <div className="h-20 w-20 border-2 border-dashed border-zinc-700 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">∅</span>
              </div>
              <p className="text-zinc-500 font-black uppercase tracking-widest text-sm">
                No_Deployments_Found
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Styles to keep the scrollbar clean and prevent horizontal movement */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.2);
        }
        main {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.05) transparent;
        }
      `}</style>
    </div>
  );
};
