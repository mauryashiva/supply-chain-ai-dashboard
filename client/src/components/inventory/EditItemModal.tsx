import React, { useState, useEffect, type FormEvent } from "react";
import { Sparkles, Plus, Minus } from "lucide-react";
// --- 🛠️ Fixed: Centralized API Services ---
import { inventoryService, aiService, settingsService } from "@/services/api";
// --- 🛠️ Fixed: Type-only imports ---
import type { Product, ProductUpdate, MediaItem, ProductStatus } from "@/types";
// --- Child Components ---
import { ImageUploader } from "@/components/common/ImageUploader";
import { ModalLayout } from "@/layouts/ModalLayout";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: (updatedProduct: Product) => void;
  product: Product | null;
}

type NumericValue = number | "";

type EditFormData = Omit<
  ProductUpdate,
  | "stock_quantity"
  | "reorder_level"
  | "cost_price"
  | "selling_price"
  | "gst_rate"
> & {
  stock_quantity?: NumericValue;
  reorder_level?: NumericValue;
  cost_price?: NumericValue;
  selling_price?: NumericValue;
  gst_rate?: NumericValue;
};

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  onProductUpdated,
  product,
}) => {
  const [formData, setFormData] = useState<EditFormData>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name,
        sku: product.sku,
        stock_quantity: product.stock_quantity,
        status: product.status,
        category: product.category,
        supplier: product.supplier,
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        reorder_level: product.reorder_level,
        description: product.description,
        images: product.images,
        last_restocked: product.last_restocked,
        gst_rate: product.gst_rate,
      });
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
  }, [product, isOpen]);

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

    if (numberFields.includes(name)) {
      const numericValue = value === "" ? "" : parseFloat(value);
      if (isNaN(numericValue as number)) return;

      const newFormData = { ...formData, [name]: numericValue };

      if (name === "stock_quantity") {
        const stock = Number(numericValue) || 0;
        const lowStockThreshold =
          parseInt(settings["LOW_STOCK_THRESHOLD"], 10) || 10;
        let newStatus: ProductStatus = "In Stock";
        if (stock <= 0) newStatus = "Out of Stock";
        else if (stock <= lowStockThreshold) newStatus = "Low Stock";
        newFormData.status = newStatus;
      }
      setFormData(newFormData);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleStepChange = (fieldName: keyof EditFormData, amount: number) => {
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
      alert(
        "Please ensure the Product Name is filled to generate a description.",
      );
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      // 🛠️ Fixed: Using centralized aiService
      const response = await aiService.generateDescription(
        formData.name || "",
        formData.category || "",
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
    if (!product) return;
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
      const response = await inventoryService.updateProduct(
        product.id,
        payload,
      );
      onProductUpdated(response.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  // Premium Adaptive Input Styles
  const inputStyles =
    "w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl pl-3 pr-10 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all duration-200";

  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Item: ${product.name}`}
      size="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {/* Left Column */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                required
                className={`${inputStyles} !pr-3`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku || ""}
                onChange={handleChange}
                required
                className={`${inputStyles} !pr-3`}
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
                className={`${inputStyles} !pr-3`}
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
                className={`${inputStyles} !pr-3`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
                Status (Auto)
              </label>
              <select
                name="status"
                value={formData.status || ""}
                disabled
                className={`${inputStyles} !pr-3 bg-gray-100 dark:bg-zinc-800 opacity-80 cursor-not-allowed`}
              >
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Right Column (Numeric Fields) */}
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
                    value={(formData as any)[field.name] ?? ""}
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
                    <div className="w-[1px] h-4 bg-gray-200 dark:bg-zinc-700" />
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

        {/* AI Description & Images */}
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
              placeholder="Refine product details..."
              className={`${inputStyles} !pr-3 resize-none`}
            />
          </div>
          <div className="bg-gray-50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
            <ImageUploader
              onUploadSuccess={handleMediaUploadSuccess}
              initialMedia={product.images}
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
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalLayout>
  );
};
