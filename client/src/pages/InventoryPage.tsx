import React, { useEffect, useState } from "react";
// Import hook to access context from the parent layout (DashboardLayout)
import { useOutletContext } from "react-router-dom";
// Import API functions for products
import { getProducts, deleteProduct } from "@/services/api";
import { PlusCircle, Search } from "lucide-react";
import type { Product } from "@/types";

// Import all necessary modal and table components
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AddItemModal } from "@/components/inventory/AddItemModal";
import { EditItemModal } from "@/components/inventory/EditItemModal";
import { ConfirmationModal } from "@/components/inventory/ConfirmationModal";
import { ProductDetailsModal } from "@/components/inventory/ProductDetailsModal";

// Define the shape of the context provided by the parent <Outlet>
type OutletContextType = {
  refreshKey: number; // A number that changes to signal a refresh
};

const InventoryPage: React.FC = () => {
  // State for the main list of products
  const [products, setProducts] = useState<Product[]>([]);
  // State to manage loading indicators
  const [loading, setLoading] = useState(true);
  // State for the search filter
  const [searchTerm, setSearchTerm] = useState("");

  // State to manage the visibility of all modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); // Product being edited
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null); // Product marked for deletion
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete confirmation
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null); // Product being viewed

  // Get the refreshKey from the DashboardLayout context
  const { refreshKey } = useOutletContext<OutletContextType>();

  // Effect to fetch products. This effect re-runs whenever 'refreshKey' changes.
  // This allows other components (like SettingsModal) to trigger a data refresh here.
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true); // Show loading spinner on refresh
      try {
        console.log("Fetching products due to refresh key change:", refreshKey); // Optional: Debug log
        const response = await getProducts();
        setProducts(response.data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [refreshKey]); // Dependency array: re-fetches when refreshKey changes

  // Memoized filtering of products based on the search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category &&
        product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- Event Handlers ---

  // Callback for when a new product is successfully added via the modal
  const handleProductAdded = (newProduct: Product) => {
    // Add the new product to the state and re-sort the list
    setProducts((prevProducts) =>
      [newProduct, ...prevProducts].sort((a, b) => a.name.localeCompare(b.name))
    );
    setIsAddModalOpen(false); // Close modal
  };

  // Opens the Edit modal with the selected product's data
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  // Callback for when a product is successfully updated
  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts(
      (prevProducts) =>
        prevProducts
          .map((p) => (p.id === updatedProduct.id ? updatedProduct : p)) // Replace the old product with the updated one
          .sort((a, b) => a.name.localeCompare(b.name)) // Re-sort
    );
    setIsEditModalOpen(false); // Close modal
  };

  // Opens the confirmation modal for deletion
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsConfirmModalOpen(true);
  };

  // Opens the view details modal
  const handleViewClick = (product: Product) => {
    setViewingProduct(product);
  };

  // Handles the actual delete operation after confirmation
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true); // Show loading state on confirm button
    try {
      await deleteProduct(productToDelete.id);
      // Remove the deleted product from the state
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p.id !== productToDelete.id)
      );
      setIsConfirmModalOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Could not delete the product. Please try again."); // Simple error feedback
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* --- Modals Section --- */}
      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductAdded={handleProductAdded}
      />

      {/* Edit Item Modal (Rendered only when editingProduct is set) */}
      {editingProduct && (
        <EditItemModal
          product={editingProduct}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null); // Clear product on close
          }}
          onProductUpdated={handleProductUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Item Deletion"
        message={`Are you sure you want to permanently delete "${productToDelete?.name}" (SKU: ${productToDelete?.sku})? This action cannot be undone.`}
        loading={isDeleting}
      />

      {/* View Details Modal (Rendered only when viewingProduct is set) */}
      {viewingProduct && (
        <ProductDetailsModal
          isOpen={!!viewingProduct}
          onClose={() => setViewingProduct(null)}
          product={viewingProduct}
        />
      )}

      {/* --- Main Page Content --- */}
      <div className="bg-zinc-900 rounded-lg shadow-lg p-4 sm:p-6 border border-zinc-800">
        {/* Header with Title and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Inventory Management
            </h1>
            <p className="text-sm text-zinc-400">
              Track and manage product stock levels.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            <PlusCircle size={18} />
            <span>Add New Item</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
        </div>

        {/* --- Table Section (Conditional Rendering) --- */}
        {loading ? (
          // Loading State
          <div className="text-center py-12 text-zinc-400 flex justify-center items-center gap-3">
            <svg
              className="animate-spin h-6 w-6 text-cyan-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          // Empty State (differentiates between no search results and no data)
          <div className="text-center py-12 text-zinc-500 bg-zinc-800/50 rounded-lg">
            {searchTerm
              ? `No products found matching "${searchTerm}".`
              : "No products found. Add a new item to get started."}
          </div>
        ) : (
          // Data Table
          <InventoryTable
            products={filteredProducts}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onView={handleViewClick}
          />
        )}
      </div>
    </>
  );
};

export default InventoryPage;
