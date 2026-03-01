import React from "react";
import {
  Package,
  IndianRupee,
  User,
  Truck,
  Anchor,
  Clock,
  Receipt,
  Phone,
  MapPin,
  Mail,
  Hash,
} from "lucide-react";
import { PaymentStatusBadge } from "./OrderComponents";
import type { Order } from "@/types";
import { ModalLayout } from "@/layouts/ModalLayout";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

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
      <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400 flex items-center gap-2">
        <Icon size={14} /> {label}
      </dt>
      <dd className="text-base font-semibold text-gray-900 dark:text-white">
        {value || (
          <span className="text-gray-400 dark:text-zinc-500 italic">N/A</span>
        )}
      </dd>
    </div>
  );

  return (
    <ModalLayout
      isOpen={isOpen && !!order}
      onClose={onClose}
      title={`Order Details #${order?.id}`}
      size="max-w-4xl"
    >
      {order && (
        <div className="flex flex-col gap-6">
          {/* ---------------- CUSTOMER DETAILS ---------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailItem
              icon={User}
              label="Customer Name"
              value={order.address?.full_name}
            />

            <DetailItem
              icon={Mail}
              label="Customer Email"
              value={order.user?.email}
            />

            <DetailItem
              icon={Phone}
              label="Phone Number"
              value={order.address?.phone_number}
            />

            <DetailItem
              icon={Hash}
              label="Address ID Used"
              value={order.address?.id}
            />

            <DetailItem
              icon={MapPin}
              label="Delivery Address"
              value={
                <div className="text-sm leading-6 text-gray-600 dark:text-zinc-300">
                  {order.address?.flat}, {order.address?.area},{" "}
                  {order.address?.landmark && `${order.address?.landmark}, `}
                  {order.address?.city}, {order.address?.state} -{" "}
                  {order.address?.pincode}, {order.address?.country}
                </div>
              }
            />

            <DetailItem
              icon={IndianRupee}
              label="Payment"
              value={
                <div className="flex flex-col gap-2 text-sm">
                  <PaymentStatusBadge status={order.payment_status} />
                  <span className="text-gray-600 dark:text-zinc-300">
                    {order.payment_method}
                  </span>
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
          </div>

          {/* ---------------- FINANCIAL SUMMARY ---------------- */}
          <div className="border-t border-gray-200 dark:border-zinc-800 pt-6">
            <h3 className="text-sm text-gray-600 dark:text-zinc-400 mb-3 flex items-center gap-2">
              <Receipt size={14} /> Financial Summary
            </h3>

            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-zinc-400">
                  Taxable Amount
                </span>
                <span className="font-semibold">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>

              {(order.discount_value || 0) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>
                    Discount (
                    {order.discount_type === "percentage"
                      ? `${order.discount_value}%`
                      : "Fixed"}
                    )
                  </span>
                  <span>
                    -
                    {formatCurrency(
                      order.discount_type === "percentage"
                        ? (order.subtotal * (order.discount_value || 0)) / 100
                        : order.discount_value || 0,
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-zinc-400">
                  GST (Included)
                </span>
                <span>{formatCurrency(order.total_gst)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-zinc-400">
                  Shipping
                </span>
                <span>+{formatCurrency(order.shipping_charges || 0)}</span>
              </div>

              <div className="border-t border-gray-200 dark:border-zinc-700 my-2"></div>

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-cyan-600 dark:text-cyan-400">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* ---------------- ITEMS ---------------- */}
          <div className="border-t border-gray-200 dark:border-zinc-800 pt-4">
            <h3 className="text-sm text-gray-600 dark:text-zinc-400 mb-2">
              Items ({order.items.length})
            </h3>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.product.sku}
                  className="flex justify-between bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg"
                >
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {item.product.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-500">
                      SKU: {item.product.sku}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-zinc-300">
                    Qty: {item.quantity} × ₹{item.product.selling_price}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---------------- FOOTER ---------------- */}
          <div className="border-t border-gray-200 dark:border-zinc-800 pt-4 text-center text-xs text-gray-500 dark:text-zinc-500 flex justify-center items-center gap-2">
            <Clock size={12} />
            Order placed on {order.order_date}
          </div>
        </div>
      )}
    </ModalLayout>
  );
};
