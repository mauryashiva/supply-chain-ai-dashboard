import React, { useState, useEffect, type FormEvent } from "react";
import { Sparkles, Plus, Minus } from "lucide-react";
// --- Types and API functions ---
import type { Product, ProductUpdate, MediaItem, ProductStatus } from "@/types";
import {
  updateProduct,
  generateDescription,
  getSettings,
} from "@/services/api";
// --- Child Components ---
import { ImageUploader } from "@/components/common/ImageUploader";
import { ModalLayout } from "@/layouts/ModalLayout";

// Define the props accepted by the EditItemModal component
interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: (updatedProduct: Product) => void;
  product: Product | null; // The product to be edited
}

// A type to allow numeric fields to be temporarily empty ("") in the form state
type NumericValue = number | "";

// Define the shape of the form data for editing
// It's based on ProductUpdate but allows number fields to be empty
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
  gst_rate?: NumericValue; // Added gst_rate to the form
};

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  onProductUpdated,
  product,
}) => {
  // State for the form data
  const [formData, setFormData] = useState<EditFormData>({});
  // State for handling form submission errors
  const [error, setError] = useState<string | null>(null);
  // State to show loading spinner on the submit button
  const [loading, setLoading] = useState(false);
  // State to show loading on the "Generate" button
  const [isGenerating, setIsGenerating] = useState(false);
  // State for storing application settings (like low stock threshold)
  const [settings, setSettings] = useState<{ [key: string]: string }>({});

  // Effect to populate the form when the modal is opened with a product
  useEffect(() => {
    if (product && isOpen) {
      // Set the form data from the product prop
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
        gst_rate: product.gst_rate, // Populate gst_rate
      });
      setError(null); // Clear any previous errors

      // Fetch settings (e.g., for low stock threshold)
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
  }, [product, isOpen]); // Reruns when the product or isOpen state changes

  // A single handler for all form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
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
      // Allow empty string for clearing input, otherwise parse as float
      const numericValue = value === "" ? "" : parseFloat(value);
      if (isNaN(numericValue as number)) {
        return; // Prevent "NaN"
      }
      const newFormData = { ...formData, [name]: numericValue };

      // --- Automatic Status Logic ---
      // Automatically update the product status based on its stock quantity
      if (name === "stock_quantity") {
        const stock = Number(numericValue) || 0;
        // Get the low stock threshold from settings, or default to 10
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
    } else {
      // Handle non-numeric fields
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handles clicks on the '+' and '-' buttons for number inputs
  const handleStepChange = (fieldName: keyof EditFormData, amount: number) => {
    const currentValue = Number(formData[fieldName]) || 0;
    let newValue = currentValue + amount;
    if (newValue < 0) {
      newValue = 0; // Prevent negative numbers
    }
    // Create a synthetic event to reuse the 'handleChange' logic
    const syntheticEvent = {
      target: { name: fieldName, value: String(newValue) },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(syntheticEvent);
  };

  // Callback function for the ImageUploader component
  const handleMediaUploadSuccess = (mediaItems: MediaItem[]) => {
    setFormData((prev) => ({ ...prev, images: mediaItems }));
  };

  // Handles the "Generate with AI" button click
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
      // Call the API to generate a description
      const response = await generateDescription(
        formData.name || "",
        formData.category || ""
      );
      // Update the form state with the generated description
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

  // Handles the final form submission to update the product
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    if (!product) return; // Guard clause if product is null
    setLoading(true);
    setError(null);

    // Prepare the payload, ensuring all numbers are correctly formatted
    const payload = {
      ...formData,
      stock_quantity: Number(formData.stock_quantity) || 0,
      reorder_level: Number(formData.reorder_level) || 0,
      cost_price: Number(formData.cost_price) || 0,
      selling_price: Number(formData.selling_price) || 0,
      gst_rate: Number(formData.gst_rate) || 0, // Include gst_rate in payload
    };

    try {
      // Call the API to update the product
      const response = await updateProduct(product.id, payload);
      onProductUpdated(response.data); // Pass the updated product to the parent
      onClose(); // Close the modal on success
    } catch (err: any) {
      // Display error message from the API response if available
      setError(err.response?.data?.detail || "Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  // If the modal is not open or no product is selected, render nothing
  if (!isOpen || !product) return null;

  // Reusable styles for form inputs
  const inputStyles =
    "w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-3 pr-10 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-shadow";

  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Item: ${product.name}`} // Dynamic title
      size="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form fields are arranged in a 2-column grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {/* Column 1 */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
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
            {/* Status field is auto-calculated and disabled */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Status (Auto)
              </label>
              <select
                name="status"
                value={formData.status || ""}
                disabled
                className={`${inputStyles} !pr-3 disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-5">
            {/* Number input with custom stepper buttons (+/-) */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Stock Quantity *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity ?? ""} // Use ?? "" to handle 0 or empty
                  onChange={handleChange}
                  required
                  min="0"
                  // Hide the default browser number input spinners
                  className={`${inputStyles} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    onClick={() => handleStepChange("stock_quantity", -1)}
                    disabled={Number(formData.stock_quantity) <= 0}
                    className="px-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepChange("stock_quantity", 1)}
                    className="px-2 text-zinc-400 hover:text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            {/* Reorder Level input with steppers */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Reorder Level
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="reorder_level"
                  value={formData.reorder_level ?? ""}
                  onChange={handleChange}
                  min="0"
                  className={`${inputStyles} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    onClick={() => handleStepChange("reorder_level", -1)}
                    disabled={Number(formData.reorder_level) <= 0}
                    className="px-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepChange("reorder_level", 1)}
                    className="px-2 text-zinc-400 hover:text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            {/* Cost Price input with steppers */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Cost Price (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="cost_price"
                  value={formData.cost_price ?? ""}
                  onChange={handleChange}
                  min="0"
                  step="0.01" // Allow decimal values
                  className={`${inputStyles} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    onClick={() => handleStepChange("cost_price", -1)}
                    disabled={Number(formData.cost_price) <= 0}
                    className="px-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepChange("cost_price", 1)}
                    className="px-2 text-zinc-400 hover:text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            {/* Selling Price input with steppers */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Selling Price (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="selling_price"
                  value={formData.selling_price ?? ""}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`${inputStyles} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    onClick={() => handleStepChange("selling_price", -1)}
                    disabled={Number(formData.selling_price) <= 0}
                    className="px-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepChange("selling_price", 1)}
                    className="px-2 text-zinc-400 hover:text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            {/* GST Rate input with steppers */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                GST Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="gst_rate"
                  value={formData.gst_rate ?? ""}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 18"
                  className={`${inputStyles} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    onClick={() => handleStepChange("gst_rate", -1)}
                    disabled={Number(formData.gst_rate) <= 0}
                    className="px-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepChange("gst_rate", 1)}
                    className="px-2 text-zinc-400 hover:text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description and Image Uploader (Full Width) */}
        <div className="pt-2 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-zinc-400">
                AI Generated Description
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating || !formData.name}
                className="flex items-center gap-1.5 text-xs bg-purple-600/20 text-purple-300 px-2.5 py-1.5 rounded-md hover:bg-purple-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles size={14} />
                {isGenerating ? "Generating..." : "Generate with AI"}
              </button>
            </div>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
              placeholder="Click 'Generate with AI' or manually enter a description..."
              className={`${inputStyles} !pr-3`}
            />
          </div>
          <div>
            {/* Renders the ImageUploader, passing the product's images as initial media */}
            <ImageUploader
              onUploadSuccess={handleMediaUploadSuccess}
              initialMedia={product.images}
            />
          </div>
        </div>

        {/* Display form-level errors here */}
        {error && (
          <p className="text-red-400 text-sm pt-2 text-center">{error}</p>
        )}

        {/* Form action buttons */}
        <div className="pt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-wait transition-colors"
          >
            {/* Dynamic button text based on loading state */}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalLayout>
  );
};
