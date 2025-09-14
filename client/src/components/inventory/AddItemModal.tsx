import React, { useState, useEffect, type FormEvent } from "react";
import { X, Sparkles } from "lucide-react";
// --- Types and API functions ---
import type { Product, ProductCreate, MediaItem, ProductStatus } from "@/types";
import {
  createProduct,
  generateDescription,
  getSettings,
} from "@/services/api";
import { ImageUploader } from "@/components/common/ImageUploader";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (newProduct: Product) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
}) => {
  const [formData, setFormData] = useState<ProductCreate>({
    name: "",
    sku: "",
    stock_quantity: 0,
    status: "In Stock", // Initial status
    category: "",
    supplier: "",
    cost_price: 0,
    selling_price: 0,
    reorder_level: 10,
    description: "",
    images: [],
  });

  // State to store settings
  const [settings, setSettings] = useState<{ [key: string]: string }>({});

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch settings when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        try {
          const response = await getSettings();
          // Convert settings array to an easy-to-use object
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
  }, [isOpen]);

  // Handle form input changes and auto-update status
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Use a temporary variable for the new form data
    let updatedFormData: ProductCreate = { ...formData, [name]: value };

    // If stock_quantity is being changed, update the status automatically
    if (name === "stock_quantity") {
      const stock = parseInt(value, 10) || 0;
      const lowStockThreshold =
        parseInt(settings["LOW_STOCK_THRESHOLD"], 10) || 10;

      let newStatus: ProductStatus = "In Stock";
      if (stock <= 0) {
        newStatus = "Out of Stock";
      } else if (stock <= lowStockThreshold) {
        newStatus = "Low Stock";
      }

      updatedFormData.status = newStatus;
      updatedFormData.stock_quantity = stock;
    } else {
      // Handle other number fields separately to avoid parsing non-numeric values
      const isNumberField = [
        "cost_price",
        "selling_price",
        "reorder_level",
      ].includes(name);

      // This logic was updated to correctly handle non-numeric and numeric fields
      updatedFormData = {
        ...formData,
        [name]: isNumberField ? parseFloat(value) || 0 : value,
      };
    }

    setFormData(updatedFormData);
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
      const response = await generateDescription(
        formData.name,
        formData.category
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
    try {
      // No need to re-calculate status, as handleChange already sets it
      const response = await createProduct(formData);
      onProductAdded(response.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-lg relative border border-zinc-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-6">
          {" "}
          Add New Inventory Item{" "}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-zinc-800 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  className="w-full bg-zinc-800 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-zinc-800 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="w-full bg-zinc-800 rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full bg-zinc-800 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-zinc-800 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Cost Price (₹)
                </label>
                <input
                  type="number"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full bg-zinc-800 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Status (Auto)
                </label>
                <select
                  name="status"
                  value={formData.status}
                  disabled // This field cannot be edited by the user
                  onChange={handleChange}
                  className="w-full bg-zinc-800 rounded px-3 py-2 disabled:opacity-70"
                >
                  <option>In Stock</option>
                  <option>Low Stock</option>
                  <option>Out of Stock</option>
                </select>
              </div>
            </div>
          </div>
          <div className="pt-2 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-zinc-400">
                  AI Generated Description
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating || !formData.name}
                  className="flex items-center gap-1 text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded-md hover:bg-purple-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles size={12} />
                  {isGenerating ? "Generating..." : "Generate with AI"}
                </button>
              </div>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={3}
                placeholder="Click 'Generate with AI' or manually enter a description..."
                className="w-full bg-zinc-800 rounded px-3 py-2"
              />
            </div>
            <div>
              <ImageUploader
                onUploadSuccess={handleMediaUploadSuccess}
                initialMedia={formData.images}
              />
            </div>
          </div>
          {error && (
            <p className="text-red-400 text-sm pt-2 text-center">{error}</p>
          )}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
