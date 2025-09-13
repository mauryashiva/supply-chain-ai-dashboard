import React, { useState, useEffect, type FormEvent } from "react";
import { X, Sparkles } from "lucide-react";
// --- CHANGE 1: Naye 'MediaItem' type ko import karein ---
import type { Product, ProductUpdate, MediaItem } from "@/types";
import { updateProduct, generateDescription } from "@/services/api";
import { ImageUploader } from "@/components/common/ImageUploader";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: (updatedProduct: Product) => void;
  product: Product | null;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  onProductUpdated,
  product,
}) => {
  // formData state ab 'images' array ko handle karega
  const [formData, setFormData] = useState<ProductUpdate>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (product) {
      // formData ko product ki current details se bhar dein
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
        // --- CHANGE 2: 'image_url' ki jagah 'images' array ---
        images: product.images,
        last_restocked: product.last_restocked,
      });
      setError(null);
    }
  }, [product]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const isNumberField = [
      "stock_quantity",
      "cost_price",
      "selling_price",
      "reorder_level",
    ].includes(name);
    setFormData({
      ...formData,
      [name]: isNumberField ? parseFloat(value) || 0 : value,
    });
  };

  // --- CHANGE 3: Handler ab MediaItem ki list lega ---
  const handleMediaUploadSuccess = (mediaItems: MediaItem[]) => {
    setFormData((prev) => ({ ...prev, images: mediaItems }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      alert(
        "Please ensure the Product Name is filled to generate a description."
      );
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
    if (!product) return;
    setLoading(true);
    setError(null);
    try {
      const response = await updateProduct(product.id, formData);
      onProductUpdated(response.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

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
          Edit Item: {product.name}{" "}
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
                  value={formData.name || ""}
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
                  value={formData.sku || ""}
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
                  value={formData.category || ""}
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
                  value={formData.supplier || ""}
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
                  value={formData.stock_quantity || 0}
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
                  value={formData.reorder_level || 0}
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
                  value={formData.cost_price || 0}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full bg-zinc-800 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  name="selling_price"
                  value={formData.selling_price || 0}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full bg-zinc-800 rounded px-3 py-2"
                />
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

            {/* --- CHANGE 4: ImageUploader component ka istemaal --- */}
            <div>
              <ImageUploader
                onUploadSuccess={handleMediaUploadSuccess}
                initialMedia={product.images}
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
