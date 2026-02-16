import React, { useEffect, useState } from "react";
import { getOrders, getProducts, deleteOrder } from "@/services/api";
import { Search, PlusCircle } from "lucide-react";
import type { Order, Product } from "@/types";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";

import { AddOrderModal } from "@/components/orders/AddOrderModal";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";
import { ConfirmationModal } from "@/components/orders/ConfirmationModal";
import { OrderTable } from "@/components/orders/OrderTable";

const OrdersPage: React.FC = () => {
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

  const fetchOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useRealTimeSync(fetchOrders);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ordersRes, productsRes] = await Promise.all([
          getOrders(),
          getProducts(),
        ]);
        setOrders(ordersRes.data || []);
        setProducts(productsRes.data || []);
      } catch {
        setError("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const search = searchTerm.toLowerCase();
    return (
      (o.customer_name || "").toLowerCase().includes(search) ||
      (o.customer_email || "").toLowerCase().includes(search) ||
      o.id?.toString().includes(search)
    );
  });

  const handleOrderAdded = (newOrder: Order) =>
    setOrders([newOrder, ...orders]);

  const handleOrderUpdated = (updatedOrder: Order) =>
    setOrders(orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await deleteOrder(orderToDelete.id);
      setOrders(orders.filter((o) => o.id !== orderToDelete.id));
      setIsConfirmModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
        message={`Delete Order #${orderToDelete?.id}?`}
        loading={isDeleting}
      />

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order Management
            </h1>
            <p className="text-sm font-bold text-gray-600">
              Track and manage customer orders
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg shadow-sm transition"
          >
            <PlusCircle size={18} />
            Add Order
          </button>
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search order id, name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

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
