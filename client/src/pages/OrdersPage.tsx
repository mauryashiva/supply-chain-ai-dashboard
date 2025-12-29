import React, { useEffect, useState } from "react";
// Import API functions
import { getOrders, getProducts, deleteOrder } from "@/services/api";
import { Search, PlusCircle } from "lucide-react";
import type { Order, Product } from "@/types";

// Import all modal and table components related to Orders
import { AddOrderModal } from "@/components/orders/AddOrderModal";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";
import { ConfirmationModal } from "@/components/orders/ConfirmationModal";
import { OrderTable } from "@/components/orders/OrderTable";

/**
 * This is the main container component for the Orders page.
 * It's responsible for fetching data, managing state, and connecting
 * all child components (like Modals and the Table).
 */
const OrdersPage: React.FC = () => {
  // State for the list of orders
  const [orders, setOrders] = useState<Order[]>([]);
  // State for the list of products (needed for the Add Order modal)
  const [products, setProducts] = useState<Product[]>([]);
  // State for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for the search filter
  const [searchTerm, setSearchTerm] = useState("");

  // States for managing all modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null); // Order being viewed in details modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null); // Order marked for deletion
  const [editingOrder, setEditingOrder] = useState<Order | null>(null); // Order being edited
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete confirmation

  // Effect to fetch initial data (orders and products) on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch orders and products in parallel for efficiency
        const [ordersRes, productsRes] = await Promise.all([
          getOrders(),
          getProducts(),
        ]);
        setOrders(ordersRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Could not fetch order data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Filter orders based on the search term (checks customer name and order ID)
  const filteredOrders = orders.filter(
    (o) =>
      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toString().includes(searchTerm)
  );

  // --- Handlers for Child Components ---

  // Adds a new order to the top of the list when created
  const handleOrderAdded = (newOrder: Order) =>
    setOrders([newOrder, ...orders]);

  // Updates an existing order in the list
  const handleOrderUpdated = (updatedOrder: Order) =>
    setOrders(orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));

  // Opens the view details modal
  const handleViewClick = (order: Order) => {
    setViewingOrder(order);
  };

  // Opens the edit modal
  const handleEditClick = (order: Order) => {
    setEditingOrder(order);
    setIsEditModalOpen(true);
  };

  // Opens the delete confirmation modal
  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setIsConfirmModalOpen(true);
  };

  // Handles the actual delete after confirmation
  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await deleteOrder(orderToDelete.id);
      // Remove the deleted order from the local state
      setOrders(orders.filter((o) => o.id !== orderToDelete.id));
      setIsConfirmModalOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error("Failed to delete order:", error);
      // You could set an error state here
    } finally {
      setIsDeleting(false);
    }
  };

  // This function adds a new product (created via the QuickAdd modal) to the main products list
  const handleProductAdded = (newProduct: Product) => {
    setProducts((prevProducts) => [newProduct, ...prevProducts]);
  };

  return (
    <>
      {/* --- Modals Section --- */}
      {/* Add Order Modal: Passes down the product list and handlers */}
      <AddOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onOrderAdded={handleOrderAdded}
        products={products}
        onProductAdded={handleProductAdded} // Pass down the product add handler
      />
      {/* Edit Order Modal */}
      <EditOrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        order={editingOrder}
        onOrderUpdated={handleOrderUpdated}
      />
      {/* View Order Details Modal */}
      <OrderDetailsModal
        isOpen={!!viewingOrder} // Open if viewingOrder is not null
        onClose={() => setViewingOrder(null)}
        order={viewingOrder}
      />
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete Order #${orderToDelete?.id}? This action cannot be undone.`}
        loading={isDeleting}
      />

      {/* --- Main Page Content --- */}
      <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Order Management</h1>
            <p className="text-sm text-zinc-400">
              Track and manage all customer orders as per the blueprint.
            </p>
          </div>
          {/* Add New Order Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            <PlusCircle size={18} />
            <span>Add New Order</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Order Table: Displays the filtered orders */}
        <OrderTable
          loading={loading}
          error={error}
          orders={filteredOrders}
          onView={handleViewClick}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </div>
    </>
  );
};

export default OrdersPage;
