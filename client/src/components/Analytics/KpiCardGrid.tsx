import React from "react";
// Import types using a path alias
import type { AnalyticsSummary } from "@/types";

interface KpiCardGridProps {
  kpi_cards: AnalyticsSummary["kpi_cards"];
}

export const KpiCardGrid: React.FC<KpiCardGridProps> = ({ kpi_cards }) => {
  return (
    <>
      {/* We only want to display the first 6 cards, so we use slice */}
      {kpi_cards.slice(0, 6).map((card, index) => (
        <div
          key={index}
          className="bg-zinc-900 rounded-lg shadow-lg p-4 border border-zinc-800"
        >
          <h3 className="text-sm font-medium text-zinc-400 mb-1 truncate">
            {card.title}
          </h3>
          <p className="text-2xl font-bold text-white">{card.value}</p>

          {/* Conditionally render the 'change' text only if it exists */}
          {card.change && (
            <p
              className={`text-xs ${
                // Apply dynamic text color based on the change value
                card.change.startsWith("+")
                  ? "text-green-400" // Green for positive
                  : card.change.startsWith("-")
                  ? "text-red-400" // Red for negative
                  : "text-zinc-400" // Neutral for no change
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
