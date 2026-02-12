import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export const CartDrawer = () => {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const navigate = useNavigate();

  const hasOutOfStock = items.some((item) => item.stock_quantity <= 0);

  // Image auto-rotation state per item
  const [imageIndex, setImageIndex] = useState<Record<number, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => {
        const updated: Record<number, number> = {};
        items.forEach((item) => {
          const total = item.images?.length || 0;
          if (total > 1) {
            updated[item.id] = ((prev[item.id] || 0) + 1) % total;
          }
        });
        return { ...prev, ...updated };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [items]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="relative cursor-pointer hover:text-cyan-400">
          <ShoppingCart className="h-6 w-6" />
          {items.length > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-black">
              {items.length}
            </span>
          )}
        </div>
      </SheetTrigger>

      <SheetContent className="bg-zinc-950 border-zinc-800 text-white w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-white text-xl">
            Your Shopping Cart
          </SheetTitle>
        </SheetHeader>

        {/* ITEMS */}
        <div className="mt-8 space-y-5 overflow-y-auto max-h-[60vh] pr-1">
          {items.length === 0 ? (
            <p className="text-zinc-500 text-center py-10">
              Your cart is empty.
            </p>
          ) : (
            items.map((item) => {
              const isOut = item.stock_quantity <= 0;
              const isLow =
                item.stock_quantity > 0 && item.stock_quantity <= 10;
              const total = item.selling_price * item.quantity;

              const currentImage =
                item.images?.[imageIndex[item.id] || 0]?.media_url ||
                "/placeholder.png";

              return (
                <div key={item.id} className="border-b border-zinc-900 pb-5">
                  <div className="flex gap-4">
                    {/* IMAGE */}
                    <div className="h-20 w-20 bg-zinc-900 rounded-md overflow-hidden">
                      <img
                        src={currentImage}
                        className="h-full w-full object-cover transition-all duration-500"
                        alt=""
                      />
                    </div>

                    {/* INFO */}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>

                      {/* Price × Qty */}
                      <p className="text-xs text-zinc-400 mt-1">
                        ₹{item.selling_price} × {item.quantity} ={" "}
                        <span className="text-cyan-400 font-semibold">
                          ₹{total}
                        </span>
                      </p>

                      {/* Stock */}
                      {isOut ? (
                        <p className="text-red-500 text-[11px] mt-1">
                          Out of stock
                        </p>
                      ) : isLow ? (
                        <p className="text-yellow-400 text-[11px] mt-1">
                          Only {item.stock_quantity} left
                        </p>
                      ) : (
                        <p className="text-green-400 text-[11px] mt-1">
                          In stock
                        </p>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-1 bg-zinc-800 rounded hover:bg-zinc-700"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="text-sm w-6 text-center">
                          {item.quantity}
                        </span>

                        <button
                          disabled={item.quantity >= item.stock_quantity}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className={`p-1 rounded ${
                            item.quantity >= item.stock_quantity
                              ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                              : "bg-zinc-800 hover:bg-zinc-700"
                          }`}
                        >
                          <Plus size={14} />
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-auto text-zinc-600 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        {items.length > 0 && (
          <div className="absolute bottom-0 left-0 w-full p-6 border-t border-zinc-800 bg-zinc-950">
            <div className="flex justify-between mb-4 font-bold text-lg">
              <span>Total:</span>
              <span className="text-cyan-400">₹{getTotalPrice()}</span>
            </div>

            <button
              disabled={hasOutOfStock}
              onClick={() => navigate("/checkout")}
              className={`w-full font-bold py-3 rounded-lg transition ${
                hasOutOfStock
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-white text-black hover:bg-cyan-400"
              }`}
            >
              {hasOutOfStock
                ? "Some items out of stock"
                : "Proceed to Checkout"}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
