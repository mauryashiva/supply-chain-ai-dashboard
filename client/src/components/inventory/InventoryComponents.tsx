import React from "react";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/types";

/* ================= STOCK STATUS BADGE ================= */

export const StockStatusBadge: React.FC<{ status: ProductStatus }> = ({
  status,
}) => {
  const statusMap: Record<ProductStatus, string> = {
    "In Stock": "bg-green-900 text-green-300 border-green-700",
    "Low Stock": "bg-yellow-900 text-yellow-300 border-yellow-700",
    "Out of Stock": "bg-red-900 text-red-300 border-red-700",
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
