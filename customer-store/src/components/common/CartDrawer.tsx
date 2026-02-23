import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Trash2, Plus, Minus, PackageX } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const CartDrawer = () => {
  const { items, deleteProduct, updateQuantity, getTotalPrice } =
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
          <ShoppingCart className="h-6 w-6 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
          {totalItemsCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-black text-white shadow-lg">
              {totalItemsCount}
            </span>
          )}
        </div>
      </SheetTrigger>

      <SheetContent className="bg-background border-l border-border text-foreground w-full sm:max-w-md flex flex-col p-0 transition-colors duration-300">
        {/* HEADER */}
        <SheetHeader className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground text-xl font-black uppercase tracking-tight">
              Cart Overview
            </SheetTitle>
            <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full">
              {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}
            </span>
          </div>
        </SheetHeader>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
              <ShoppingCart className="h-10 w-10 mb-2 text-muted-foreground" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Cart is Empty
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
                  className="flex gap-4 p-3 rounded-2xl bg-secondary/30 border border-border hover:border-cyan-500/30 transition-all duration-300"
                >
                  {/* IMAGE */}
                  <div className="relative h-20 w-20 shrink-0 bg-muted rounded-xl overflow-hidden border border-border">
                    <img
                      src={currentImage}
                      className="h-full w-full object-cover"
                      alt={item.name}
                    />
                    {isOut && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-[2px]">
                        <PackageX className="h-5 w-5 text-destructive" />
                      </div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs uppercase text-foreground line-clamp-1 tracking-tight">
                        {item.name}
                      </h4>

                      <button
                        onClick={() => deleteProduct(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <p className="text-[11px] font-bold text-muted-foreground mt-1">
                      {item.quantity} × ₹{item.selling_price.toLocaleString()} =
                      <span className="text-cyan-600 dark:text-cyan-400 ml-1 font-black">
                        ₹{(item.quantity * item.selling_price).toLocaleString()}
                      </span>
                    </p>

                    {/* QUANTITY CONTROLS */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center bg-background rounded-lg border border-border overflow-hidden">
                        <button
                          onClick={() =>
                            item.quantity === 1
                              ? deleteProduct(item.id)
                              : updateQuantity(item.id, item.quantity - 1)
                          }
                          className="h-7 w-7 flex items-center justify-center hover:bg-muted text-foreground transition-colors"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 size={12} className="text-destructive" />
                          ) : (
                            <Minus size={12} />
                          )}
                        </button>

                        <span className="w-8 text-center text-xs font-black text-foreground">
                          {item.quantity}
                        </span>

                        <button
                          disabled={item.quantity >= item.stock_quantity}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="h-7 w-7 flex items-center justify-center hover:bg-muted text-foreground transition-colors disabled:opacity-20"
                        >
                          <Plus size={12} />
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
          <div className="p-6 border-t border-border bg-secondary/20">
            <div className="flex justify-between mb-5">
              <div>
                <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                  Total Payable
                </span>
                <span className="text-2xl font-black text-foreground tracking-tighter">
                  ₹{getTotalPrice().toLocaleString()}
                </span>
              </div>
            </div>

            <button
              disabled={hasOutOfStock}
              onClick={() => navigate("/checkout")}
              className={cn(
                "w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95",
                hasOutOfStock
                  ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                  : "bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-600/20",
              )}
            >
              {hasOutOfStock ? "Stock Discrepancy" : "Proceed to Checkout"}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
