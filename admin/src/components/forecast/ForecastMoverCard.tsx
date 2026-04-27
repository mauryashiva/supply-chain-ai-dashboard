import {
  Flame,
  ArrowUpRight,
  AlertCircle,
  ShieldCheck,
  Activity,
} from "lucide-react";
import type { TopMover } from "@/types";

export const ForecastMoverCard = ({
  movers,
  loading,
}: {
  movers: TopMover[];
  loading: boolean;
}) => (
  <div className="bg-linear-to-br from-orange-500 via-red-500 to-pink-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
    {/* Header */}
    <div className="flex items-center gap-4 mb-6 relative z-10">
      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-lg">
        <Flame className="text-white" size={24} />
      </div>
      <div>
        <h4 className="text-xl font-bold uppercase tracking-wide">
          Demand Anomaly Detection
        </h4>
        <p className="text-orange-100 text-sm">
          Critical stock movement alerts
        </p>
      </div>
    </div>

    {/* Content */}
    <div className="space-y-4 relative z-10">
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 bg-white/10 rounded-2xl backdrop-blur-md"
            />
          ))}
        </div>
      ) : movers.length > 0 ? (
        movers.map((product) => (
          <div
            key={product.id}
            className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-xs font-bold text-orange-100 uppercase tracking-wider mb-1">
                  SKU: {product.sku}
                </p>
                <h5 className="font-bold text-white text-sm leading-tight">
                  {product.name}
                </h5>
              </div>

              <div className="text-right">
                <div className="flex items-center text-orange-300 font-bold gap-2 text-lg">
                  <ArrowUpRight size={16} />
                  <span>{product.predicted_qty}u</span>
                </div>
                <p className="text-xs text-orange-200 mt-1">predicted demand</p>
              </div>
            </div>

            {product.current_stock < product.predicted_qty && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-300 uppercase bg-red-500/20 p-2 rounded-lg border border-red-400/30">
                <AlertCircle size={12} />
                Critical Stock Deficit
              </div>
            )}
          </div>
        ))
      ) : (
        /* Professional Empty State */
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-green-400/20 rounded-full backdrop-blur-md border border-green-400/30">
            <ShieldCheck size={32} className="text-green-300" />
          </div>

          <div>
            <p className="text-lg font-bold text-white uppercase tracking-wide">
              Status: Stable Demand
            </p>
            <p className="text-sm text-orange-100 mt-2 leading-relaxed">
              No significant spikes predicted <br />
              for the next 24-hour cycle.
            </p>
          </div>
        </div>
      )}
    </div>

    {/* Background Pattern */}
    <div className="absolute -bottom-8 -right-8 text-white/5 rotate-12">
      <Activity size={200} />
    </div>
    <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
    <div className="absolute bottom-4 left-4 w-24 h-24 bg-red-400/10 rounded-full blur-2xl"></div>
  </div>
);
