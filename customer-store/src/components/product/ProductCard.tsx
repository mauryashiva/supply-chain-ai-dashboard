import React from "react";
import { ShoppingCart, Eye } from "lucide-react";
import type { Product } from "@/types/index";
import { ProductMedia } from "./ProductMedia";
import { useCartStore } from "@/store/useCartStore";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

  const existing = cartItems.find((item) => item.id === product.id);
  const quantity = existing?.quantity || 0;

  const stock = product.stock_quantity;

  // Stock status
  const isOut = stock <= 0;
  const isLow = stock > 0 && stock <= 10;
  const maxReached = quantity >= stock;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-linear-to-b from-zinc-900/70 to-zinc-900/40 backdrop-blur-md p-3 transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(0,255,255,0.08)]">
      {/* MEDIA */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-800">
        <ProductMedia media={product.images || []} alt={product.name} />

        {/* Video Badge */}
        {product.images?.[0]?.media_type === "video" && (
          <span className="absolute top-2 right-2 bg-black/60 text-[10px] px-2 py-0.5 rounded-full text-white border border-white/20 z-10 backdrop-blur">
            VIDEO
          </span>
        )}

        {/* Quantity Badge */}
        {quantity > 0 && (
          <div className="absolute top-2 left-2 bg-cyan-500 text-black text-xs font-bold px-2 py-0.5 rounded-full z-20">
            {quantity} in cart
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute bottom-2 left-2 z-20">
          {isOut ? (
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">
              Out of Stock
            </span>
          ) : isLow ? (
            <span className="bg-yellow-500 text-black text-[10px] px-2 py-0.5 rounded-full">
              Low Stock
            </span>
          ) : (
            <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full">
              In Stock
            </span>
          )}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 z-20">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-cyan-400 transition-colors">
            <Eye className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="mt-4 px-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest">
              {product.category || "General"}
            </p>
            <h3 className="mt-1 font-semibold text-zinc-100 line-clamp-1">
              {product.name}
            </h3>
          </div>

          <span className="text-lg font-bold text-cyan-400">
            ₹{product.selling_price}
          </span>
        </div>

        {/* Low stock warning */}
        {isLow && (
          <p className="mt-1 text-[11px] text-yellow-400">
            Only {stock} left in stock
          </p>
        )}

        <p className="mt-2 text-xs text-zinc-500 line-clamp-2 min-h-8">
          {product.description || "No description available."}
        </p>

        {/* ADD BUTTON */}
        <button
          disabled={isOut || maxReached}
          onClick={() => addItem(product)}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all duration-200 active:scale-95
            ${
              isOut
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : maxReached
                  ? "bg-zinc-700 text-yellow-300 cursor-not-allowed"
                  : "bg-white text-black hover:bg-cyan-400"
            }`}
        >
          <ShoppingCart className="h-4 w-4" />

          {isOut
            ? "Out of Stock"
            : maxReached
              ? "Max Reached"
              : quantity > 0
                ? "Add More"
                : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};
