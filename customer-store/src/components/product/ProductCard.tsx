import React, { useState } from "react";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/types/index";
import { ProductMedia } from "./ProductMedia";
import { useCartStore } from "@/store/useCartStore";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const [activeIndex, setActiveIndex] = useState(0);

  const existing = cartItems.find((item) => item.id === product.id);
  const quantity = existing?.quantity || 0;
  const stock = product.stock_quantity;
  const images = product.images || [];

  const isOut = stock <= 0;
  const maxReached = quantity >= stock;

  return (
    <div className="group relative flex flex-col h-full bg-zinc-950 rounded-[2.5rem] border border-white/5 transition-all duration-500 hover:border-yellow-500/40">
      {/* MEDIA SECTION */}
      <div className="relative aspect-square w-full overflow-hidden rounded-[2.2rem] bg-zinc-900 m-1">
        <div className="absolute inset-0 transition-transform duration-1000 group-hover:scale-105 h-full w-full object-cover">
          <ProductMedia
            media={[images[activeIndex] || {}]}
            alt={product.name}
          />
        </div>

        {/* IMAGE SWITCHING ZONES */}
        {images.length > 1 && (
          <div className="absolute inset-0 z-30 flex">
            {images.map((_, idx) => (
              <div
                key={idx}
                className="h-full flex-1 cursor-pointer"
                onMouseEnter={() => setActiveIndex(idx)}
              />
            ))}
          </div>
        )}

        {/* BLUE IN-CART BADGE (Stays Blue as requested) */}
        <div className="absolute top-5 left-5 z-40">
          {!isOut && quantity > 0 && (
            <div className="bg-cyan-500 px-3 py-1.5 rounded-full text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-cyan-500/20">
              <ShoppingCart className="h-3 w-3" />
              {quantity} IN CART
            </div>
          )}
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex flex-col flex-1 p-7">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.2em]">
              {product.category || "Premium"}
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight leading-none line-clamp-1">
              {product.name}
            </h3>
          </div>
          <p className="text-xl font-black text-white italic tracking-tighter">
            ₹{product.selling_price.toLocaleString()}
          </p>
        </div>

        {/* CLAMPED DESCRIPTION */}
        <p className="text-xs leading-relaxed text-zinc-500 mb-8 line-clamp-2 min-h-10">
          {product.description || "Refined design meets functional excellence."}
        </p>

        {/* FULL WIDTH YELLOW BUTTON */}
        <button
          disabled={isOut || maxReached}
          onClick={() => addItem(product)}
          className={`relative w-full h-12 flex items-center justify-center rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300
            ${
              isOut || maxReached
                ? "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5"
                : "bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 shadow-xl shadow-yellow-500/10"
            }`}
        >
          <span className="flex items-center gap-2">
            {isOut ? (
              "Sold Out"
            ) : maxReached ? (
              "Limit Reached"
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                Add to Cart
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
};
