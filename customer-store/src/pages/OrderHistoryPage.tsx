import { useEffect, useState } from "react";
import { getMyOrders } from "@/services/api";
import { useInventorySocket } from "@/hooks/useInventorySocket";
import { Package, ChevronDown } from "lucide-react";
import { format } from "date-fns";

/* ================= TYPES ================= */

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

/* ================= PAGE ================= */

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  /* Fetch Orders */
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

  /* First Load */
  useEffect(() => {
    fetchOrders();
  }, []);

  /* REAL-TIME AUTO REFRESH */
  useInventorySocket(() => {
    fetchOrders();
  });

  const toggleOrder = (id: number) => {
    setOpenOrderId(openOrderId === id ? null : id);
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        Loading your orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Package size={40} className="mb-3 text-zinc-500" />
        <p className="text-lg">No orders yet</p>
        <p className="text-zinc-500 text-sm">
          Place your first order to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-5 max-w-4xl">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition hover:border-zinc-700"
          >
            {/* HEADER */}
            <div
              onClick={() => toggleOrder(order.id)}
              className="flex justify-between items-center cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="bg-zinc-800 p-3 rounded-lg">
                  <Package className="text-cyan-400" />
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Order #{order.id}</p>
                  <p className="font-semibold">
                    {format(new Date(order.order_date), "PPP p")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(
                    order.status,
                  )}`}
                >
                  {order.status}
                </span>
                <ChevronDown
                  className={`transition ${
                    openOrderId === order.id ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>

            {/* DETAILS */}
            {openOrderId === order.id && (
              <div className="mt-6 border-t border-zinc-800 pt-6 space-y-4">
                {/* ITEMS */}
                {order.items.map((item, index) => {
                  const price = item.product.selling_price || 0;
                  const total = price * item.quantity;

                  return (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-zinc-500">
                          ₹{price} × {item.quantity}
                        </p>
                      </div>

                      <p className="font-semibold">₹{total.toFixed(2)}</p>
                    </div>
                  );
                })}

                {/* TOTAL */}
                <div className="border-t border-zinc-800 pt-4 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-cyan-400">
                    ₹{order.total_amount.toFixed(2)}
                  </span>
                </div>

                {/* TRACKING */}
                <TrackingStepper currentStatus={order.status} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ================= STATUS COLORS ================= */

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Delivered":
      return "bg-green-500/20 text-green-400";
    case "Processing":
      return "bg-blue-500/20 text-blue-400";
    case "Shipped":
      return "bg-purple-500/20 text-purple-400";
    case "Cancelled":
      return "bg-red-500/20 text-red-400";
    case "In Transit":
      return "bg-indigo-500/20 text-indigo-400";
    default:
      return "bg-yellow-500/20 text-yellow-400";
  }
};

/* ================= TRACKING STEPPER ================= */

const TrackingStepper = ({ currentStatus }: { currentStatus: string }) => {
  const steps = ["Pending", "Processing", "Shipped", "In Transit", "Delivered"];
  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="mt-6">
      <p className="text-sm text-zinc-400 mb-3">Order Progress</p>

      <div className="flex justify-between">
        {steps.map((step, idx) => (
          <div key={step} className="flex flex-col items-center gap-2">
            <div
              className={`h-4 w-4 rounded-full ${
                idx <= currentIndex ? "bg-cyan-400" : "bg-zinc-700"
              }`}
            />
            <p
              className={`text-xs ${
                idx <= currentIndex ? "text-white" : "text-zinc-500"
              }`}
            >
              {step}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
