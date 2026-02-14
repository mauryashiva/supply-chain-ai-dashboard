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
      <table className="min-w-full divide-y divide-zinc-800">
        <thead className="bg-zinc-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs text-zinc-300 uppercase">
              Order
            </th>
            <th className="px-4 py-3 text-left text-xs text-zinc-300 uppercase">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs text-zinc-300 uppercase">
              Contact
            </th>
            <th className="px-4 py-3 text-left text-xs text-zinc-300 uppercase">
              Location
            </th>
            <th className="px-4 py-3 text-left text-xs text-zinc-300 uppercase">
              Payment
            </th>
            <th className="px-4 py-3 text-left text-xs text-zinc-300 uppercase">
              Items
            </th>
            <th className="px-4 py-3 text-left text-xs text-zinc-300 uppercase">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs text-zinc-300 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs text-zinc-300 uppercase">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-zinc-900 divide-y divide-zinc-800">
          {loading ? (
            <tr>
              <td colSpan={9} className="text-center py-8 text-zinc-400">
                Loading orders...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={9} className="text-center py-8 text-red-400">
                <div className="flex justify-center items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center py-8 text-zinc-400">
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
                  className="hover:bg-zinc-800/50 transition-colors"
                >
                  {/* ORDER */}
                  <td className="px-4 py-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-cyan-400 font-mono">
                        #{order.id}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatDate(order.order_date)} •{" "}
                        {getOrderAge(order.order_date)}
                      </span>
                    </div>
                  </td>

                  {/* CUSTOMER */}
                  <td className="px-4 py-4 text-sm font-semibold text-white">
                    {order.customer_name ||
                      order.address?.full_name ||
                      "Unknown"}
                  </td>

                  {/* CONTACT */}
                  <td className="px-4 py-4 text-sm text-zinc-300">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <Phone size={14} />{" "}
                        {order.phone_number ||
                          order.address?.phone_number ||
                          "N/A"}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-zinc-400">
                        <Mail size={14} />{" "}
                        {order.customer_email || order.user?.email || "N/A"}
                      </span>
                    </div>
                  </td>

                  {/* LOCATION */}
                  <td className="px-4 py-4 text-sm text-zinc-300">
                    <span className="flex items-center gap-2">
                      <MapPin size={14} /> {city}
                    </span>
                  </td>

                  {/* PAYMENT */}
                  <td className="px-4 py-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <PaymentStatusBadge status={order.payment_status} />
                      <span className="text-xs text-zinc-400">
                        {order.payment_method}
                      </span>
                    </div>
                  </td>

                  {/* ITEMS */}
                  <td className="px-4 py-4 text-sm text-zinc-300">
                    {order.items?.length || 0}
                  </td>

                  {/* AMOUNT */}
                  <td className="px-4 py-4 text-sm text-zinc-300">
                    {formatCurrency(order.total_amount)}
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-4 text-sm">
                    <StatusBadge status={order.status} />
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => onView(order)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => onEdit(order)}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => onDelete(order)}
                        className="text-red-500 hover:text-red-400"
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
