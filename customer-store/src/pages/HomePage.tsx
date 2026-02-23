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
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden transition-colors duration-300">
      <Navbar />

      <main className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-6 sm:py-10">
        <div className="container mx-auto">
          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-[60vh]">
              <div className="h-10 w-10 border-4 border-muted border-t-cyan-500 rounded-full animate-spin mb-4" />
              <p className="text-cyan-600 dark:text-cyan-400 font-black uppercase tracking-[0.3em] text-[10px]">
                Syncing_Inventory
              </p>
            </div>
          ) : (
            /* Product Grid */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product: any) => (
                <div key={product.id} className="flex justify-center">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 opacity-30">
              <div className="h-20 w-20 border-2 border-dashed border-border rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl font-bold text-muted-foreground">
                  ∅
                </span>
              </div>
              <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-sm">
                No_Products_Found
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
          background: var(--border);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--ring);
        }
        /* Support for Firefox */
        main {
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
      `}</style>
    </div>
  );
};
