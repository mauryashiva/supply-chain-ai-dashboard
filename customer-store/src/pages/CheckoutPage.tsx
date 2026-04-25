import React, { useEffect, useState, useCallback } from "react";
import { useCartStore } from "@/store/useCartStore";
import { Navbar } from "@/components/common/Navbar";
import { useNavigate } from "react-router-dom";

// Modular Service Imports
import {
  orderService,
  catalogService,
  paymentService, // Ensure you add this to your services/index.ts
} from "@/services";

import { AddressSelector } from "@/components/checkout/AddressSelector";
import { useInventorySocket } from "@/hooks/useInventorySocket";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  ArrowRight,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
import type { OrderCreateRequest } from "@/types";

type CheckoutPaymentMethod = "COD" | "RAZORPAY";

interface RazorpaySuccessPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as {
    response?: { data?: { detail?: string; message?: string } };
  };
  return (
    err?.response?.data?.detail || err?.response?.data?.message || fallback
  );
};

const loadRazorpayScript = async (): Promise<boolean> => {
  if ((window as any).Razorpay) {
    return true;
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const CheckoutPage: React.FC = () => {
  const { items, getTotalPrice, clearCart, syncPrices } = useCartStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<CheckoutPaymentMethod>("COD");

  // Price validation using the new catalogService
  const validateAndSync = useCallback(async () => {
    try {
      const response = await catalogService.getProducts();
      if (response.data) {
        syncPrices(response.data);
      }
    } catch (error) {
      console.error("Real-time price validation failed:", error);
    }
  }, [syncPrices]);

  useInventorySocket(validateAndSync);

  useEffect(() => {
    if (items.length > 0) {
      validateAndSync();
    } else {
      navigate("/");
    }
  }, [items.length, validateAndSync, navigate]);

  const hasOutOfStock = items.some((item) => item.stock_quantity <= 0);
  const totalAmount = getTotalPrice();

  // Helper to build payload matching the Backend's OrderCreateRequest
  const buildOrderPayload = (
    paymentMethod: OrderCreateRequest["payment_method"],
  ): OrderCreateRequest => ({
    address_id: selectedAddress.id,
    payment_method: paymentMethod,
    items: items.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    })),
    discount_value: 0,
    discount_type: "fixed",
    shipping_charges: 0,
  });

  const processRazorpayPayment = async () => {
    const razorpayLoaded = await loadRazorpayScript();

    if (!razorpayLoaded) {
      alert("Unable to load Razorpay checkout. Please try again.");
      return false;
    }

    try {
      // 1. Create Razorpay Order on Backend
      const orderResponse = await paymentService.createRazorpayOrder({
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        discount_value: 0,
        discount_type: "fixed",
        shipping_charges: 0,
      });

      const { order_id, amount, currency, key_id } = orderResponse.data;

      if (!order_id || !amount || !key_id) {
        throw new Error("Invalid Razorpay order configuration");
      }

      return new Promise<boolean>((resolve) => {
        const razorpay = new (window as any).Razorpay({
          key: key_id,
          amount,
          currency: currency || "INR",
          name: "Supply Chain AI Store",
          description: "Inventory Order Payment",
          order_id,
          handler: async (response: RazorpaySuccessPayload) => {
            try {
              // 2. Verify Payment
              await paymentService.verifyPayment(response);

              // 3. Finalize Order on Backend
              await orderService.placeOrder(buildOrderPayload("UPI"));

              alert("Order confirmed! Your inventory is secured.");
              clearCart();
              navigate("/order-history");
              resolve(true);
            } catch (error) {
              console.error("Post-payment failure:", error);
              alert(
                "Payment verified but order failed. Please contact support with Order ID: " +
                  order_id,
              );
              resolve(false);
            }
          },
          prefill: {
            name: selectedAddress?.full_name,
            contact: selectedAddress?.phone_number,
          },
          theme: {
            color: "#eab308", // Yellow-500 matching your UI
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              resolve(false);
            },
          },
        });

        razorpay.open();
      });
    } catch (error) {
      alert(getApiErrorMessage(error, "Razorpay initialization failed."));
      return false;
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddress) {
      alert("Select a shipping destination.");
      return;
    }

    if (hasOutOfStock) {
      alert("One or more items are out of stock.");
      return;
    }

    setLoading(true);

    try {
      if (selectedPaymentMethod === "COD") {
        await orderService.placeOrder(buildOrderPayload("COD"));
        alert("Success! Order placed via COD.");
        clearCart();
        navigate("/order-history");
        return;
      }

      await processRazorpayPayment();
    } catch (error) {
      console.error("Order process failed:", error);
      alert(getApiErrorMessage(error, "Transaction failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-yellow-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2 text-transparent bg-clip-text bg-linear-to-r from-foreground to-muted-foreground">
            Checkout_Portal
          </h1>
          <p className="text-muted-foreground text-xs tracking-[0.4em] font-black uppercase">
            Order Verification Layer
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* LEFT COLUMN */}
          <div className="flex-1 space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-l-4 border-yellow-500 pl-4">
                <Truck className="text-yellow-500 h-6 w-6" />
                <h2 className="text-2xl font-black uppercase tracking-tight italic">
                  Logistic_Destination
                </h2>
              </div>
              <div className="bg-secondary/20 rounded-[2rem] border border-border p-4">
                <AddressSelector onSelect={setSelectedAddress} />
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 border-l-4 border-foreground pl-4">
                <CreditCard className="text-foreground h-6 w-6" />
                <h2 className="text-2xl font-black uppercase tracking-tight italic">
                  Payment_Protocol
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PaymentOption
                  id="COD"
                  title="Cash on Delivery"
                  desc="Pay at door"
                  selected={selectedPaymentMethod}
                  onSelect={setSelectedPaymentMethod}
                />
                <PaymentOption
                  id="RAZORPAY"
                  title="Digital Gateway"
                  desc="UPI / Cards / Net"
                  selected={selectedPaymentMethod}
                  onSelect={setSelectedPaymentMethod}
                />
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN — INVOICE */}
          <div className="w-full lg:w-100">
            <div className="bg-card/50 backdrop-blur-2xl border-2 border-border rounded-[3rem] p-8 sticky top-28 shadow-2xl overflow-hidden">
              {/* Decorative Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[80px] -z-10" />

              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground mb-8 text-center">
                Review_Summary
              </h3>

              <div className="space-y-6 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center group"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold truncate max-w-45">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase">
                        {item.quantity} × ₹{item.selling_price.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-sm font-black italic">
                      ₹{(item.selling_price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t-2 border-dashed border-border space-y-4">
                <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase">
                  <span>Logistic Fee</span>
                  <span className="text-green-500">Free_Tier</span>
                </div>

                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-muted-foreground uppercase italic">
                    Total
                  </span>
                  <span className="text-4xl font-black italic tracking-tighter">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={
                  loading ||
                  items.length === 0 ||
                  hasOutOfStock ||
                  !selectedAddress
                }
                className={cn(
                  "mt-8 w-full h-16 flex items-center justify-center rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                  hasOutOfStock || !selectedAddress || items.length === 0
                    ? "bg-muted text-muted-foreground"
                    : "bg-foreground text-background hover:scale-[1.02] active:scale-95 shadow-xl",
                )}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-background border-t-transparent animate-spin rounded-full" />
                ) : (
                  <span className="flex items-center gap-2">
                    {selectedPaymentMethod === "COD"
                      ? "Authorize Order"
                      : "Initialize Payment"}
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                <ShieldCheck className="h-3 w-3" />
                Encrypted Transaction
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Sub-component for Payment Options
const PaymentOption = ({ id, title, desc, selected, onSelect }: any) => (
  <button
    type="button"
    onClick={() => onSelect(id)}
    className={cn(
      "p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between",
      selected === id
        ? "border-yellow-500 bg-yellow-500/5 shadow-lg"
        : "border-border hover:border-muted-foreground/30 bg-card",
    )}
  >
    <div>
      <p className="font-bold text-sm">{title}</p>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">
        {desc}
      </p>
    </div>
    {selected === id ? (
      <CheckCircle2 className="text-yellow-500" size={20} />
    ) : (
      <Circle className="text-muted" size={20} />
    )}
  </button>
);
