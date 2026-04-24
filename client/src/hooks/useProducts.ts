import { useState, useEffect } from "react";
// 🛠️ Matches your centralized API
import { inventoryService } from "@/services/api";
// 🛠️ Matches your modular types
import type { Product } from "@/types";

export const useProducts = (refreshKey?: number) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryService.getProducts();
      setProducts(response.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on mount or when refreshKey changes
  useEffect(() => {
    fetchProducts();
  }, [refreshKey]);

  // Logic to handle local state updates after mutations
  const addProductLocally = (newProduct: Product) => {
    setProducts((prev) =>
      [newProduct, ...prev].sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  const updateProductLocally = (updated: Product) => {
    setProducts((prev) =>
      prev
        .map((p) => (p.id === updated.id ? updated : p))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  const removeProductLocally = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    products,
    loading,
    error,
    refresh: fetchProducts,
    addProductLocally,
    updateProductLocally,
    removeProductLocally,
  };
};
