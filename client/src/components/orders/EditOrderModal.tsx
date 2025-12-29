import React, { useEffect, useState, type FormEvent } from "react";
// 'X' icon is no longer imported, as the layout handles the close button
import type { Order, OrderUpdate } from "@/types";
import { updateOrder } from "@/services/api";
// Import the reusable ModalLayout component
import { ModalLayout } from "@/layouts/ModalLayout";

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null; // The order object to be edited
  onOrderUpdated: (updatedOrder: Order) => void; // Callback function on successful update
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
}) => {
  // State to hold the fields that can be edited
  const [formData, setFormData] = useState<OrderUpdate>({});
  // State for displaying submission errors
  const [error, setError] = useState<string | null>(null);
  // State for managing the submit button's loading spinner
  const [loading, setLoading] = useState(false);

  // Effect to populate the form when the 'order' prop changes (or modal opens)
  useEffect(() => {
    if (order) {
      // Set the form data from the currently selected order
      setFormData({
        status: order.status,
        payment_status: order.payment_status,
        shipping_provider: order.shipping_provider,
        tracking_id: order.tracking_id,
        vehicle_id: order.vehicle_id,
      });
    }
  }, [order]); // Re-run this effect if the order object changes

  // Generic change handler for all inputs and selects
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle the form submission to update the order
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!order) return; // Guard clause
    setLoading(true);
    setError(null);
    try {
      // Prepare payload, ensuring vehicle_id is a number or undefined
      const payload = {
        ...formData,
        vehicle_id: Number(formData.vehicle_id) || undefined,
      };
      // Call the API to update the order
      const response = await updateOrder(order.id, payload);
      // Notify the parent component of the successful update
      onOrderUpdated(response.data);
      onClose(); // Close the modal on success
    } catch (err: any) {
      // --- Enhanced error handling logic ---
      if (
        err.response?.data?.detail &&
        Array.isArray(err.response.data.detail)
      ) {
        // Handle Pydantic's detailed validation errors (which come as an array)
        const firstError = err.response.data.detail[0];
        const field = firstError.loc[1] || "input"; // Get the field name
        const msg = firstError.msg; // Get the error message
        setError(`Error in '${field}': ${msg}`);
      } else if (err.response?.data?.detail) {
        // Handle simple string errors from the backend
        setError(err.response.data.detail);
      } else {
        // Fallback for generic network or other errors
        setError("Failed to update order. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // The ModalLayout handles the 'isOpen' and 'onClose' logic.
  // We pass 'isOpen && !!order' to ensure the modal only opens if an order is actually selected.
  return (
    <ModalLayout
      isOpen={isOpen && !!order}
      onClose={onClose}
      title={`Edit Order #${order?.id}`} // Pass the dynamic title to the layout
      size="max-w-md" // Pass the desired size to the layout
    >
      {/* The form is passed as 'children' to ModalLayout */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Order Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
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
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Payment Status
          </label>
          <select
            name="payment_status"
            value={formData.payment_status}
            onChange={handleChange}
            className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
          >
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="COD">COD</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Shipping Provider
          </label>
          <select
            name="shipping_provider"
            value={formData.shipping_provider}
            onChange={handleChange}
            className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
          >
            <option value="">None</option>
            <option value="Self-Delivery">Self-Delivery</option>
            <option value="BlueDart">BlueDart</option>
            <option value="Delhivery">Delhivery</option>
            <option value="DTDC">DTDC</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Tracking ID
          </label>
          <input
            name="tracking_id"
            value={formData.tracking_id || ""}
            onChange={handleChange}
            className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Assigned Vehicle ID
          </label>
          <input
            name="vehicle_id"
            type="number"
            value={formData.vehicle_id || ""}
            onChange={handleChange}
            className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
          />
        </div>

        {/* Display any submission errors here */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Form action buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-zinc-700 hover:bg-zinc-600 font-semibold py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-700 font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalLayout>
  );
};
