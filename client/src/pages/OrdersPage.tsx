import React, { useEffect, useState } from "react";
// 🛠️ Fixed: Updated to use modularized services
import { orderService, inventoryService } from "@/services/api";
import { Search, PlusCircle } from "lucide-react";
// 🛠️ Fixed: Used type-only imports for standard compliance
import type { Order, Product } from "@/types";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";

// Components
import { AddOrderModal } from "@/components/orders/AddOrderModal";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";
import { ConfirmationModal } from "@/components/orders/ConfirmationModal";
import { OrderTable } from "@/components/orders/OrderTable";

const OrdersPage: React.FC = () => {
  // --- 1. STATE MANAGEMENT ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 2. DATA FETCHING ---
  const fetchOrders = async () => {
    try {
      // 🛠️ Fixed: Use orderService
      const res = await orderService.getOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to sync orders:", err);
    }
  };

  // Real-time synchronization hook
  useRealTimeSync(fetchOrders);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 🛠️ Fixed: Use modular services in parallel
        const [ordersRes, productsRes] = await Promise.all([
          orderService.getOrders(),
          inventoryService.getProducts(),
        ]);
        setOrders(ordersRes.data || []);
        setProducts(productsRes.data || []);
      } catch (err) {
        console.error("Fetch data error:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 3. SEARCH & FILTER LOGIC ---
  const filteredOrders = orders.filter((o) => {
    const search = searchTerm.toLowerCase();
    return (
      (o.customer_name || "").toLowerCase().includes(search) ||
      (o.customer_email || "").toLowerCase().includes(search) ||
      o.id?.toString().includes(search)
    );
  });

  // --- 4. ACTION HANDLERS ---
  const handleOrderAdded = (newOrder: Order) =>
    setOrders([newOrder, ...orders]);

  const handleOrderUpdated = (updatedOrder: Order) =>
    setOrders(orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      // 🛠️ Fixed: Use orderService
      await orderService.deleteOrder(orderToDelete.id);
      setOrders(orders.filter((o) => o.id !== orderToDelete.id));
      setIsConfirmModalOpen(false);
    } catch (err) {
      console.error("Delete order error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* MODALS */}
      <AddOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onOrderAdded={handleOrderAdded}
        products={products}
        onProductAdded={(p) => setProducts((prev) => [p, ...prev])}
      />

      <EditOrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        order={editingOrder}
        onOrderUpdated={handleOrderUpdated}
      />

      <OrderDetailsModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        order={viewingOrder}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete Order #${orderToDelete?.id}? This action cannot be undone.`}
        loading={isDeleting}
      />

      {/* PAGE UI */}
      <div
        className="
          rounded-xl shadow-sm p-6 border
          bg-white border-gray-200
          dark:bg-zinc-900 dark:border-zinc-800
          text-gray-900 dark:text-white
          transition-colors duration-300
        "
      >
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Order Management
            </h1>
            <p className="text-sm font-bold text-gray-600 dark:text-zinc-400">
              Track and manage customer orders and fulfillment status
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="
              w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg shadow-sm font-bold transition-all active:scale-95
              bg-blue-600 hover:bg-blue-700 text-white
              dark:bg-blue-500 dark:hover:bg-blue-600
            "
          >
            <PlusCircle size={18} />
            Add Order
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-zinc-500" />

            <input
              type="text"
              placeholder="Search by ID, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg border font-bold outline-none transition-all
                bg-gray-50 border-gray-200 text-gray-900
                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                dark:bg-zinc-800 dark:border-zinc-700 dark:text-white
              "
            />
          </div>
        </div>

        {/* TABLE SECTION */}
        <OrderTable
          loading={loading}
          error={error}
          orders={filteredOrders}
          onView={(o) => setViewingOrder(o)}
          onEdit={(o) => {
            setEditingOrder(o);
            setIsEditModalOpen(true);
          }}
          onDelete={(o) => {
            setOrderToDelete(o);
            setIsConfirmModalOpen(true);
          }}
        />
      </div>
    </>
  );
};

export default OrdersPage;
