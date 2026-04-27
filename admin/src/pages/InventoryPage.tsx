import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { PlusCircle, Search } from "lucide-react";
// 🛠️ Matches your modular services and new hook
import { inventoryService } from "@/services/api";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types";

import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AddItemModal } from "@/components/inventory/AddItemModal";
import { EditItemModal } from "@/components/inventory/EditItemModal";
import { ConfirmationModal } from "@/components/inventory/ConfirmationModal";
import { ProductDetailsModal } from "@/components/inventory/ProductDetailsModal";

type OutletContextType = {
  refreshKey: number;
};

const InventoryPage: React.FC = () => {
  const { refreshKey } = useOutletContext<OutletContextType>();
  const [searchTerm, setSearchTerm] = useState("");

  // --- 1. USE CUSTOM HOOK ---
  const {
    products,
    loading,
    addProductLocally,
    updateProductLocally,
    removeProductLocally,
  } = useProducts(refreshKey);

  // --- 2. MODAL STATES ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // --- 3. UI HANDLERS ---
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category &&
        product.category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await inventoryService.deleteProduct(productToDelete.id);
      removeProductLocally(productToDelete.id);
      setIsConfirmModalOpen(false);
    } catch (error) {
      console.error("Failed to delete product:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductAdded={addProductLocally}
      />

      {editingProduct && (
        <EditItemModal
          product={editingProduct}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onProductUpdated={updateProductLocally}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Item Deletion"
        message={`Delete "${productToDelete?.name}" (SKU: ${productToDelete?.sku})?`}
        loading={isDeleting}
      />

      {viewingProduct && (
        <ProductDetailsModal
          isOpen={!!viewingProduct}
          onClose={() => setViewingProduct(null)}
          product={viewingProduct}
        />
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-5 sm:p-6 border border-gray-200 dark:border-zinc-800 transition-colors duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Inventory Management
            </h1>
            <p className="text-sm font-bold text-gray-600 dark:text-zinc-400">
              Track and manage product stock levels
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all active:scale-95"
          >
            <PlusCircle size={18} />
            Add New Item
          </button>
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-zinc-500" />
            <input
              type="search"
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 font-bold text-gray-600 dark:text-zinc-400 flex justify-center items-center gap-3">
            <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full" />
            Loading inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 font-bold text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-zinc-700">
            {searchTerm
              ? `No products found for "${searchTerm}"`
              : "No products found. Add a new item to get started."}
          </div>
        ) : (
          <InventoryTable
            products={filteredProducts}
            onEdit={(p) => {
              setEditingProduct(p);
              setIsEditModalOpen(true);
            }}
            onDelete={(p) => {
              setProductToDelete(p);
              setIsConfirmModalOpen(true);
            }}
            onView={(p) => setViewingProduct(p)}
          />
        )}
      </div>
    </>
  );
};

export default InventoryPage;
