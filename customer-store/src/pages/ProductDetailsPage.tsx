import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Hash,
  ArrowLeft,
  Zap,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
// 1. Updated Service Import
import { catalogService } from "@/services";
import { useCartStore } from "@/store/useCartStore";
import type { Product, ProductVariant } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  /**
   * Fetches specific product details.
   * Matches backend: GET /api/customer/catalog/products/{id}
   */
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      if (id) {
        const response = await catalogService.getProductDetails(Number(id));
        setProduct(response.data);
        if (response.data.variants && response.data.variants.length > 0) {
          setSelectedVariant(response.data.variants[0]);
        }

        const recResponse = await catalogService.getRecommendations(Number(id));
        setRecommendations(recResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch product data:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleBuyNow = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) addItem(product, selectedVariant || undefined);
      navigate("/checkout");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
        <div className="text-muted-foreground font-black uppercase tracking-[0.4em] text-[10px]">
          Decrypting_Product_Data
        </div>
      </div>
    );

  if (!product)
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl mb-4 font-black uppercase italic tracking-tighter">
          Product_Not_Found
        </h2>
        <button
          onClick={() => navigate("/")}
          className="bg-muted px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-muted/80 transition-all"
        >
          Return to Hub
        </button>
      </div>
    );

  // Financial Calculations
  const stock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const isOut = stock <= 0;
  const images = product.images || [];
  const gstRate = (product as any).gst_rate || 18; // Default 18% if not provided
  const basePrice = product.selling_price || 0;
  const sellingPrice = selectedVariant?.price_override ?? basePrice;
  const taxablePrice = sellingPrice / (1 + gstRate / 100);
  const gstAmount = sellingPrice - taxablePrice;

  const hasVariants = product.variants && product.variants.length > 0;

  return (
    <div className="min-h-screen bg-background pb-24 selection:bg-yellow-500/30">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 mb-10 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-yellow-500 transition-colors"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Return_to_Inventory
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* LEFT: IMAGE GALLERY */}
          <div className="flex flex-col gap-6">
            <div className="relative aspect-square rounded-[3rem] bg-secondary/20 border border-border overflow-hidden flex items-center justify-center p-8">
              <img
                src={
                  images[selectedImageIndex]?.media_url || "/placeholder.png"
                }
                alt={product.name}
                className="max-w-full max-h-full object-contain transition-transform duration-700 hover:scale-110"
              />
              {isOut && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center">
                  <span className="bg-destructive text-destructive-foreground px-8 py-3 rounded-2xl font-black uppercase tracking-[0.3em] text-xs -rotate-12 shadow-2xl">
                    Void_Stock
                  </span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="no-scrollbar flex gap-4 overflow-x-auto py-2 justify-start">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative shrink-0 w-20 h-20 rounded-2xl border-2 transition-all duration-300 overflow-hidden bg-card ${
                      selectedImageIndex === idx
                        ? "border-yellow-500 scale-105 shadow-xl shadow-yellow-500/10"
                        : "border-border opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.media_url}
                      alt="thumb"
                      className="w-full h-full object-contain p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: PRODUCT INFO */}
          <div className="flex flex-col py-2">
            <div className="space-y-6 mb-10">
              <div className="flex flex-wrap items-center gap-4">
                <span className="bg-secondary/50 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 border border-border">
                  <Hash size={12} className="text-yellow-500" /> {product.sku}
                </span>
                <span
                  className={`text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                    isOut ? "text-rose-500" : "text-emerald-500"
                  }`}
                >
                  <Package size={14} />
                  {isOut ? "Stock_Depleted" : `Active_Inventory (${stock})`}
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-foreground leading-none italic uppercase">
                {product.name}
              </h1>
            </div>

            {/* AMAZON STYLE VARIANT SELECTION BLOCK */}
            {hasVariants && (
              <div className="mb-10 space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Select Configuration</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {product.variants!.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const variantOut = variant.stock_quantity <= 0;

                      const configParts = [];
                      if (variant.ram) configParts.push(`${variant.ram} RAM`);
                      if (variant.storage) configParts.push(`${variant.storage} Storage`);
                      if (variant.color) configParts.push(variant.color);
                      if (variant.screen_size) configParts.push(`${variant.screen_size}"`);
                      const label = configParts.length > 0 ? configParts.join(" • ") : variant.sku;

                      return (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`relative p-4 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                            isSelected
                              ? 'border-yellow-500 bg-yellow-500/10 scale-[1.02] shadow-xl shadow-yellow-500/10'
                              : 'border-border hover:border-yellow-500/50 hover:bg-secondary/50'
                          } ${variantOut ? 'opacity-40 grayscale' : ''}`}
                        >
                          <span className={`block text-xs font-bold leading-snug ${isSelected ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground'}`}>
                            {label}
                          </span>
                          <span className={`block mt-2 font-black ${isSelected ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
                            {formatCurrency(variant.price_override ?? basePrice)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PRICING CARD */}
            <div className="bg-card/50 backdrop-blur-xl border-2 border-border p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden mb-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[80px]" />

              <div className="text-5xl sm:text-7xl font-black text-yellow-500 italic tracking-tighter">
                {formatCurrency(sellingPrice)}
              </div>

              <div className="mt-8 pt-8 border-t border-border/50 space-y-3">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">
                  <span>Base Valuation</span>
                  <span className="text-foreground">
                    {formatCurrency(taxablePrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">
                  <span>Statutory GST ({gstRate}%)</span>
                  <span className="text-foreground">
                    {formatCurrency(gstAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION INTERFACE */}
            {!isOut && (
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Quantity_Select
                  </label>
                  <div className="flex items-center border-2 border-border rounded-2xl p-1.5 bg-secondary/30">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-background rounded-xl transition-all active:scale-90"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-14 text-center font-black text-xl italic tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-background rounded-xl transition-all active:scale-90"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      for (let i = 0; i < quantity; i++) addItem(product);
                    }}
                    className="h-20 bg-foreground text-background rounded-3xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
                  >
                    <ShoppingCart size={20} /> Add_to_Cart
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="h-20 bg-yellow-500 text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-yellow-500/20"
                  >
                    <Zap size={20} /> Deploy_Now
                  </button>
                </div>
              </div>
            )}

            {/* DESCRIPTION LOGS */}
            <div className="mt-16 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                  Data_Specifications
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="max-w-none">
                <p className="text-muted-foreground leading-relaxed text-base sm:text-lg font-medium italic">
                  "
                  {product.description ||
                    "System protocol: No detailed specification provided for this logistics unit."}
                  "
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMERS ALSO VIEWED SLIDER */}
        {recommendations.length > 0 && (
          <div className="mt-24 border-t border-border pt-12">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-8">
              Customers Also Viewed
            </h3>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 snap-x snap-mandatory">
              {recommendations.map((rec) => (
                <div key={rec.id} className="snap-start shrink-0 w-[280px]">
                  <ProductCard product={rec} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
