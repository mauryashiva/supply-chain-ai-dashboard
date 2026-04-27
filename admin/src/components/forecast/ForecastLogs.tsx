import { useState, useEffect } from "react";
import { Activity } from "lucide-react";

export const ForecastLogs = () => {
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const logs = [
    { id: 1, node: "node_0x92", msg: "Vector analysis synchronized" },
    { id: 2, node: "node_alpha", msg: "Seasonality encoding applied" },
    { id: 3, node: "node_delta", msg: "Uncertainty variance computed" },
  ];

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative">
          <span className="absolute inset-0 bg-yellow-400 rounded-full blur-sm opacity-50 animate-pulse"></span>
          <span className="relative w-2 h-2 bg-yellow-400 rounded-full"></span>
        </div>

        <Activity size={14} className="text-yellow-500" />

        <h4 className="font-black uppercase tracking-tight text-[11px] text-zinc-600 dark:text-zinc-300">
          Live Inference Log
        </h4>
      </div>

      {/* Logs */}
      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="group flex gap-3 items-start p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-cyan-400/40 transition-all duration-200"
          >
            {/* Time */}
            <div className="text-[9px] font-mono text-zinc-400 mt-0.5 shrink-0">
              {timestamp}
            </div>

            {/* Message */}
            <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 leading-snug">
              {log.msg} for{" "}
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                {log.node}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-5 text-[9px] text-zinc-400 uppercase tracking-wider">
        Streaming real-time inference updates
      </div>
    </div>
  );
};
