import React from "react";
import { ShoppingCart, Eye } from "lucide-react";
import type { Product } from "@/types/index";
import { ProductMedia } from "./ProductMedia";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 transition-all hover:border-zinc-700 hover:shadow-2xl">
      {/* Image/Video Container */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-800">
        {/* Using ProductMedia to handle both Images and Videos from Cloudinary */}
        <ProductMedia media={product.images || []} alt={product.name} />

        {/* Video Badge - Shown if the first media item is a video */}
        {product.images?.[0]?.media_type === "video" && (
          <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-[10px] px-2 py-0.5 rounded-full text-white border border-white/20 z-10">
            VIDEO
          </span>
        )}

        {/* Hover Overlay Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 z-20">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-cyan-400 transition-colors">
            <Eye className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Product Info Section */}
      <div className="mt-4 px-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
              {product.category || "General"}
            </p>
            <h3 className="mt-1 font-semibold text-zinc-100 line-clamp-1">
              {product.name}
            </h3>
          </div>
          <span className="text-lg font-bold text-white">
            ₹{product.selling_price}
          </span>
        </div>

        <p className="mt-2 text-xs text-zinc-500 line-clamp-2 min-h-8">
          {product.description || "No description available."}
        </p>

        {/* Add to Cart Button */}
        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 py-2.5 text-sm font-bold text-black hover:bg-cyan-400 transition-all active:scale-95">
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );
};
