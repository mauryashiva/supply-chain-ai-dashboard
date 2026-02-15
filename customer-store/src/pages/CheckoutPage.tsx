import React, { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { Navbar } from "@/components/common/Navbar";
import { useNavigate } from "react-router-dom";
import { placeOrder } from "@/services/api";
import { AddressSelector } from "@/components/checkout/AddressSelector";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  ArrowRight,
  PackageX,
} from "lucide-react";

export const CheckoutPage: React.FC = () => {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  const hasOutOfStock = items.some((item) => item.stock_quantity <= 0);
  const totalAmount = getTotalPrice();

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddress) {
      alert("Please select or add a delivery address.");
      return;
    }

    if (hasOutOfStock) {
      alert("Some items are out of stock. Please adjust your cart.");
      return;
    }

    setLoading(true);

    const orderPayload = {
      address_id: selectedAddress.id,
      payment_method: "COD",
      discount_value: 0,
      discount_type: "fixed",
      shipping_charges: 0,
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
      alert("Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* HEADER SECTION */}
        <div className="mb-12">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">
            Secure_Checkout
          </h1>
          <p className="text-zinc-500 text-sm tracking-widest font-bold">
            STEP 02 / REVIEW & FINALIZE
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* LEFT — ADDRESS & DETAILS */}
          <div className="flex-1 space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-l-2 border-cyan-500 pl-4">
                <Truck className="text-cyan-500 h-5 w-5" />
                <h2 className="text-xl font-bold uppercase tracking-tight">
                  Delivery_Address
                </h2>
              </div>
              <div className="bg-zinc-900/30 rounded-3xl border border-white/5 p-2">
                <AddressSelector onSelect={setSelectedAddress} />
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 border-l-2 border-zinc-700 pl-4">
                <CreditCard className="text-zinc-500 h-5 w-5" />
                <h2 className="text-xl font-bold uppercase tracking-tight">
                  Payment_Method
                </h2>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                    <span className="text-xs font-black text-cyan-400">
                      COD
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Cash On Delivery</p>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
                      Default Selection
                    </p>
                  </div>
                </div>
                <div className="h-5 w-5 rounded-full border-2 border-cyan-500 flex items-center justify-center">
                  <div className="h-2.5 w-2.5 bg-cyan-500 rounded-full" />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT — ORDER SUMMARY (Amazon-Style Sticky) */}
          <div className="w-full lg:w-100">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 sticky top-28 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 border-b border-white/5 pb-4">
                Order_Invoice
              </h3>

              <div className="space-y-6 max-h-87.5 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="group relative">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-zinc-200 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-[10px] font-black text-zinc-500 uppercase italic">
                          Qty: {item.quantity} × ₹
                          {item.selling_price.toLocaleString()}
                        </p>
                      </div>
                      <span className="text-sm font-black text-white italic">
                        ₹{(item.selling_price * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    {item.stock_quantity <= 0 && (
                      <div className="mt-2 flex items-center gap-2 text-red-500">
                        <PackageX size={12} />
                        <span className="text-[10px] font-bold uppercase">
                          Critical_Out_of_Stock
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* TOTALS AREA */}
              <div className="mt-10 pt-8 border-t border-white/10 space-y-4">
                <div className="flex justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                  <span>Shipping</span>
                  <span className="text-cyan-400">Calculated_at_Door</span>
                </div>

                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-zinc-400 uppercase tracking-tighter italic">
                    Total_Payable
                  </span>
                  <div className="text-right">
                    <span className="block text-3xl font-black text-white italic tracking-tighter">
                      ₹{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* HIGH IMPACT CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={
                  loading ||
                  items.length === 0 ||
                  hasOutOfStock ||
                  !selectedAddress
                }
                className={`mt-8 group/btn relative w-full h-16 flex items-center justify-center overflow-hidden rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500
                  ${
                    hasOutOfStock || !selectedAddress || items.length === 0
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-white/5"
                      : "bg-yellow-500 text-black hover:bg-yellow-400 hover:shadow-[0_0_40px_rgba(234,179,8,0.2)] active:scale-95"
                  }`}
              >
                <span className="relative z-10 flex items-center gap-3">
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-black border-t-transparent animate-spin rounded-full" />
                  ) : hasOutOfStock ? (
                    "Inventory Error"
                  ) : !selectedAddress ? (
                    "Select Address"
                  ) : (
                    <>
                      Place Order
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </>
                  )}
                </span>
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-600 uppercase">
                <ShieldCheck className="h-3 w-3" />
                End-to-End Secure Processing
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
