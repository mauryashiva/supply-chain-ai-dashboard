import React from "react";
import {
  Package,
  IndianRupee,
  Calendar,
  User,
  Truck,
  Anchor,
  Clock,
} from "lucide-react";
// REMOVED: The dayjs import is no longer needed.
import { PaymentStatusBadge } from "./OrderComponents";
import type { Order } from "@/types";
import { ModalLayout } from "@/layouts/ModalLayout";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const DetailItem = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex flex-col gap-1">
      <dt className="text-sm font-medium text-zinc-400 flex items-center gap-2">
        <Icon size={14} /> {label}
      </dt>
      <dd className="text-base text-white font-semibold">
        {value || <span className="text-zinc-500 italic">N/A</span>}
      </dd>
    </div>
  );

  return (
    <ModalLayout
      isOpen={isOpen && !!order}
      onClose={onClose}
      title={`Order Details #${order?.id}`}
      size="max-w-3xl"
    >
      {order && (
        <div className="flex flex-col gap-6 -mt-2">
          {/* --- Main Details Section (No changes here) --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            <DetailItem
              icon={User}
              label="Customer"
              value={
                <div className="flex flex-col text-sm leading-6">
                  <span className="font-bold text-white">
                    {order.customer_name}
                  </span>
                  <span className="text-zinc-300">{order.customer_email}</span>
                  <span className="text-zinc-400 mt-1">
                    {order.shipping_address}
                  </span>
                </div>
              }
            />
            <DetailItem
              icon={IndianRupee}
              label="Payment"
              value={
                <div className="flex flex-col gap-2 text-sm">
                  <PaymentStatusBadge status={order.payment_status} />
                  <span className="text-zinc-300">{order.payment_method}</span>
                </div>
              }
            />
            <DetailItem
              icon={Calendar}
              label="Amount"
              value={new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(order.amount)}
            />
            <DetailItem
              icon={Anchor}
              label="Shipping Provider"
              value={order.shipping_provider}
            />
            <DetailItem
              icon={Package}
              label="Tracking ID"
              value={<span className="font-mono">{order.tracking_id}</span>}
            />
            <DetailItem
              icon={Truck}
              label="Assigned Vehicle"
              value={
                order.vehicle_id ? `Vehicle #${order.vehicle_id}` : "Unassigned"
              }
            />
          </div>

          {/* --- Items Section (No changes here) --- */}
          <div className="border-t border-zinc-800 pt-4 flex flex-col gap-2">
            <dt className="text-sm font-medium text-zinc-400">
              Items in this Order ({order.items.length})
            </dt>
            <dd className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.product.sku}
                  className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg text-sm"
                >
                  <div>
                    <span className="font-semibold text-white">
                      {item.product.name}
                    </span>
                    <span className="text-zinc-400 font-mono ml-2">
                      ({item.product.sku})
                    </span>
                  </div>
                  <span className="font-mono text-cyan-400 font-semibold">
                    Qty: {item.quantity}
                  </span>
                </div>
              ))}
            </dd>
          </div>

          {/* --- Footer Section --- */}
          <div className="border-t border-zinc-800 pt-4 text-center">
            <p className="text-xs text-zinc-500 flex items-center justify-center gap-2">
              <Clock size={12} />
              {/* CHANGED: Removed all formatting. Now it will directly display the standard date string from the backend. */}
              Order Placed On {order.order_date}
            </p>
          </div>
        </div>
      )}
    </ModalLayout>
  );
};
