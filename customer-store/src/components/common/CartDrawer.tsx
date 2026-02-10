import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useNavigate } from "react-router-dom";

export const CartDrawer = () => {
  const { items, removeItem, getTotalPrice } = useCartStore();
  const navigate = useNavigate();

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

        <div className="mt-8 space-y-4 overflow-y-auto max-h-[60vh]">
          {items.length === 0 ? (
            <p className="text-zinc-500 text-center py-10">
              Your cart is empty.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-zinc-900 pb-4"
              >
                <div className="flex gap-4 items-center">
                  {/* Show Media (Image/Video) thumbnail */}
                  <div className="h-16 w-16 bg-zinc-900 rounded-md overflow-hidden">
                    <img
                      src={item.images?.[0]?.media_url}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-cyan-400 text-xs">
                      ₹{item.selling_price} x {item.quantity}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-zinc-600 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="absolute bottom-0 left-0 w-full p-6 border-t border-zinc-800 bg-zinc-950">
            <div className="flex justify-between mb-4 font-bold">
              <span>Total Amount:</span>
              <span className="text-cyan-400">₹{getTotalPrice()}</span>
            </div>
            {/* THIS BUTTON NAVIGATES TO THE CHECKOUT PAGE */}
            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-cyan-400 transition-colors"
            >
              Go to Checkout
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
