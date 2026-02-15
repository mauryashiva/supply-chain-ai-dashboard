import { useEffect, useState } from "react";
import { getMyOrders } from "@/services/api";
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
} from "lucide-react";
import { format } from "date-fns";
import { Navbar } from "@/components/common/Navbar";

interface OrderItem {
  quantity: number;
  product: {
    name: string;
    selling_price: number;
  };
}

interface Order {
  id: number;
  order_date: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
}

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await getMyOrders();
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useInventorySocket(() => fetchOrders());

  const toggleOrder = (id: number) =>
    setOpenOrderId(openOrderId === id ? null : id);

  if (loading) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div className="h-10 w-10 border-4 border-zinc-800 border-t-yellow-500 rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
          Accessing_Logs
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white text-zinc-900 font-sans flex flex-col overflow-hidden">
      <Navbar />

      <header className="px-6 pt-8 pb-4 sm:pt-12 sm:pb-8 max-w-5xl mx-auto w-full shrink-0">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase mb-2">
          Your Orders<span className="text-yellow-500"></span>
        </h1>
        {/* UPDATED: System Live made bolder and darker */}
        <p className="text-zinc-950 text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Clock className="h-3 w-3 text-yellow-600" /> System Live:{" "}
          {format(new Date(), "HH:mm")}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-16 custom-scrollbar overflow-x-hidden">
        <div className="max-w-5xl mx-auto w-full">
          {orders.length === 0 ? (
            <div className="bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
              <Package size={48} className="text-zinc-200 mb-6" />
              <p className="text-lg font-bold text-zinc-400 uppercase italic">
                No_Deployments_Found
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`group overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border-3 transition-all duration-500 w-full ${
                    openOrderId === order.id
                      ? "bg-yellow-400 border-black shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]"
                      : "bg-zinc-50 border-black hover:border-yellow-400"
                  }`}
                >
                  <div
                    onClick={() => toggleOrder(order.id)}
                    className="p-5 sm:p-8 flex flex-col md:flex-row justify-between items-center cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div
                        className={`h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all border-2 ${
                          openOrderId === order.id
                            ? "bg-zinc-950 border-zinc-950 text-yellow-400 shadow-xl"
                            : "bg-white border-zinc-950 text-zinc-900"
                        }`}
                      >
                        <Package className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                          {/* UPDATED: Order ID made darker and font-black */}
                          <span
                            className={`text-[10px] font-black font-mono ${openOrderId === order.id ? "text-zinc-900" : "text-zinc-950"}`}
                          >
                            #{order.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${getStatusBadge(order.status, openOrderId === order.id)}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p
                          className={`text-base sm:text-xl font-black tracking-tight truncate ${openOrderId === order.id ? "text-zinc-950" : "text-zinc-900"}`}
                        >
                          {format(new Date(order.order_date), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-4 sm:gap-10 w-full md:w-auto justify-between border-t md:border-t-0 pt-4 md:pt-0 ${openOrderId === order.id ? "border-zinc-950/20" : "border-zinc-200"}`}
                    >
                      <div className="md:text-right">
                        {/* UPDATED: Grand Total Label made font-black and darker */}
                        <p
                          className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-0.5 ${openOrderId === order.id ? "text-zinc-950" : "text-zinc-950"}`}
                        >
                          Grand Total
                        </p>
                        <p
                          className={`text-xl sm:text-3xl font-black italic tracking-tighter ${openOrderId === order.id ? "text-zinc-950" : "text-blue-700"}`}
                        >
                          ₹{order.total_amount.toLocaleString()}
                        </p>
                      </div>
                      <div
                        className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-all border shrink-0 ${openOrderId === order.id ? "bg-zinc-950 text-yellow-400 rotate-180 border-zinc-950" : "bg-white text-zinc-900 border-zinc-950"}`}
                      >
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`grid transition-all duration-500 ease-in-out ${openOrderId === order.id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 sm:px-10 pb-8 sm:pb-10 space-y-6">
                        <div className="bg-white/40 rounded-[1.5rem] p-5 sm:p-8 space-y-4 border border-zinc-950/5">
                          <div className="flex items-center gap-2 text-zinc-900 border-b border-zinc-950/10 pb-3">
                            <ReceiptText className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Billing_Summary
                            </span>
                          </div>
                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center gap-4"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs sm:text-base font-bold text-zinc-950 uppercase tracking-tight truncate">
                                    {item.product.name}
                                  </p>
                                  {/* UPDATED: QTY math made font-black and darker */}
                                  <p className="text-[9px] sm:text-[11px] text-zinc-950 font-black uppercase font-mono">
                                    QTY {item.quantity} × ₹
                                    {item.product.selling_price.toLocaleString()}
                                  </p>
                                </div>
                                <p className="text-sm sm:text-lg font-black text-zinc-950 italic whitespace-nowrap">
                                  ₹
                                  {(
                                    item.product.selling_price * item.quantity
                                  ).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 w-full overflow-hidden">
                          <div className="flex items-center justify-center gap-2 mb-8">
                            <div className="h-px flex-1 bg-zinc-950/20" />
                            <p className="text-[11px] font-black uppercase text-zinc-950 tracking-[0.2em] whitespace-nowrap">
                              Live_Manifest_Status
                            </p>
                            <div className="h-px flex-1 bg-zinc-950/20" />
                          </div>

                          <div className="overflow-x-auto pb-6 scrollbar-hide w-full">
                            <div className="min-w-150 sm:min-w-0 sm:w-full">
                              <TrackingStepper currentStatus={order.status} />
                            </div>
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

const getStatusBadge = (status: string, isActive: boolean) => {
  if (isActive) return "bg-zinc-950 text-yellow-400 border border-zinc-950";
  switch (status) {
    case "Delivered":
      return "bg-emerald-500 text-white";
    case "Processing":
      return "bg-blue-600 text-white";
    case "Shipped":
      return "bg-purple-600 text-white";
    case "Cancelled":
      return "bg-red-600 text-white";
    default:
      return "bg-zinc-900 text-white";
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
    <div className="relative flex justify-between items-start w-full px-8">
      {/* Background Rail */}
      <div className="absolute top-6 left-12 right-12 h-1.5 bg-zinc-950/10 -translate-y-1/2 rounded-full z-0" />

      {/* Active Progress Rail */}
      <div
        className="absolute top-6 left-12 h-1.5 bg-zinc-950 -translate-y-1/2 transition-all duration-1000 z-0 rounded-full"
        style={{
          width: `calc(${(currentIndex / (steps.length - 1)) * 100}% )`,
        }}
      />

      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx <= currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <div
            key={step.label}
            className="relative z-10 flex flex-col items-center w-24 shrink-0"
          >
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 shadow-xl ${
                isActive
                  ? "bg-zinc-950 border-zinc-950 text-white scale-110"
                  : "bg-white border-white text-zinc-300"
              }`}
            >
              {isCurrent ? (
                <Icon size={20} className={`${step.color} animate-pulse`} />
              ) : isActive ? (
                <CheckCircle2 size={20} className="text-yellow-400" />
              ) : (
                <Icon size={18} />
              )}
            </div>
            <div className="mt-4 text-center">
              <p
                className={`text-[11px] font-black uppercase tracking-tight ${isActive ? "text-zinc-950" : "text-zinc-800"}`}
              >
                {step.label}
              </p>
              {isCurrent && (
                <span className="block text-[8px] font-black text-zinc-950 uppercase tracking-widest mt-1 animate-bounce">
                  Live
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
