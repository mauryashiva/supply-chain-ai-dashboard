import React, { useState } from "react";
// 🛠️ Updated to use the new hook and centralized service
import { orderService } from "@/services/api";
import { useOrders } from "@/hooks/useOrders";
import { Search, PlusCircle } from "lucide-react";
import type { Order } from "@/types";

// Components
import { AddOrderModal } from "@/components/orders/AddOrderModal";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";
import { ConfirmationModal } from "@/components/orders/ConfirmationModal";
import { OrderTable } from "@/components/orders/OrderTable";

const OrdersPage: React.FC = () => {
  // --- 1. DATA HOOK ---
  const {
    orders,
    products,
    loading,
    error,
    addOrderLocally,
    updateOrderLocally,
    removeOrderLocally,
    addProductLocally,
  } = useOrders();

  // --- 2. UI & MODAL STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 3. FILTERING ---
  const filteredOrders = orders.filter((o) => {
    const search = searchTerm.toLowerCase();
    return (
      (o.customer_name || "").toLowerCase().includes(search) ||
      (o.customer_email || "").toLowerCase().includes(search) ||
      o.id?.toString().includes(search)
    );
  });

  // --- 4. ACTION HANDLERS ---
  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await orderService.deleteOrder(orderToDelete.id);
      removeOrderLocally(orderToDelete.id);
      setIsConfirmModalOpen(false);
    } catch (err) {
      console.error("Delete order error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <AddOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onOrderAdded={addOrderLocally}
        products={products}
        onProductAdded={addProductLocally}
      />

      <EditOrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        order={editingOrder}
        onOrderUpdated={updateOrderLocally}
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

      <div className="rounded-xl shadow-sm p-6 border bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 text-gray-900 dark:text-white transition-colors duration-300">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Order Management
            </h1>
            <p className="text-sm font-bold text-gray-600 dark:text-zinc-400">
              Track and manage customer orders
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg shadow-sm font-bold transition-all active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusCircle size={18} />
            Add Order
          </button>
        </div>

        {/* SEARCH */}
        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search by ID, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border font-bold outline-none transition-all bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700"
            />
          </div>
        </div>

        {/* TABLE */}
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
