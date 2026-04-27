import React from "react";
import {
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { StatusBadge, PaymentStatusBadge } from "./OrderComponents";
import type { Order } from "@/types";

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
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getOrderAge = (dateString: string) => {
    const orderDate = new Date(dateString);
    const today = new Date();
    const diff = Math.floor(
      (today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diff === 0) return "Today";
    if (diff === 1) return "1d";
    return `${diff}d`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
        {/* HEADER */}
        <thead className="bg-gray-100 dark:bg-zinc-900">
          <tr className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase">
            <th className="px-4 py-3 text-left">Order</th>
            <th className="px-4 py-3 text-left">Customer</th>
            <th className="px-4 py-3 text-left">Contact</th>
            <th className="px-4 py-3 text-left">Location</th>
            <th className="px-4 py-3 text-left">Payment</th>
            <th className="px-4 py-3 text-left">Items</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody className="bg-white dark:bg-zinc-950 divide-y divide-gray-200 dark:divide-zinc-800 text-sm font-bold text-gray-900 dark:text-white">
          {loading ? (
            <tr>
              <td
                colSpan={9}
                className="text-center py-8 text-gray-600 dark:text-zinc-400"
              >
                Loading orders...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td
                colSpan={9}
                className="text-center py-8 text-red-600 font-bold"
              >
                <div className="flex justify-center items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="text-center py-8 text-gray-600 dark:text-zinc-400"
              >
                No orders found.
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const city =
                order.address?.city ||
                order.shipping_address?.split(",")[2] ||
                "N/A";

              return (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
                >
                  {/* ORDER */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-blue-600 dark:text-blue-400 font-mono">
                        #{order.id}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-zinc-500">
                        {formatDate(order.order_date)} •{" "}
                        {getOrderAge(order.order_date)}
                      </span>
                    </div>
                  </td>

                  {/* CUSTOMER */}
                  <td className="px-4 py-4">
                    {order.customer_name ||
                      order.address?.full_name ||
                      "Unknown"}
                  </td>

                  {/* CONTACT */}
                  <td className="px-4 py-4 text-gray-700 dark:text-zinc-300">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <Phone size={14} />
                        {order.phone_number ||
                          order.address?.phone_number ||
                          "N/A"}
                      </span>
                      <span className="flex items-center gap-2 text-xs">
                        <Mail size={14} />
                        {order.customer_email || order.user?.email || "N/A"}
                      </span>
                    </div>
                  </td>

                  {/* LOCATION */}
                  <td className="px-4 py-4 text-gray-700 dark:text-zinc-300">
                    <span className="flex items-center gap-2">
                      <MapPin size={14} /> {city}
                    </span>
                  </td>

                  {/* PAYMENT */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <PaymentStatusBadge status={order.payment_status} />
                      <span className="text-xs text-gray-600 dark:text-zinc-400">
                        {order.payment_method}
                      </span>
                    </div>
                  </td>

                  {/* ITEMS */}
                  <td className="px-4 py-4">{order.items?.length || 0}</td>

                  {/* AMOUNT */}
                  <td className="px-4 py-4">
                    {formatCurrency(order.total_amount)}
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-4">
                    <StatusBadge status={order.status} />
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => onView(order)}
                        className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => onEdit(order)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => onDelete(order)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
