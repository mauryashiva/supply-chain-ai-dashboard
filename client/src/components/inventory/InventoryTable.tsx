import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/types";
import { StockStatusBadge } from "./InventoryComponents";

interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onView: (product: Product) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  onEdit,
  onDelete,
  onView,
}) => {
  const formatCurrency = (amount?: number) => {
    if (typeof amount !== "number") return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        {/* HEADER */}
        <thead className="bg-gray-100">
          <tr className="text-xs font-bold text-gray-700 uppercase">
            <th className="px-4 py-3 text-left">Product</th>
            <th className="px-4 py-3 text-left">SKU</th>
            <th className="px-4 py-3 text-left">Stock</th>
            <th className="px-4 py-3 text-left">Stock Value (Cost)</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody className="bg-white divide-y divide-gray-200 text-sm font-bold text-gray-900">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50 transition">
              {/* PRODUCT */}
              <td className="px-4 py-4 whitespace-nowrap">{product.name}</td>

              {/* SKU */}
              <td className="px-4 py-4 whitespace-nowrap font-mono text-gray-600">
                {product.sku}
              </td>

              {/* STOCK */}
              <td className="px-4 py-4 whitespace-nowrap">
                {product.stock_quantity} units
              </td>

              {/* STOCK VALUE */}
              <td className="px-4 py-4 whitespace-nowrap">
                {formatCurrency(
                  (product.cost_price || 0) * product.stock_quantity,
                )}
              </td>

              {/* STATUS — Dark Badge Compatible */}
              <td className="px-4 py-4 whitespace-nowrap">
                <StockStatusBadge status={product.status} />
              </td>

              {/* ACTIONS */}
              <td className="px-4 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-4">
                  {/* VIEW */}
                  <button
                    onClick={() => onView(product)}
                    className="text-gray-500 hover:text-gray-900"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>

                  {/* EDIT */}
                  <button
                    onClick={() => onEdit(product)}
                    className="text-blue-600 hover:text-blue-700"
                    title="Edit Product"
                  >
                    <Pencil size={16} />
                  </button>

                  {/* DELETE */}
                  <button
                    onClick={() => onDelete(product)}
                    className="text-red-600 hover:text-red-700"
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
