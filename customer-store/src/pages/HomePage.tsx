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
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Modern <span className="text-cyan-400">Inventory</span> Storefront
          </h1>
          <p className="mt-4 text-zinc-400 text-lg">
            Browse through our real-time synced AI-powered product catalog.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-cyan-400 animate-pulse font-medium">
              Loading Products...
            </p>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-xl">
              No products available at the moment.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
