import React, { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { Navbar } from "@/components/common/Navbar";
import { useNavigate } from "react-router-dom";
import { placeOrder } from "@/services/api";

export const CheckoutPage: React.FC = () => {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
  });

  const hasOutOfStock = items.some((item) => item.stock_quantity <= 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasOutOfStock) {
      alert("Some items are out of stock. Please adjust your cart.");
      return;
    }

    setLoading(true);

    const orderPayload = {
      customer_name: customer.name,
      customer_email: customer.email,
      phone_number: customer.phone,
      shipping_address: customer.address,
      payment_method: "COD",
      payment_status: "Pending",
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      await placeOrder(orderPayload);

      alert("Success! Your order has been placed.");
      clearCart();
      navigate("/");
    } catch (error) {
      console.error("Order failed:", error);
      alert("Failed to place order. Stock may have changed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <main className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
        {/* LEFT: SHIPPING FORM */}
        <div className="flex-1 space-y-8">
          <h2 className="text-2xl font-bold border-b border-zinc-800 pb-4">
            Shipping Information
          </h2>

          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-6">
            {/* NAME */}
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

            {/* EMAIL */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Email</label>
              <input
                required
                type="email"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                onChange={(e) =>
                  setCustomer({ ...customer, email: e.target.value })
                }
              />
            </div>

            {/* PHONE */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Phone</label>
              <input
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
              />
            </div>

            {/* ADDRESS */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Shipping Address
              </label>
              <textarea
                required
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                onChange={(e) =>
                  setCustomer({ ...customer, address: e.target.value })
                }
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading || items.length === 0 || hasOutOfStock}
              className={`w-full font-bold py-4 rounded-xl transition-all
                ${
                  hasOutOfStock
                    ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    : "bg-cyan-500 hover:bg-cyan-600 text-black"
                }`}
            >
              {hasOutOfStock
                ? "Some items out of stock"
                : loading
                  ? "Processing Order..."
                  : `Confirm Order - ₹${getTotalPrice()}`}
            </button>
          </form>
        </div>

        {/* RIGHT: ORDER SUMMARY */}
        <div className="w-full lg:w-96 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-fit sticky top-24">
          <h3 className="text-xl font-bold mb-6">Order Summary</h3>

          <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
            {items.map((item) => {
              const total = item.selling_price * item.quantity;
              const isOut = item.stock_quantity <= 0;
              const isLow =
                item.stock_quantity > 0 && item.stock_quantity <= 10;

              return (
                <div key={item.id} className="border-b border-zinc-900 pb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-cyan-400">₹{total}</span>
                  </div>

                  {/* Stock Status */}
                  {isOut ? (
                    <p className="text-red-500 text-[11px]">Out of stock</p>
                  ) : isLow ? (
                    <p className="text-yellow-400 text-[11px]">
                      Only {item.stock_quantity} left
                    </p>
                  ) : null}
                </div>
              );
            })}
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
