import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types";

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
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

        if (existingItem) {
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
      removeItem: (productId) =>
        set({ items: get().items.filter((item) => item.id !== productId) }),
      updateQuantity: (productId, quantity) =>
        set({
          items: get().items.map((item) =>
            item.id === productId
              ? { ...item, quantity: Math.max(0, quantity) }
              : item,
          ),
        }),
      clearCart: () => set({ items: [] }),
      getTotalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.selling_price * item.quantity,
          0,
        ),
    }),
    { name: "shopping-cart" }, // LocalStorage key
  ),
);
