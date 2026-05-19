import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, ProductVariant } from "@/types";

interface CartItem extends Product {
  quantity: number;
  selectedVariant?: ProductVariant; // Support for selected variant
  cartItemId: string; // Unique ID composed of product_id + variant_id
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, selectedVariant?: ProductVariant) => void;
  syncPrices: (latestProducts: Product[]) => void;
  removeItem: (cartItemId: string) => void;
  deleteProduct: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // SYNC LOGIC: Updates persisted items with fresh data from the API
      syncPrices: (latestProducts) => {
        const currentItems = get().items;
        if (currentItems.length === 0) return;

        const updatedItems = currentItems.map((item) => {
          const latestProduct = latestProducts.find((p) => p.id === item.id);

          if (latestProduct) {
            // Also sync the selected variant if one exists
            let latestVariant = item.selectedVariant;
            if (item.selectedVariant && latestProduct.variants) {
              latestVariant = latestProduct.variants.find(v => v.id === item.selectedVariant?.id) || item.selectedVariant;
            }

            return {
              ...item,
              name: latestProduct.name,
              selling_price: latestVariant?.price_override ?? latestProduct.selling_price,
              stock_quantity: latestVariant ? latestVariant.stock_quantity : latestProduct.stock_quantity,
              images: latestProduct.images,
              sku: latestVariant?.sku ?? latestProduct.sku,
              gst_rate: (latestProduct as any).gst_rate || 0,
              selectedVariant: latestVariant,
            };
          }
          return item;
        });

        set({ items: updatedItems });
      },

      addItem: (product, selectedVariant) => {
        const items = get().items;
        const cartItemId = selectedVariant ? `${product.id}-${selectedVariant.id}` : `${product.id}-default`;
        const existingItem = items.find((item) => item.cartItemId === cartItemId);

        const availableStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
        const activePrice = selectedVariant?.price_override ?? product.selling_price;

        if (availableStock <= 0) return;

        if (existingItem) {
          if (existingItem.quantity >= availableStock) return;
          set({
            items: items.map((item) =>
              item.cartItemId === cartItemId
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          });
        } else {
          set({ items: [...items, {
            ...product,
            quantity: 1,
            cartItemId,
            selectedVariant,
            selling_price: activePrice, // Snapshot price for UI
            stock_quantity: availableStock
          }] });
        }
      },

      removeItem: (cartItemId) => {
        const items = get().items;
        const existingItem = items.find((item) => item.cartItemId === cartItemId);
        if (!existingItem) return;

        if (existingItem.quantity > 1) {
          set({
            items: items.map((item) =>
              item.cartItemId === cartItemId
                ? { ...item, quantity: item.quantity - 1 }
                : item,
            ),
          });
        } else {
          set({ items: items.filter((item) => item.cartItemId !== cartItemId) });
        }
      },

      deleteProduct: (cartItemId) => {
        set({
          items: get().items.filter((item) => item.cartItemId !== cartItemId),
        });
      },

      updateQuantity: (cartItemId, quantity) => {
        const items = get().items;
        const existingItem = items.find((item) => item.cartItemId === cartItemId);
        if (!existingItem) return;

        if (quantity <= 0) {
          set({ items: items.filter((item) => item.cartItemId !== cartItemId) });
          return;
        }

        const safeQty = Math.min(quantity, existingItem.stock_quantity);
        set({
          items: items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity: safeQty } : item,
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.selling_price * item.quantity,
          0,
        ),
    }),
    {
      name: "shopping-cart",
      // Optional: Ensure drawer state isn't persisted if you add it later
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
