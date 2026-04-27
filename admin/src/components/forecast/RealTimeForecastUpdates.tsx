import { useState } from "react";
import { RefreshCw, Clock, Zap } from "lucide-react";

export const RealTimeForecastUpdates = ({
  onRefresh,
  lastUpdate,
}: {
  onRefresh: () => void;
  lastUpdate: Date | null;
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return "Never";

    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-4xl p-5 shadow-sm min-w-0 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <Zap className="text-cyan-500 shrink-0" size={16} />
        <h4 className="font-black uppercase tracking-tighter text-[10px] text-zinc-500 truncate">
          Real Time Updates
        </h4>
      </div>

      <div className="flex flex-col gap-3">
        {/* Last Update Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Clock size={14} className="text-zinc-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase truncate">
                Last Updated
              </p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest truncate">
                {getTimeSinceUpdate()}
              </p>
            </div>
          </div>

          <div className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 whitespace-nowrap bg-cyan-500/5 px-2 py-0.5 rounded">
            {lastUpdate?.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full p-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-300 text-white rounded-xl border border-cyan-500 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed group"
        >
          <RefreshCw
            size={14}
            className={`shrink-0 transition-transform duration-300 ${
              isRefreshing ? "animate-spin" : "group-hover:rotate-180"
            }`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
            {isRefreshing ? "Updating..." : "Refresh Forecasts"}
          </span>
        </button>

        {/* Auto Update Indicator */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              Auto Update Active
            </span>
          </div>
          <p className="text-[9px] font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-1.5 leading-tight">
            Syncing every 15m with fresh sales vectors
          </p>
        </div>

        {/* Update Triggers */}
        <div className="pt-1">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">
            System Triggers:
          </p>

          <div className="grid grid-cols-1 gap-1.5 text-[9px] font-bold text-zinc-400 uppercase">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-zinc-700 rounded-full shrink-0"></div>
              <span className="truncate">New order ingestion</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-zinc-700 rounded-full shrink-0"></div>
              <span className="truncate">Stock delta detected</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-zinc-700 rounded-full shrink-0"></div>
              <span className="truncate">15m cron execution</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
