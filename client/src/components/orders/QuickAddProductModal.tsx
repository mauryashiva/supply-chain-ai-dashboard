import React, { useState, useEffect, type FormEvent } from "react";
// 🛠️ Fixed: Use centralized service objects and import type for strict modular syntax
import type {
  Product,
  ProductCreate,
  ProductStatus,
  AppSetting,
} from "@/types";
import { inventoryService, settingsService } from "@/services/api";

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

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({ ...prev, name: initialProductName }));

      const fetchSettings = async () => {
        try {
          // 🛠️ Fixed: Use settingsService instead of standalone getSettings
          const response = await settingsService.getSettings();

          // 🛠️ Fixed: Added explicit types (acc: Record<string, string>, setting: AppSetting)
          // to solve "Implicit Any" errors.
          const settingsMap = response.data.reduce(
            (acc: Record<string, string>, setting: AppSetting) => {
              acc[setting.setting_key] = setting.setting_value;
              return acc;
            },
            {},
          );
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
      const finalFormData = { ...formData };

      // Ensure status is set based on stock if not explicitly changed
      if (!finalFormData.status) {
        const stock = finalFormData.stock_quantity || 0;
        const lowStockThreshold =
          parseInt(settings["LOW_STOCK_THRESHOLD"], 10) || 10;

        if (stock <= 0) finalFormData.status = "Out of Stock";
        else if (stock <= lowStockThreshold) finalFormData.status = "Low Stock";
        else finalFormData.status = "In Stock";
      }

      // 🛠️ Fixed: Use inventoryService.createProduct instead of standalone createProduct
      const response = await inventoryService.createProduct(
        finalFormData as ProductCreate,
      );
      const newProduct = response.data;

      onProductAdded(newProduct);
      setSelectedProductId(String(newProduct.id));
      onClose();

      // Reset form local state for next use
      setFormData({
        name: "",
        stock_quantity: 0,
        cost_price: 0,
        selling_price: 0,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Adaptive Input Styles
  const inputStyles =
    "w-full mt-1 rounded-lg px-3 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-6 transition-colors">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
          Quick Add Product
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Product Name *
            </label>
            <input
              name="name"
              type="text"
              value={formData.name || ""}
              onChange={handleChange}
              required
              className={inputStyles}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              SKU *
            </label>
            <input
              name="sku"
              type="text"
              value={formData.sku || ""}
              onChange={handleChange}
              required
              className={inputStyles}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                Stock *
              </label>
              <input
                name="stock_quantity"
                type="number"
                value={formData.stock_quantity || 0}
                onChange={handleChange}
                min="0"
                required
                className={inputStyles}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                Cost (₹)
              </label>
              <input
                name="cost_price"
                type="number"
                value={formData.cost_price || 0}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={inputStyles}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                Selling (₹)
              </label>
              <input
                name="selling_price"
                type="number"
                value={formData.selling_price || 0}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={inputStyles}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg p-2">
              <p className="text-red-600 dark:text-red-400 text-xs font-semibold text-center">
                {error}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-900 dark:text-white font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create & Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
