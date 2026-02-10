import React, { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { Navbar } from "@/components/common/Navbar";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const CheckoutPage: React.FC = () => {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form state for customer info
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
  });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Prepare payload based on our Backend OrderCreate schema
    const orderPayload = {
      customer_name: customer.name,
      customer_email: customer.email,
      phone_number: customer.phone,
      shipping_address: customer.address,
      payment_method: "COD", // Defaulting to Cash on Delivery for now
      payment_status: "Pending",
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      await axios.post(
        "http://localhost:8000/api/customer/orders/place-order",
        orderPayload,
      );
      alert("Success! Your order has been placed.");
      clearCart(); // Wipe cart after successful purchase
      navigate("/"); // Go back to shop
    } catch (error) {
      console.error("Order failed:", error);
      alert("Failed to place order. Please check stock levels.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <main className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
        {/* Left Side: Shipping Form */}
        <div className="flex-1 space-y-8">
          <h2 className="text-2xl font-bold border-b border-zinc-800 pb-4">
            Shipping Information
          </h2>
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Full Name
              </label>
              <input
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
              />
            </div>
            {/* Add similar inputs for Email, Phone, and Address */}
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50"
            >
              {loading
                ? "Processing Order..."
                : `Confirm Order - ₹${getTotalPrice()}`}
            </button>
          </form>
        </div>

        {/* Right Side: Order Summary Card */}
        <div className="w-full lg:w-96 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-fit sticky top-24">
          <h3 className="text-xl font-bold mb-6">Order Summary</h3>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-zinc-400">
                  {item.name} x {item.quantity}
                </span>
                <span>₹{item.selling_price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800 mt-6 pt-6 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-cyan-400">₹{getTotalPrice()}</span>
          </div>
        </div>
      </main>
    </div>
  );
};
