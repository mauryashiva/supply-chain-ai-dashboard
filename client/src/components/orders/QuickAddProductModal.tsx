import React, { useState, useEffect, type FormEvent } from "react";
import type { Product, ProductCreate, ProductStatus } from "@/types";
import { createProduct, getSettings } from "@/services/api";

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (newProduct: Product) => void;
  setSelectedProductId: (id: string) => void;
  initialProductName?: string;
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  setSelectedProductId,
  initialProductName = "",
}) => {
  const [formData, setFormData] = useState<Partial<ProductCreate>>({
    name: initialProductName,
    stock_quantity: 0,
    cost_price: 0,
    selling_price: 0,
  });
  const [settings, setSettings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Form ko initial product name se set karein
      setFormData((prev) => ({ ...prev, name: initialProductName }));

      // Settings fetch karein
      const fetchSettings = async () => {
        try {
          const response = await getSettings();
          const settingsMap = response.data.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
          }, {} as { [key: string]: string });
          setSettings(settingsMap);
        } catch (error) {
          console.error("Failed to fetch settings:", error);
        }
      };
      fetchSettings();
    }
  }, [isOpen, initialProductName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isNumberField = [
      "stock_quantity",
      "cost_price",
      "selling_price",
    ].includes(name);

    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]: isNumberField ? parseFloat(value) || 0 : value,
      };

      // Stock quantity change hone par status automatically update karein
      if (name === "stock_quantity") {
        const stock = parseInt(value, 10) || 0;
        const lowStockThreshold =
          parseInt(settings["LOW_STOCK_THRESHOLD"], 10) || 10;

        let newStatus: ProductStatus = "In Stock";
        if (stock <= 0) newStatus = "Out of Stock";
        else if (stock <= lowStockThreshold) newStatus = "Low Stock";

        updatedData.status = newStatus;
      }
      return updatedData;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      setError("Product Name and SKU are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Ensure status is set if it wasn't already
      const finalFormData = { ...formData };
      if (!finalFormData.status) {
        const stock = finalFormData.stock_quantity || 0;
        const lowStockThreshold =
          parseInt(settings["LOW_STOCK_THRESHOLD"], 10) || 10;
        if (stock <= 0) finalFormData.status = "Out of Stock";
        else if (stock <= lowStockThreshold) finalFormData.status = "Low Stock";
        else finalFormData.status = "In Stock";
      }

      const response = await createProduct(finalFormData as ProductCreate);
      const newProduct = response.data;

      onProductAdded(newProduct);
      setSelectedProductId(String(newProduct.id));
      onClose();
      alert(`Product "${newProduct.name}" created successfully!`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex justify-center items-center p-4">
      <div className="bg-zinc-800 p-6 rounded-lg w-full max-w-md border border-zinc-600">
        <h3 className="text-lg font-bold mb-4">Quick Add Product</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400">Product Name *</label>
            <input
              name="name"
              type="text"
              value={formData.name || ""}
              onChange={handleChange}
              required
              className="w-full bg-zinc-700 rounded px-3 py-2 mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">SKU *</label>
            <input
              name="sku"
              type="text"
              value={formData.sku || ""}
              onChange={handleChange}
              required
              className="w-full bg-zinc-700 rounded px-3 py-2 mt-1"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-zinc-400">Stock Qty *</label>
              <input
                name="stock_quantity"
                type="number"
                value={formData.stock_quantity || 0}
                onChange={handleChange}
                required
                min="0"
                className="w-full bg-zinc-700 rounded px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Cost Price (₹)</label>
              <input
                name="cost_price"
                type="number"
                value={formData.cost_price || 0}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full bg-zinc-700 rounded px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Selling Price (₹)</label>
              <input
                name="selling_price"
                type="number"
                value={formData.selling_price || 0}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full bg-zinc-700 rounded px-3 py-2 mt-1"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm pt-2 text-center">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-zinc-600 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create & Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
