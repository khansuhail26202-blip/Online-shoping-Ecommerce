import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '@/lib/types';

interface CartContextValue {
  items: CartItem[];
  count: number;
  totalCents: number;
  add: (product: Product, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'flipkart-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const add: CartContextValue['add'] = (product, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: Math.min(i.quantity + quantity, product.inventory) }
              : i
          );
        }
        return [...prev, { product, quantity: Math.min(quantity, product.inventory) }];
      });
    };

    const remove: CartContextValue['remove'] = (productId) => {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    };

    const setQuantity: CartContextValue['setQuantity'] = (productId, quantity) => {
      setItems((prev) =>
        prev
          .map((i) =>
            i.product.id === productId
              ? { ...i, quantity: Math.max(0, Math.min(quantity, i.product.inventory)) }
              : i
          )
          .filter((i) => i.quantity > 0)
      );
    };

    const clear = () => setItems([]);

    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalCents = items.reduce((sum, i) => sum + i.product.price_cents * i.quantity, 0);

    return { items, count, totalCents, add, remove, setQuantity, clear };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
