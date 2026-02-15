import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types";

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void; // Keeps reducing by 1
  deleteProduct: (productId: number) => void; // New: Wipes the whole item
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);
        if (product.stock_quantity <= 0) return;

        if (existingItem) {
          if (existingItem.quantity >= product.stock_quantity) return;
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: 1 }] });
        }
      },

      // Logic for the Minus (-) button
      removeItem: (productId) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === productId);
        if (!existingItem) return;

        if (existingItem.quantity > 1) {
          set({
            items: items.map((item) =>
              item.id === productId
                ? { ...item, quantity: item.quantity - 1 }
                : item,
            ),
          });
        } else {
          set({ items: items.filter((item) => item.id !== productId) });
        }
      },

      // NEW: Logic for the Trash Icon (Direct Delete)
      deleteProduct: (productId) => {
        set({
          items: get().items.filter((item) => item.id !== productId),
        });
      },

      updateQuantity: (productId, quantity) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === productId);
        if (!existingItem) return;

        if (quantity <= 0) {
          set({ items: items.filter((item) => item.id !== productId) });
          return;
        }

        const safeQty = Math.min(quantity, existingItem.stock_quantity);
        set({
          items: items.map((item) =>
            item.id === productId ? { ...item, quantity: safeQty } : item,
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
    { name: "shopping-cart" },
  ),
);
