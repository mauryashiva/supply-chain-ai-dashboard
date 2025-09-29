import React from "react";
import {
  Package,
  IndianRupee,
  User,
  Truck,
  Anchor,
  Clock,
  Tag,
  Receipt,
} from "lucide-react";
import { PaymentStatusBadge } from "./OrderComponents";
import type { Order } from "@/types";
import { ModalLayout } from "@/layouts/ModalLayout";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

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
          {/* --- Main Details Section --- */}
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

            {/* --- REPLACED Financial Summary block --- */}
            <div className="flex flex-col gap-1 md:col-span-2 border-t border-zinc-800 pt-6">
              <dt className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Receipt size={14} /> Financial Summary
              </dt>
              <dd className="text-base text-white font-semibold">
                <dl className="space-y-2 text-sm mt-2 p-4 bg-zinc-800/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <dt className="text-zinc-400">Subtotal</dt>
                    <dd className="font-mono">
                      {formatCurrency(order.subtotal)}
                    </dd>
                  </div>

                  {/* CHANGED: Added fallback '(order.discount_value || 0)' */}
                  {(order.discount_value || 0) > 0 && (
                    <div className="flex justify-between items-center text-red-400">
                      <dt className="flex items-center gap-2">
                        <Tag size={14} />
                        Discount
                        <span className="text-xs text-red-500">
                          (
                          {order.discount_type === "percentage"
                            ? `${order.discount_value || 0}%` // CHANGED: Added fallback
                            : "Fixed"}
                          )
                        </span>
                      </dt>
                      <dd className="font-mono">
                        -
                        {formatCurrency(
                          order.discount_type === "percentage"
                            ? (order.subtotal * (order.discount_value || 0)) /
                                100 // CHANGED: Added fallback
                            : order.discount_value || 0 // CHANGED: Added fallback
                        )}
                      </dd>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <dt className="text-zinc-400">Total GST</dt>
                    <dd className="font-mono">
                      +{formatCurrency(order.total_gst)}
                    </dd>
                  </div>

                  <div className="flex justify-between items-center">
                    <dt className="text-zinc-400">Shipping</dt>
                    {/* CHANGED: Added fallback '(order.shipping_charges || 0)' */}
                    <dd className="font-mono">
                      +{formatCurrency(order.shipping_charges || 0)}
                    </dd>
                  </div>

                  <div className="border-t border-zinc-700 my-2"></div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <dt>Total Amount</dt>
                    <dd className="font-mono text-cyan-400">
                      {formatCurrency(order.total_amount)}
                    </dd>
                  </div>
                </dl>
              </dd>
            </div>
          </div>

          {/* --- Items Section (Unchanged) --- */}
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

          {/* --- Footer Section (Unchanged) --- */}
          <div className="border-t border-zinc-800 pt-4 text-center">
            <p className="text-xs text-zinc-500 flex items-center justify-center gap-2">
              <Clock size={12} />
              Order Placed On {order.order_date}
            </p>
          </div>
        </div>
      )}
    </ModalLayout>
  );
};
