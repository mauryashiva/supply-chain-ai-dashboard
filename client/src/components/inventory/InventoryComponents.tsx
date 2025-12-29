import React from "react";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/types";

/**
 * StockStatusBadge component
 * A reusable badge component that displays the product's stock status
 * with appropriate coloring.
 */
export const StockStatusBadge: React.FC<{ status: ProductStatus }> = ({
  status,
}) => {
  // A mapping object to associate each status with its specific Tailwind CSS classes
  const statusMap: Record<ProductStatus, string> = {
    "In Stock": "bg-green-500/10 text-green-400 border border-green-500/20",
    "Low Stock": "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    "Out of Stock": "bg-red-500/10 text-red-400 border border-red-500/20",
  };

  return (
    <span
      className={cn(
        // Base classes applied to all badges
        "px-2 py-1 text-xs font-medium rounded-full",
        // Dynamically select the correct class string from statusMap
        statusMap[status]
      )}
    >
      {/* Display the status text (e.g., "In Stock") */}
      {status}
    </span>
  );
};
