import React from "react";
import { Eye, Edit, Trash2, AlertCircle } from "lucide-react";
import { StatusBadge } from "./OrderComponents";
import type { Order } from "@/types";

/**
 * This component is responsible for displaying the list of orders in a table.
 * It takes in data and renders it in a clean table format.
 */

interface OrderTableProps {
  loading: boolean;
  error: string | null;
  orders: Order[];
  onView: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  loading,
  error,
  orders,
  onView,
  onEdit,
  onDelete,
}) => {
  // Helper function to format currency to INR (₹)
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  // Helper function to format date strings (e.g., "29 Oct 2025")
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-800">
        <thead className="bg-zinc-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
              Order ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
              Amount
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
          {/* Show a loading state while data is being fetched */}
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-zinc-400">
                Loading orders...
              </td>
            </tr>
          ) : error ? (
            // Show an error message if fetching fails
            <tr>
              <td colSpan={6} className="text-center py-8 text-red-400">
                <div className="flex justify-center items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              </td>
            </tr>
          ) : orders.length === 0 ? (
            // Show a message if no orders are found
            <tr>
              <td colSpan={6} className="text-center py-8 text-zinc-400">
                No orders found.
              </td>
            </tr>
          ) : (
            // Map over the orders and render a table row for each
            orders.map((order) => (
              <tr key={order.id} className="hover:bg-zinc-800/50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-cyan-400">
                  #{order.id}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-400">
                  {formatDate(order.order_date)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {order.customer_name}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">
                  {formatCurrency(order.total_amount)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Action buttons for each row */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => onView(order)}
                      className="text-zinc-400 hover:text-white"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(order)}
                      className="text-cyan-400 hover:text-cyan-300"
                      title="Edit Order"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(order)}
                      className="text-red-500 hover:text-red-400"
                      title="Delete Order"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
