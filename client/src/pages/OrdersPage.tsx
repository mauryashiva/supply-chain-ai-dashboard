// client/src/pages/OrdersPage.tsx

import React, { useEffect, useState, type FormEvent } from "react";
import {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
} from "@/services/api";
import {
  Search,
  PlusCircle,
  X,
  Trash2,
  Edit,
  AlertTriangle, // Naya icon import kiya gaya
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus, OrderCreate } from "@/types";

// --- ADD ORDER MODAL COMPONENT (UPDATED FOR BETTER UX) ---
interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderAdded: (newOrder: Order) => void;
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderAdded,
}) => {
  // UPDATE: Humne amount ko shuruaat mein empty string ('') kar diya hai
  const [formData, setFormData] = useState({
    customer_name: "",
    amount: "" as number | string, // amount ab string bhi ho sakta hai
    shipping_address: "",
    status: "Pending" as OrderStatus,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // UPDATE: Humne handleChange ko simple kar diya hai.
  // Yeh ab amount ko string ki tarah hi save karega, jisse user use mita sakta hai.
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // UPDATE: Bhejne se pehle, hum amount ko dobara number mein badal denge.
      const payload: OrderCreate = {
        ...formData,
        amount: parseFloat(String(formData.amount)) || 0,
      };

      const response = await createOrder(payload);
      onOrderAdded(response.data);
      onClose();
      // UPDATE: Form reset karte waqt bhi amount ko empty string rakhein
      setFormData({
        customer_name: "",
        amount: "",
        shipping_address: "",
        status: "Pending",
      });
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to create order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-zinc-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Add New Order</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              required
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              placeholder="e.g., 199.99"
              min="0"
              step="0.01"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Shipping Address
            </label>
            <input
              type="text"
              name="shipping_address"
              value={formData.shipping_address}
              onChange={handleChange}
              required
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- [NEW] Confirmation Modal Component ---
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-sm relative border border-zinc-700 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-zinc-400 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Deleting..." : "Delete Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Helper Component ---
const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const statusMap: Record<OrderStatus, string> = {
    Delivered: "bg-green-500/10 text-green-400 border border-green-500/20",
    Shipped: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Pending: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    Cancelled: "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  return (
    <span
      className={cn(
        "px-2 py-1 text-xs font-medium rounded-full",
        statusMap[status]
      )}
    >
      {status}
    </span>
  );
};

// --- MAIN ORDERS PAGE COMPONENT ---
const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  // --- [NEW] State for confirmation modal ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await getOrders();
        setOrders(response.data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(
    (order) =>
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm)
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const handleOrderAdded = (newOrder: Order) =>
    setOrders([newOrder, ...orders]);

  const handleStatusChange = async (
    orderId: number,
    newStatus: OrderStatus
  ) => {
    try {
      const response = await updateOrder(orderId, { status: newStatus });
      setOrders(orders.map((o) => (o.id === orderId ? response.data : o)));
      setEditingOrderId(null);
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Could not update order status. Please try again.");
    }
  };

  // --- [UPDATED] Step 1: Open confirmation modal ---
  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setIsConfirmModalOpen(true);
  };

  // --- [UPDATED] Step 2: Handle the actual deletion after confirmation ---
  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);
    try {
      await deleteOrder(orderToDelete.id);
      setOrders(orders.filter((o) => o.id !== orderToDelete.id));
      setIsConfirmModalOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error("Failed to delete order:", error);
      alert("Could not delete the order. Please try again.");
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
      />
      {/* --- [NEW] Render the Confirmation Modal --- */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Order Deletion"
        message={`Are you sure you want to delete Order #${orderToDelete?.id}? This action cannot be undone.`}
        loading={isDeleting}
      />

      <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Order Management</h1>
            <p className="text-sm text-zinc-400">
              Track and manage all customer orders.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            <PlusCircle size={18} />
            <span>Add New Order</span>
          </button>
        </div>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-400">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-cyan-400">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {formatCurrency(order.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editingOrderId === order.id ? (
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(
                              order.id,
                              e.target.value as OrderStatus
                            )
                          }
                          onBlur={() => setEditingOrderId(null)}
                          autoFocus
                          className="bg-zinc-800 border-zinc-700 text-zinc-300 rounded-md p-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <StatusBadge status={order.status} />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button
                        onClick={() => setEditingOrderId(order.id)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit Status"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        // --- [UPDATED] OnClick ab naye function ko call karta hai ---
                        onClick={() => handleDeleteClick(order)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default OrdersPage;
