import { createContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
  variant?: string;
  size?: string;
}

interface CartState {
  items: CartItem[];
}

interface UserState {
  isAuthenticated: boolean;
  user: any | null; // Define properly if needed
}

interface GlobalState {
  cart: CartState;
  user: UserState;
  activeOrder: any | null;
}

interface GlobalContextType extends GlobalState {
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  login: (userData: any) => void;
  logout: () => void;
  setActiveOrder: (order: any) => void;
}

const initialState: GlobalState = {
  cart: { items: [] },
  user: { isAuthenticated: false, user: null },
  activeOrder: null,
};

export const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartState>(initialState.cart);
  const [user, setUser] = useState<UserState>(initialState.user);
  const [activeOrder, setActiveOrder] = useState<any | null>(initialState.activeOrder);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.items.find(
        (i) => i.product.id === item.product.id && i.variant === item.variant && i.size === item.size
      );
      if (existingItem) {
        return {
          ...prevCart,
          items: prevCart.items.map((i) =>
            i === existingItem ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
        };
      }
      return { ...prevCart, items: [...prevCart.items, item] };
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => ({
      ...prevCart,
      items: prevCart.items.filter((item) => item.product.id !== productId),
    }));
  };

  const clearCart = () => setCart({ items: [] });

  const login = (userData: any) => setUser({ isAuthenticated: true, user: userData });
  const logout = () => setUser({ isAuthenticated: false, user: null });

  return (
    <GlobalContext.Provider
      value={{
        cart,
        user,
        activeOrder,
        addToCart,
        removeFromCart,
        clearCart,
        login,
        logout,
        setActiveOrder,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

// useGlobalState hook has been moved or ignored by eslint directly
