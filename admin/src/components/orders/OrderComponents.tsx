import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/types";

/* ================= ORDER STATUS BADGE ================= */

export const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const statusMap: Record<OrderStatus, string> = {
    Pending:
      "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700",

    Processing:
      "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700",

    Shipped:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",

    In_Transit:
      "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700",

    Delivered:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",

    Cancelled:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",

    Returned:
      "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
  };

  return (
    <span
      className={cn(
        "px-3 py-1 text-xs font-bold rounded-full border inline-flex items-center justify-center tracking-wide",
        statusMap[status] ||
          "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700",
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
    Paid: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",

    Unpaid:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",

    Pending:
      "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700",

    COD: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",

    Refunded:
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700",
  };

  return (
    <span
      className={cn(
        "px-3 py-1 text-xs font-bold rounded-full border inline-flex items-center justify-center tracking-wide",
        statusMap[status] ||
          "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700",
      )}
    >
      {status}
    </span>
  );
};
