import React from "react";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/types";

/* ================= STOCK STATUS BADGE ================= */

export const StockStatusBadge: React.FC<{ status: ProductStatus }> = ({
  status,
}) => {
  const statusMap: Record<ProductStatus, string> = {
    "In Stock":
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700",

    "Low Stock":
      "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700",

    "Out of Stock":
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700",
  };

  return (
    <span
      className={cn(
        "px-3 py-1 text-xs font-bold rounded-full border inline-flex items-center justify-center tracking-wide",
        statusMap[status] ||
          "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700",
      )}
    >
      {status}
    </span>
  );
};
