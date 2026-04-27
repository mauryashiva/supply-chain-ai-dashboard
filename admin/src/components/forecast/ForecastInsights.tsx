import { Info, Brain, Target, Zap } from "lucide-react";

export const ForecastInsights = ({
  confidence,
  selectedId,
}: {
  confidence: number;
  selectedId: string;
}) => (
  <div className="bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden min-w-0 h-full">
    <div className="relative z-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-lg shrink-0">
          <Info className="text-white" size={24} />
        </div>

        <div className="min-w-0">
          <h3 className="text-xl md:text-2xl font-bold leading-tight wrap-break-word">
            AI Strategy Insights
          </h3>
          <p className="text-blue-100 text-xs md:text-sm opacity-90 wrap-break-word">
            Intelligent forecasting recommendations
          </p>
        </div>
      </div>

      {/* Focus Information */}
      <div className="mb-6">
        <p className="text-[10px] md:text-xs font-bold text-blue-100 mb-2 uppercase tracking-widest opacity-80">
          Stock Replenishment Focus:
        </p>
        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl backdrop-blur-md border border-white/10 max-w-full">
          <Target size={14} className="text-white shrink-0" />
          <span className="font-semibold text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
            {selectedId === "all" ? "Aggregated Fleet" : "Specific SKU"}
          </span>
        </div>
      </div>

      {/* ✅ FIXED Metrics Section (Grid instead of Flex) */}
      <div className="grid gap-4 mb-6 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
        <div className="min-w-0 overflow-hidden bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-yellow-300 shrink-0" />
            <p className="text-[10px] font-black text-blue-100 uppercase tracking-wider whitespace-nowrap">
              Confidence Score
            </p>
          </div>
          <p className="text-xl md:text-2xl font-black text-white">
            {confidence.toFixed(1)}%
          </p>
          <p className="text-[10px] text-blue-200 mt-1 italic">
            Forecast reliability
          </p>
        </div>

        <div className="min-w-0 overflow-hidden bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} className="text-purple-300 shrink-0" />
            <p className="text-[10px] font-black text-blue-100 uppercase tracking-wider whitespace-nowrap">
              Model Type
            </p>
          </div>
          <p className="text-lg md:text-xl font-black text-white truncate">
            Ensemble
          </p>
          <p className="text-[10px] text-blue-200 mt-1 italic">
            Multi-variate OLS
          </p>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <h4 className="text-xs font-black text-white mb-3 uppercase tracking-widest opacity-90">
          AI Recommendations
        </h4>
        <div className="space-y-3 text-xs text-blue-500">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
            <span className="text-blue-50 font-medium leading-tight">
              Monitor critical stock items daily
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(250,204,21,0.5)]"></div>
            <span className="text-blue-50 font-medium leading-tight">
              Review seasonal patterns weekly
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(96,165,250,0.5)]"></div>
            <span className="text-blue-50 font-medium leading-tight">
              Optimize inventory based on confidence
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Background Decorative Elements */}
    <div className="absolute -bottom-8 -right-8 text-white/5 rotate-12 pointer-events-none">
      <Brain size={200} />
    </div>
    <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
    <div className="absolute bottom-4 left-4 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl pointer-events-none"></div>
  </div>
);
