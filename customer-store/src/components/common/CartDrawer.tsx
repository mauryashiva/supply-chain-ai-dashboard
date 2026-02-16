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
          <ShoppingCart className="h-6 w-6 text-gray-500 group-hover:text-blue-600 transition-colors" />
          {totalItemsCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow">
              {totalItemsCount}
            </span>
          )}
        </div>
      </SheetTrigger>

      <SheetContent className="bg-white border-gray-200 text-gray-900 w-full sm:max-w-md flex flex-col p-0">
        {/* HEADER */}
        <SheetHeader className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-gray-900 text-xl font-bold uppercase">
              Cart Overview
            </SheetTitle>
            <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full">
              {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}
            </span>
          </div>
        </SheetHeader>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <ShoppingCart className="h-10 w-10 mb-2 text-gray-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
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
                  className="flex gap-4 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:shadow-sm transition"
                >
                  {/* IMAGE */}
                  <div className="relative h-20 w-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={currentImage}
                      className="h-full w-full object-cover"
                      alt={item.name}
                    />
                    {isOut && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <PackageX className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between">
                      <h4 className="font-bold text-xs uppercase text-gray-800 line-clamp-1">
                        {item.name}
                      </h4>

                      <button
                        onClick={() => deleteProduct(item.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <p className="text-[11px] font-bold text-gray-600 mt-1">
                      {item.quantity} × ₹{item.selling_price.toLocaleString()} =
                      <span className="text-blue-600 ml-1">
                        ₹{(item.quantity * item.selling_price).toLocaleString()}
                      </span>
                    </p>

                    {/* QUANTITY */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center bg-white rounded-lg border border-gray-200">
                        <button
                          onClick={() =>
                            item.quantity === 1
                              ? deleteProduct(item.id)
                              : updateQuantity(item.id, item.quantity - 1)
                          }
                          className="h-7 w-7 flex items-center justify-center hover:bg-gray-100"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 size={12} className="text-red-500" />
                          ) : (
                            <Minus size={12} />
                          )}
                        </button>

                        <span className="w-7 text-center text-xs font-bold">
                          {item.quantity}
                        </span>

                        <button
                          disabled={item.quantity >= item.stock_quantity}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
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
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between mb-5">
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">
                  Total Payable
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  ₹{getTotalPrice().toLocaleString()}
                </span>
              </div>
            </div>

            <button
              disabled={hasOutOfStock}
              onClick={() => navigate("/checkout")}
              className={`w-full h-12 rounded-xl font-bold text-xs uppercase transition
              ${
                hasOutOfStock
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {hasOutOfStock ? "Stock Error" : "Proceed to Checkout"}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
