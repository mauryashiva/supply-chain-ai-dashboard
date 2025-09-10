import React, { useState } from "react";
import type { Product, ProductCreate, ProductStatus } from "@/types";
import { createProduct } from "@/services/api";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (newProduct: Product) => void;
  setSelectedProductId: (id: string) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  setSelectedProductId,
}) => {
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductStock, setNewProductStock] = useState<number>(10);
  const [productLoading, setProductLoading] = useState(false);

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 0) {
      setNewProductStock(0);
      return;
    }
    setNewProductStock(value);
  };

  const handleCreateProduct = async () => {
    const nameInput = document.querySelector(
      'input[name="product"]'
    ) as HTMLInputElement;
    const typedProductName = nameInput ? nameInput.value : "";

    if (!typedProductName || !newProductSku) {
      alert("Product Name and SKU are required.");
      return;
    }
    setProductLoading(true);

    // --- FIX: Status ko space ke saath bhejein, underscore ke saath nahi ---
    let status: ProductStatus = "In Stock"; // Changed from In_Stock
    const LOW_STOCK_THRESHOLD = 10;
    if (newProductStock <= 0) {
      status = "Out of Stock"; // Changed from Out_of_Stock
    } else if (newProductStock <= LOW_STOCK_THRESHOLD) {
      status = "Low Stock"; // Changed from Low_Stock
    }

    const payload: ProductCreate = {
      name: typedProductName,
      sku: newProductSku,
      stock_quantity: newProductStock,
      status: status,
    };

    try {
      const response = await createProduct(payload);
      const newProduct = response.data;
      onProductAdded(newProduct);
      setSelectedProductId(String(newProduct.id));
      onClose();
      alert(`Product "${newProduct.name}" created successfully!`);
    } catch (err: any) {
      let errorMessage = "Failed to create product. Please try again.";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          const firstError = err.response.data.detail[0];
          errorMessage = `Error in '${firstError.loc[1]}': ${firstError.msg}`;
        }
      }
      alert(errorMessage);
    } finally {
      setProductLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex justify-center items-center p-4">
      <div className="bg-zinc-800 p-6 rounded-lg w-full max-w-sm border border-zinc-600">
        <h3 className="text-lg font-bold mb-4">Create New Product</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400">Product Name</label>
            <input
              type="text"
              disabled
              value={
                (
                  document.querySelector(
                    'input[name="product"]'
                  ) as HTMLInputElement
                )?.value || ""
              }
              className="w-full bg-zinc-700 border-zinc-600 rounded-lg px-3 py-2 mt-1 disabled:opacity-70"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Product SKU *</label>
            <input
              type="text"
              placeholder="e.g., PROD-001"
              value={newProductSku}
              onChange={(e) => setNewProductSku(e.target.value.toUpperCase())}
              className="w-full bg-zinc-700 border-zinc-600 rounded-lg px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">
              Initial Stock Quantity *
            </label>
            <input
              type="number"
              placeholder="e.g., 10"
              value={newProductStock}
              onChange={handleStockChange}
              min="0"
              className="w-full bg-zinc-700 border-zinc-600 rounded-lg px-3 py-2 mt-1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={productLoading}
            className="bg-zinc-600 px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateProduct}
            disabled={productLoading}
            className="bg-cyan-600 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {productLoading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};