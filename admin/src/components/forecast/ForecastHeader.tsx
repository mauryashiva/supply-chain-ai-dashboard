import {
  Brain,
  Activity,
  ShieldCheck,
  TrendingUp,
  BarChart3,
} from "lucide-react";

interface HeaderProps {
  totalProjected: string;
  modelConfidence: number;
  loading: boolean;
}

export const ForecastHeader = ({
  totalProjected,
  modelConfidence,
  loading,
}: HeaderProps) => (
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
    {/* Main Title Section */}
    <div className="flex-1">
      <div className="flex items-center gap-4 mb-3">
        <div className="p-3 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
          <Brain className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
            Demand Forecasting
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
            AI-Powered Supply Chain Intelligence
          </p>
        </div>
      </div>
      <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
        Advanced machine learning models analyze historical data, seasonal
        patterns, and market trends to provide accurate demand predictions and
        optimize inventory management.
      </p>
    </div>

    {/* Metrics Cards */}
    <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
      {/* Projected Volume */}
      <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <BarChart3 className="text-white" size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              30-Day Projection
            </p>
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 dark:text-white">
          {loading ? (
            <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-8 w-24 rounded"></div>
          ) : (
            `${totalProjected} units`
          )}
        </div>
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className="text-green-500" size={16} />
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            +12.5% from last month
          </span>
        </div>
      </div>

      {/* Model Confidence */}
      <div className="bg-linear-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Model Accuracy
            </p>
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 dark:text-white">
          {loading ? (
            <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-8 w-16 rounded"></div>
          ) : (
            `${modelConfidence.toFixed(1)}%`
          )}
        </div>
        <div className="flex items-center gap-1 mt-2">
          <Activity className="text-emerald-500" size={16} />
          <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            High confidence
          </span>
        </div>
      </div>
    </div>
  </div>
);
