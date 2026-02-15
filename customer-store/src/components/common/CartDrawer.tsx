import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  PackageX,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export const CartDrawer = () => {
  // Added deleteProduct from your updated store
  const { items, removeItem, deleteProduct, updateQuantity, getTotalPrice } =
    useCartStore();
  const navigate = useNavigate();

  const hasOutOfStock = items.some((item) => item.stock_quantity <= 0);
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

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
        <div className="relative group cursor-pointer p-2">
          <ShoppingCart className="h-6 w-6 text-zinc-400 transition-colors group-hover:text-cyan-400" />
          {totalItemsCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-black text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              {totalItemsCount}
            </span>
          )}
        </div>
      </SheetTrigger>

      <SheetContent className="bg-zinc-950/98 border-zinc-800/50 text-white w-full sm:max-w-md backdrop-blur-3xl flex flex-col p-0">
        <SheetHeader className="p-8 pb-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white text-2xl font-black italic tracking-tighter uppercase">
              Bag_Overview
            </SheetTitle>
            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full">
              {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}
            </span>
          </div>
        </SheetHeader>

        {/* ITEMS LIST */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-hide">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
              <ShoppingCart className="h-10 w-10 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Bag is Empty
              </p>
            </div>
          ) : (
            items.map((item) => {
              const isOut = item.stock_quantity <= 0;
              const currentImage =
                item.images?.[imageIndex[item.id] || 0]?.media_url ||
                "/placeholder.png";

              return (
                <div
                  key={item.id}
                  className="group relative flex gap-4 p-3 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-all duration-300"
                >
                  {/* IMAGE UNIT */}
                  <div className="relative h-20 w-20 shrink-0 bg-zinc-900 rounded-xl overflow-hidden border border-white/5">
                    <img
                      src={currentImage}
                      className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                      alt={item.name}
                    />
                    {isOut && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center">
                        <PackageX className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>

                  {/* INFO UNIT */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-xs tracking-tight text-zinc-200 line-clamp-1 uppercase">
                        {item.name}
                      </h4>

                      {/* FIXED GLOBAL DELETE BUTTON - Uses deleteProduct */}
                      <button
                        type="button"
                        onClick={() => deleteProduct(item.id)}
                        className="text-zinc-600 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <p className="text-[10px] font-medium text-zinc-500 mt-1">
                      {item.quantity} × ₹{item.selling_price.toLocaleString()} ={" "}
                      <span className="text-cyan-400 font-black italic">
                        ₹{(item.quantity * item.selling_price).toLocaleString()}
                      </span>
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      {/* QUANTITY CONTROLS */}
                      <div className="flex items-center bg-zinc-900/50 rounded-lg border border-white/5 p-0.5">
                        <button
                          onClick={() => {
                            if (item.quantity === 1) {
                              deleteProduct(item.id); // Also uses deleteProduct here for consistency
                            } else {
                              updateQuantity(item.id, item.quantity - 1);
                            }
                          }}
                          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-400 transition-colors"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 size={10} className="text-red-500" />
                          ) : (
                            <Minus size={10} />
                          )}
                        </button>

                        <span className="text-[10px] font-black w-7 text-center tabular-nums text-white">
                          {item.quantity}
                        </span>

                        <button
                          disabled={item.quantity >= item.stock_quantity}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-400 disabled:opacity-10 transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER ACTION ZONE */}
        {items.length > 0 && (
          <div className="p-8 bg-black/40 border-t border-white/5 backdrop-blur-md">
            <div className="flex justify-between items-end mb-6">
              <div className="space-y-0.5">
                <span className="block text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                  Total_Payable
                </span>
                <span className="text-3xl font-black text-white italic tracking-tighter">
                  ₹{getTotalPrice().toLocaleString()}
                </span>
              </div>
            </div>

            <button
              disabled={hasOutOfStock}
              onClick={() => navigate("/checkout")}
              className={`group/btn relative w-full h-14 flex items-center justify-center overflow-hidden rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500
                ${
                  hasOutOfStock
                    ? "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5"
                    : "bg-yellow-500 text-black hover:bg-yellow-400 active:scale-95 shadow-[0_10px_30px_rgba(234,179,8,0.15)]"
                }`}
            >
              <span className="relative z-10 flex items-center gap-3">
                {hasOutOfStock ? "Stock_Error" : "Proceed to Checkout"}
                {!hasOutOfStock && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                )}
              </span>
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
