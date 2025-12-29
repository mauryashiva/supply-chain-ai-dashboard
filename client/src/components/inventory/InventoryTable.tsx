import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react"; // Import icons for actions
import type { Product } from "@/types";
import { StockStatusBadge } from "./InventoryComponents"; // Import the status badge component

// Define the props for the InventoryTable component
interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void; // Function to handle editing a product
  onDelete: (product: Product) => void; // Function to handle deleting a product
  onView: (product: Product) => void; // Function to handle viewing product details
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  onEdit,
  onDelete,
  onView, // Receive the new onView prop
}) => {
  // Helper function to format numbers as Indian Rupees (₹)
  const formatCurrency = (amount?: number) => {
    if (typeof amount !== "number") return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-800">
        <thead className="bg-zinc-800/50">
          <tr>
            {/* --- Simplified columns for the main table view --- */}
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
              Product
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
              Stock
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
              Stock Value (Cost)
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-zinc-300 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-zinc-900 divide-y divide-zinc-800">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-zinc-800/50">
              {/* --- Displaying only the essential product details --- */}
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                {product.name}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-zinc-400">
                {product.sku}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">
                {product.stock_quantity} units
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-white">
                {/* Calculate the total stock value based on cost price */}
                {formatCurrency(
                  (product.cost_price || 0) * product.stock_quantity
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                {/* Use the reusable badge component for status */}
                <StockStatusBadge status={product.status} />
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-4">
                  {/* --- NEW "VIEW" BUTTON WITH EYE ICON --- */}
                  <button
                    onClick={() => onView(product)}
                    className="text-zinc-400 hover:text-white"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  {/* Edit Button */}
                  <button
                    onClick={() => onEdit(product)}
                    className="text-cyan-400 hover:text-cyan-300"
                    title="Edit Product"
                  >
                    <Pencil size={16} />
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={() => onDelete(product)}
                    className="text-red-500 hover:text-red-400"
                    title="Delete Product"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
