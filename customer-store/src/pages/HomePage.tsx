import React, { useEffect, useState, useCallback } from "react";
// 1. Updated Service Import
import { catalogService } from "@/services";
import { ProductCard } from "@/components/product/ProductCard";
import { Navbar } from "@/components/common/Navbar";
import { useInventorySocket } from "@/hooks/useInventorySocket";
import { useCartStore } from "@/store/useCartStore";
import type { Product } from "@/types"; // Import the standardized type

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Get the syncPrices action from your store
  const syncPrices = useCartStore((state) => state.syncPrices);

  /**
   * Fetches the latest catalog from the backend.
   * Centralized logic ensures price sync across the whole app.
   */
  const fetchProducts = useCallback(async () => {
    try {
      // Matches backend: GET /api/customer/catalog/products
      const response = await catalogService.getProducts();
      const latestData = response.data;

      setProducts(latestData);

      // REAL-TIME SYNC: This handles price/stock updates for items
      // already sitting in the user's cart drawer.
      syncPrices(latestData);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [syncPrices]);

  // WebSocket Hook: Triggers a refresh whenever the admin
  // updates inventory on the backend.
  useInventorySocket(fetchProducts);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden transition-colors duration-300 selection:bg-cyan-500/30">
      <Navbar />

      <main className="flex-1 overflow-y-auto custom-scrollbar pt-16 pb-24 md:pb-10">
        <div className="container mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-[70vh]">
              <div className="relative">
                <div className="h-12 w-12 border-2 border-muted rounded-xl animate-pulse" />
                <div className="absolute inset-0 h-12 w-12 border-t-2 border-cyan-500 rounded-xl animate-spin" />
              </div>
              <p className="mt-6 text-cyan-600 dark:text-cyan-400 font-black uppercase tracking-[0.4em] text-[9px] animate-pulse">
                Establishing_Secure_Sync
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-8">
              {products.map((product) => (
                <div key={product.id} className="flex justify-center">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="h-24 w-24 border border-dashed border-border rounded-[2rem] flex items-center justify-center mb-8 rotate-12 opacity-50">
                <span className="text-5xl font-black text-muted-foreground -rotate-12">
                  !
                </span>
              </div>
              <h2 className="text-muted-foreground font-black uppercase tracking-[0.3em] text-sm">
                No_Inventory_Available
              </h2>
              <p className="text-[10px] text-muted-foreground/60 font-bold mt-2 tracking-widest uppercase">
                Check back later for new arrivals
              </p>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
        main {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--border)) transparent;
        }
      `}</style>
    </div>
  );
};
