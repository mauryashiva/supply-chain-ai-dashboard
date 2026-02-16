import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getProducts, deleteProduct } from "@/services/api";
import { PlusCircle, Search } from "lucide-react";
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const { refreshKey } = useOutletContext<OutletContextType>();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await getProducts();
        setProducts(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [refreshKey]);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category &&
        product.category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleProductAdded = (newProduct: Product) => {
    setProducts((prev) =>
      [newProduct, ...prev].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setIsAddModalOpen(false);
  };

  const handleProductUpdated = (updated: Product) => {
    setProducts((prev) =>
      prev
        .map((p) => (p.id === updated.id ? updated : p))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    setIsEditModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setIsConfirmModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Modals */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductAdded={handleProductAdded}
      />

      {editingProduct && (
        <EditItemModal
          product={editingProduct}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onProductUpdated={handleProductUpdated}
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

      {/* Page */}
      <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 border border-gray-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Inventory Management
            </h1>
            <p className="text-sm font-bold text-gray-600">
              Track and manage product stock levels
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-sm transition"
          >
            <PlusCircle size={18} />
            Add New Item
          </button>
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="search"
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 font-bold text-gray-600 flex justify-center items-center gap-3">
            <svg
              className="animate-spin h-6 w-6 text-blue-600"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="opacity-25"
              />
              <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5 0 0 5 0 12h4z"
                className="opacity-75"
              />
            </svg>
            Loading inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 font-bold text-gray-600 bg-gray-50 rounded-lg">
            {searchTerm
              ? `No products found for "${searchTerm}"`
              : "No products found. Add a new item."}
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
