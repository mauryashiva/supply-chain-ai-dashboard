import React, { useEffect, useState, type FormEvent } from "react";
// 🛠️ Updated: Using type-only imports for cleaner architecture
import type { Order, OrderUpdate } from "@/types";
// 🛠️ Updated: Centralized orderService instead of standalone updateOrder
import { orderService } from "@/services/api";
import { ModalLayout } from "@/layouts/ModalLayout";

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderUpdated: (updatedOrder: Order) => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
}) => {
  const [formData, setFormData] = useState<OrderUpdate>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        status: order.status,
        payment_status: order.payment_status,
        shipping_provider: order.shipping_provider,
        tracking_id: order.tracking_id,
        vehicle_id: order.vehicle_id,
      });
      setError(null);
    }
  }, [order]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        vehicle_id: Number(formData.vehicle_id) || undefined,
      };

      // 🛠️ Updated: Changed standalone updateOrder() to orderService.updateOrder()
      const response = await orderService.updateOrder(order.id, payload);

      onOrderUpdated(response.data);
      onClose();
    } catch (err: any) {
      if (
        err.response?.data?.detail &&
        Array.isArray(err.response.data.detail)
      ) {
        const firstError = err.response.data.detail[0];
        const field = firstError.loc[1] || "input";
        const msg = firstError.msg;
        setError(`Error in '${field}': ${msg}`);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to update order. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  // Premium Adaptive Input & Select Styles
  const inputStyles =
    "w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all duration-200";

  return (
    <ModalLayout
      isOpen={isOpen && !!order}
      onClose={onClose}
      title={`Edit Order #${order?.id}`}
      size="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ORDER STATUS */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
            Order Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={inputStyles}
          >
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Returned">Returned</option>
          </select>
        </div>

        {/* PAYMENT STATUS */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
            Payment Status
          </label>
          <select
            name="payment_status"
            value={formData.payment_status}
            onChange={handleChange}
            className={inputStyles}
          >
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="COD">COD</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>

        {/* SHIPPING PROVIDER */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
            Shipping Provider
          </label>
          <select
            name="shipping_provider"
            value={formData.shipping_provider}
            onChange={handleChange}
            className={inputStyles}
          >
            <option value="">None</option>
            <option value="Self-Delivery">Self-Delivery</option>
            <option value="BlueDart">BlueDart</option>
            <option value="Delhivery">Delhivery</option>
            <option value="DTDC">DTDC</option>
          </select>
        </div>

        {/* TRACKING & VEHICLE GRID */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
              Tracking ID
            </label>
            <input
              name="tracking_id"
              type="text"
              value={formData.tracking_id || ""}
              onChange={handleChange}
              placeholder="e.g. TRK9902"
              className={inputStyles}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
              Vehicle ID
            </label>
            <input
              name="vehicle_id"
              type="number"
              value={formData.vehicle_id || ""}
              onChange={handleChange}
              placeholder="Assign ID"
              className={inputStyles}
            />
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-3">
            <p className="text-red-600 dark:text-red-400 text-xs font-semibold text-center">
              {error}
            </p>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="pt-4 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalLayout>
  );
};
