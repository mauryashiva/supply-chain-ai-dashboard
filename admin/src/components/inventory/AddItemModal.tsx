import React, { useState, useEffect, type FormEvent } from "react";
import { Sparkles, Plus, Minus } from "lucide-react";
// --- 🛠️ Fixed: Centralized API Services ---
import { inventoryService, aiService, settingsService } from "@/services/api";
// --- 🛠️ Fixed: Type-only imports ---
import type { Product, ProductCreate, MediaItem, ProductStatus } from "@/types";
// --- Child Components ---
import { ImageUploader } from "@/components/common/ImageUploader";
import { ModalLayout } from "@/layouts/ModalLayout";

// Define the props accepted by the AddItemModal component
interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (newProduct: Product) => void;
}

// Define the initial state for a new product form
const initialState: ProductCreate = {
  name: "",
  sku: "",
  stock_quantity: 0,
  status: "In Stock",
  category: "",
  supplier: "",
  cost_price: 0,
  selling_price: 0,
  reorder_level: 10,
  description: "",
  images: [],
  gst_rate: 0,
};

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
}) => {
  const [formData, setFormData] = useState<ProductCreate>(initialState);
  const [settings, setSettings] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialState);
      setError(null);

      const fetchSettings = async () => {
        try {
          // 🛠️ Fixed: Using centralized settingsService
          const response = await settingsService.getSettings();
          const settingsMap = response.data.reduce(
            (acc, setting) => {
              acc[setting.setting_key] = setting.setting_value;
              return acc;
            },
            {} as { [key: string]: string },
          );
          setSettings(settingsMap);
        } catch (error) {
          console.error("Failed to fetch settings:", error);
        }
      };
      fetchSettings();
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    const numberFields = [
      "stock_quantity",
      "reorder_level",
      "cost_price",
      "selling_price",
      "gst_rate",
    ];

    const newFormData = { ...formData, [name]: value };

    if (numberFields.includes(name)) {
      const parsedValue = value === "" ? "" : parseFloat(value);
      if (isNaN(parsedValue as number)) return;
      (newFormData as any)[name] = parsedValue;
    }

    if (name === "stock_quantity") {
      const stock = Number(value) || 0;
      const lowStockThreshold =
        parseInt(settings["LOW_STOCK_THRESHOLD"], 10) || 10;

      let newStatus: ProductStatus = "In Stock";
      if (stock <= 0) {
        newStatus = "Out of Stock";
      } else if (stock <= lowStockThreshold) {
        newStatus = "Low Stock";
      }
      newFormData.status = newStatus;
    }

    setFormData(newFormData);
  };

  const handleStepChange = (fieldName: keyof ProductCreate, amount: number) => {
    const currentValue = Number(formData[fieldName]) || 0;
    let newValue = currentValue + amount;
    if (newValue < 0) newValue = 0;
    const syntheticEvent = {
      target: { name: fieldName, value: String(newValue) },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(syntheticEvent);
  };

  const handleMediaUploadSuccess = (mediaItems: MediaItem[]) => {
    setFormData((prev) => ({ ...prev, images: mediaItems }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      alert("Please enter a Product Name first to generate a description.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      // 🛠️ Fixed: Using centralized aiService
      const response = await aiService.generateDescription(
        formData.name,
        formData.category,
      );
      setFormData((prev) => ({
        ...prev,
        description: response.data.description,
      }));
    } catch (err) {
      setError("Failed to generate AI description. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      stock_quantity: Number(formData.stock_quantity) || 0,
      reorder_level: Number(formData.reorder_level) || 0,
      cost_price: Number(formData.cost_price) || 0,
      selling_price: Number(formData.selling_price) || 0,
      gst_rate: Number(formData.gst_rate) || 0,
    };

    try {
      // 🛠️ Fixed: Using centralized inventoryService
      const response = await inventoryService.createProduct(payload);
      onProductAdded(response.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Premium Adaptive Input Styles
  const inputStyles =
    "w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl pl-3 pr-10 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all duration-200";

  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Inventory Item"
      size="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {/* Column 1 */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`${inputStyles} pr-3!`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className={`${inputStyles} pr-3!`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category || ""}
                onChange={handleChange}
                className={`${inputStyles} pr-3!`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
                Supplier
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier || ""}
                onChange={handleChange}
                className={`${inputStyles} pr-3!`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
                Status (Auto)
              </label>
              <select
                name="status"
                value={formData.status}
                disabled
                className={`${inputStyles} pr-3! bg-gray-100 dark:bg-zinc-800 opacity-80 cursor-not-allowed`}
              >
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-5">
            {[
              { label: "Stock Quantity *", name: "stock_quantity" },
              { label: "Reorder Level", name: "reorder_level" },
              { label: "Cost Price (₹)", name: "cost_price", step: "0.01" },
              {
                label: "Selling Price (₹)",
                name: "selling_price",
                step: "0.01",
              },
              { label: "GST Rate (%)", name: "gst_rate", step: "0.01" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
                  {field.label}
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    name={field.name}
                    value={(formData as any)[field.name]}
                    onChange={handleChange}
                    required={field.name === "stock_quantity"}
                    min="0"
                    step={field.step || "1"}
                    className={`${inputStyles} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none group-hover:border-gray-300 dark:group-hover:border-zinc-600`}
                  />
                  <div className="absolute inset-y-0 right-1 flex items-center">
                    <button
                      type="button"
                      onClick={() => handleStepChange(field.name as any, -1)}
                      disabled={Number((formData as any)[field.name]) <= 0}
                      className="p-1.5 text-gray-400 hover:text-cyan-600 dark:hover:text-white transition-colors disabled:opacity-20"
                    >
                      <Minus size={14} />
                    </button>
                    <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700" />
                    <button
                      type="button"
                      onClick={() => handleStepChange(field.name as any, 1)}
                      className="p-1.5 text-gray-400 hover:text-cyan-600 dark:hover:text-white transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI & Description Section */}
        <div className="pt-2 space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                AI Generated Description
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating || !formData.name}
                className="flex items-center gap-2 text-xs font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 disabled:opacity-50 transition-all"
              >
                <Sparkles
                  size={14}
                  className={isGenerating ? "animate-pulse" : ""}
                />
                {isGenerating ? "Analyzing..." : "Generate with AI"}
              </button>
            </div>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
              placeholder="Tell us about the product..."
              className={`${inputStyles} pr-3! resize-none`}
            />
          </div>
          <div className="bg-gray-50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
            <ImageUploader
              onUploadSuccess={handleMediaUploadSuccess}
              initialMedia={formData.images}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-3">
            <p className="text-red-600 dark:text-red-400 text-xs font-semibold text-center">
              {error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Syncing..." : "Create Item"}
          </button>
        </div>
      </form>
    </ModalLayout>
  );
};
