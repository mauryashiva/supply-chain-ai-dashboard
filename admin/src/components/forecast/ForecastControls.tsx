import { Zap } from "lucide-react";
import type { Product } from "@/types";

interface ControlsProps {
  selectedId: string;
  setSelectedId: (id: string) => void;
  products: Product[];
}

export const ForecastControls = ({
  selectedId,
  setSelectedId,
  products,
}: ControlsProps) => {
  const isGlobal = selectedId === "all";

  const selectedProduct = products.find((p) => String(p.id) === selectedId);

  const displayName = isGlobal
    ? "All Products Overview"
    : selectedProduct
      ? `${selectedProduct.name} — ${selectedProduct.sku}`
      : "";

  return (
    <div className="flex flex-col gap-3 bg-linear-to-br from-white to-slate-50 dark:from-zinc-900 dark:to-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      {/* Top Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Label */}
        <div className="flex items-center gap-2 px-3 py-1">
          <Zap size={14} className="text-yellow-500" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Context Selector
          </span>
        </div>

        {/* Dropdown */}
        <div className="relative w-full md:w-auto">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full md:w-75 appearance-none bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-700 px-4 pr-10 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-sm cursor-pointer truncate"
          >
            <option value="all">Global Stocks Aggregate</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.sku}
              </option>
            ))}
          </select>

          {/* Arrow */}
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
            ▼
          </div>
        </div>
      </div>

      {/* Selected Info */}
      <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
        <p className="text-[11px] text-zinc-500 mb-1 uppercase tracking-wide">
          Selected Context
        </p>

        <p
          className={`text-sm font-semibold ${
            isGlobal
              ? "text-cyan-600 dark:text-cyan-400"
              : "text-zinc-800 dark:text-white"
          }`}
        >
          {displayName}
        </p>
      </div>
    </div>
  );
};
