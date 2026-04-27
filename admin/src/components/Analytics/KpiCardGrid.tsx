import React from "react";
import type { AnalyticsSummary } from "@/types";

interface KpiCardGridProps {
  kpi_cards: AnalyticsSummary["kpi_cards"];
}

export const KpiCardGrid: React.FC<KpiCardGridProps> = ({ kpi_cards }) => {
  return (
    <>
      {kpi_cards.slice(0, 6).map((card, index) => (
        <div
          key={index}
          className="
            bg-white dark:bg-zinc-900
            rounded-xl shadow-sm
            p-5
            border border-gray-200 dark:border-zinc-800
            hover:shadow-md transition
          "
        >
          {/* Title — ALWAYS BOLD */}
          <h3 className="text-sm font-bold text-gray-700 dark:text-zinc-300 mb-1 truncate">
            {card.title}
          </h3>

          {/* Value — ALWAYS BOLD */}
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {card.value}
          </p>

          {/* Change — ALWAYS BOLD */}
          {card.change && (
            <p
              className={`text-xs font-bold ${
                card.change.startsWith("+")
                  ? "text-green-600 dark:text-green-400"
                  : card.change.startsWith("-")
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-600 dark:text-zinc-400"
              }`}
            >
              {card.change}
            </p>
          )}
        </div>
      ))}
    </>
  );
};
