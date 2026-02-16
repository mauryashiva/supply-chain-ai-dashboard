import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/types";

/* ================= ORDER STATUS BADGE ================= */

export const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const statusMap: Record<OrderStatus, string> = {
    Pending: "bg-yellow-900 text-yellow-300 border-yellow-700",
    Processing: "bg-sky-900 text-sky-300 border-sky-700",
    Shipped: "bg-blue-900 text-blue-300 border-blue-700",
    In_Transit: "bg-indigo-900 text-indigo-300 border-indigo-700",
    Delivered: "bg-green-900 text-green-300 border-green-700",
    Cancelled: "bg-red-900 text-red-300 border-red-700",
    Returned: "bg-orange-900 text-orange-300 border-orange-700",
  };

  return (
    <span
      className={cn(
        "px-3 py-1 text-xs font-bold rounded-full border inline-flex items-center justify-center tracking-wide",
        statusMap[status] || "bg-gray-900 text-gray-300 border-gray-700",
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
};

/* ================= PAYMENT STATUS BADGE ================= */

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({
  status,
}) => {
  const statusMap: Record<PaymentStatus, string> = {
    Paid: "bg-green-900 text-green-300 border-green-700",
    Unpaid: "bg-red-900 text-red-300 border-red-700",
    Pending: "bg-yellow-900 text-yellow-300 border-yellow-700",
    COD: "bg-blue-900 text-blue-300 border-blue-700",
    Refunded: "bg-gray-900 text-gray-300 border-gray-700",
  };

  return (
    <span
      className={cn(
        "px-3 py-1 text-xs font-bold rounded-full border inline-flex items-center justify-center tracking-wide",
        statusMap[status] || "bg-gray-900 text-gray-300 border-gray-700",
      )}
    >
      {status}
    </span>
  );
};
