import { useEffect, useState, useCallback } from "react";
// 1. Updated Service Import
import { orderService } from "@/services";
import { useInventorySocket } from "@/hooks/useInventorySocket";
import {
  Package,
  ChevronDown,
  Clock,
  ReceiptText,
  CheckCircle2,
  Timer,
  Truck,
  Boxes,
  Navigation,
  Home,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { Navbar } from "@/components/common/Navbar";
import { cn } from "@/lib/utils";
import type { Order } from "@/types"; // Use the standardized type

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the user's specific order manifest.
   * Matches backend: GET /api/customer/orders/my-orders
   */
  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderService.getMyOrders();
      setOrders(res.data);
    } catch (err) {
      console.error("Order retrieval failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time updates: If an admin changes order status, the UI updates instantly
  useInventorySocket(fetchOrders);

  const toggleOrder = (id: number) =>
    setOpenOrderId(openOrderId === id ? null : id);

  if (loading) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center text-foreground">
        <Loader2 className="h-10 w-10 text-yellow-500 animate-spin mb-4" />
        <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-[10px]">
          Synchronizing_Logistics_Logs
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden transition-colors duration-300 selection:bg-yellow-500/30">
      <Navbar />

      <header className="px-6 pt-8 pb-4 sm:pt-16 sm:pb-10 max-w-5xl mx-auto w-full shrink-0">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase mb-2 italic">
          Order_Manifest<span className="text-yellow-500">_</span>
        </h1>
        <div className="flex items-center justify-between border-b-2 border-border pb-4">
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">
            History of Secured Deployments
          </p>
          <p className="text-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Clock className="h-3 w-3 text-yellow-500" /> System Time:{" "}
            {format(new Date(), "HH:mm")}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-24 custom-scrollbar overflow-x-hidden">
        <div className="max-w-5xl mx-auto w-full">
          {orders.length === 0 ? (
            <div className="bg-secondary/20 border-2 border-dashed border-border rounded-[3rem] py-32 flex flex-col items-center justify-center text-center opacity-50">
              <Package size={64} className="text-muted-foreground mb-6" />
              <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.3em]">
                Zero_Deployments_Found
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={cn(
                    "group overflow-hidden rounded-[2.5rem] border-2 transition-all duration-500",
                    openOrderId === order.id
                      ? "bg-yellow-500 border-foreground shadow-[0_20px_50px_rgba(234,179,8,0.3)] scale-[1.01]"
                      : "bg-card border-border hover:border-yellow-500/50",
                  )}
                >
                  {/* SUMMARY SECTION */}
                  <div
                    onClick={() => toggleOrder(order.id)}
                    className="p-6 sm:p-10 flex flex-col md:flex-row justify-between items-center cursor-pointer gap-6"
                  >
                    <div className="flex items-center gap-6 w-full md:w-auto">
                      <div
                        className={cn(
                          "h-16 w-16 rounded-2xl flex items-center justify-center border-2 transition-all",
                          openOrderId === order.id
                            ? "bg-black text-yellow-500 border-black shadow-lg"
                            : "bg-secondary border-border text-foreground",
                        )}
                      >
                        <Package className="h-8 w-8" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "text-[10px] font-black tracking-widest",
                              openOrderId === order.id
                                ? "text-black/60"
                                : "text-muted-foreground",
                            )}
                          >
                            MANIFEST_#{order.id.toString().padStart(4, "0")}
                          </span>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                              getStatusBadge(
                                order.status,
                                openOrderId === order.id,
                              ),
                            )}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "text-2xl font-black italic tracking-tighter",
                            openOrderId === order.id
                              ? "text-black"
                              : "text-foreground",
                          )}
                        >
                          {format(new Date(order.order_date), "dd MMMM, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-10 w-full md:w-auto justify-between border-t md:border-t-0 pt-6 md:pt-0 border-black/10">
                      <div className="md:text-right">
                        <p
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest mb-1",
                            openOrderId === order.id
                              ? "text-black/60"
                              : "text-muted-foreground",
                          )}
                        >
                          Authorized_Value
                        </p>
                        <p
                          className={cn(
                            "text-3xl font-black italic tracking-tighter",
                            openOrderId === order.id
                              ? "text-black"
                              : "text-cyan-500",
                          )}
                        >
                          ₹{order.total_amount.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center transition-all border shrink-0",
                          openOrderId === order.id
                            ? "bg-black text-yellow-500 rotate-180 border-black"
                            : "bg-secondary text-foreground border-border",
                        )}
                      >
                        <ChevronDown className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  {/* DETAILS SECTION */}
                  <div
                    className={cn(
                      "grid transition-all duration-500 ease-in-out",
                      openOrderId === order.id
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="px-6 sm:px-10 pb-10 space-y-8">
                        {/* ITEM LIST */}
                        <div className="bg-background/30 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 border border-black/5 space-y-6">
                          <div className="flex items-center gap-2 border-b border-black/10 pb-4">
                            <ReceiptText className="h-4 w-4 text-black/60" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/80">
                              Product_Allocation_Logs
                            </span>
                          </div>
                          <div className="space-y-4">
                            {order.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center group/item"
                              >
                                <div className="space-y-0.5">
                                  <p className="text-base font-black text-black uppercase tracking-tight">
                                    {item.product_name || "Unknown Product"}
                                  </p>
                                  <p className="text-[10px] text-black/60 font-bold uppercase tabular-nums">
                                    QUANTITY: {item.quantity} × ₹
                                    {item.unit_price?.toLocaleString() || "0"}
                                  </p>
                                </div>
                                <p className="text-xl font-black text-black italic">
                                  ₹
                                  {(
                                    (item.unit_price || 0) * item.quantity
                                  ).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* TRACKING STEPPER */}
                        <div className="pt-4">
                          <div className="flex items-center justify-center gap-4 mb-10">
                            <div className="h-0.5 flex-1 bg-black/10" />
                            <p className="text-[10px] font-black uppercase text-black tracking-[0.3em]">
                              Logistic_Protocol_Status
                            </p>
                            <div className="h-0.5 flex-1 bg-black/10" />
                          </div>

                          <div className="overflow-x-auto pb-4 scrollbar-hide">
                            <TrackingStepper currentStatus={order.status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 20px; }
      `}</style>
    </div>
  );
};

const getStatusBadge = (status: string, isActive: boolean) => {
  if (isActive) return "bg-black text-yellow-500";
  switch (status) {
    case "Delivered":
      return "bg-emerald-500 text-white";
    case "Processing":
      return "bg-blue-500 text-white";
    case "Shipped":
      return "bg-purple-500 text-white";
    case "In Transit":
      return "bg-indigo-500 text-white";
    case "Cancelled":
      return "bg-rose-500 text-white";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
};

const TrackingStepper = ({ currentStatus }: { currentStatus: string }) => {
  const steps = [
    { label: "Pending", icon: Timer, color: "text-amber-500" },
    { label: "Processing", icon: Boxes, color: "text-blue-500" },
    { label: "Shipped", icon: Truck, color: "text-purple-500" },
    { label: "In Transit", icon: Navigation, color: "text-indigo-500" },
    { label: "Delivered", icon: Home, color: "text-emerald-500" },
  ];

  const currentIndex = steps.findIndex((s) => s.label === currentStatus);

  return (
    <div className="relative flex justify-between items-start w-full px-8 min-w-175">
      <div className="absolute top-7 left-14 right-14 h-1 bg-black/10 rounded-full z-0" />
      <div
        className="absolute top-7 left-14 h-1 bg-black transition-all duration-1000 z-0 rounded-full"
        style={{
          width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 40px)`,
        }}
      />

      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx <= currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <div
            key={step.label}
            className="relative z-10 flex flex-col items-center w-32 shrink-0"
          >
            <div
              className={cn(
                "h-14 w-14 rounded-4xl flex items-center justify-center transition-all duration-700 border-4",
                isActive
                  ? "bg-black border-black text-white scale-110 shadow-xl"
                  : "bg-white border-white text-muted-foreground",
              )}
            >
              {isCurrent ? (
                <Icon size={24} className={cn(step.color, "animate-pulse")} />
              ) : isActive ? (
                <CheckCircle2 size={24} className="text-yellow-500" />
              ) : (
                <Icon size={22} />
              )}
            </div>
            <p
              className={cn(
                "mt-4 text-[10px] font-black uppercase tracking-widest text-center",
                isActive ? "text-black" : "text-muted-foreground",
              )}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
};
