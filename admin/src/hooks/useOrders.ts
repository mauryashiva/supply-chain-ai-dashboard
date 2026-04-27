import { useState, useEffect, useCallback } from "react";
// 🛠️ Matches your centralized API
import { orderService, inventoryService } from "@/services/api";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";
// 🛠️ Matches your modular types
import type { Order, Product } from "@/types";

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized fetch function to use with real-time sync
  const fetchOrdersOnly = useCallback(async () => {
    try {
      const res = await orderService.getOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to sync orders:", err);
    }
  }, []);

  // Initial data load (Orders + Products for the Add Modal)
  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        orderService.getOrders(),
        inventoryService.getProducts(),
      ]);
      setOrders(ordersRes.data || []);
      setProducts(productsRes.data || []);
    } catch (err) {
      setError("Failed to load orders and products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Set up real-time sync
  useRealTimeSync(fetchOrdersOnly);

  // Local State Updaters
  const addOrderLocally = (newOrder: Order) => setOrders([newOrder, ...orders]);

  const updateOrderLocally = (updated: Order) =>
    setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));

  const removeOrderLocally = (id: number) =>
    setOrders(orders.filter((o) => o.id !== id));

  const addProductLocally = (newProduct: Product) =>
    setProducts((prev) => [newProduct, ...prev]);

  return {
    orders,
    products,
    loading,
    error,
    addOrderLocally,
    updateOrderLocally,
    removeOrderLocally,
    addProductLocally,
    refetch: fetchInitialData,
  };
};
