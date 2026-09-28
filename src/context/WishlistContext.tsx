import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { WishlistItem, Product } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface WishlistContextValue {
  items: WishlistItem[];
  productIds: Set<string>;
  loading: boolean;
  toggle: (product: Product) => Promise<void>;
  has: (productId: string) => boolean;
  refresh: () => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!session) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('wishlists')
      .select('id, product_id, created_at, product:products(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setItems(
        data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          product_id: row.product_id as string,
          created_at: row.created_at as string,
          product: row.product as Product,
        }))
      );
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const productIds = new Set(items.map((i) => i.product_id));

  const toggle = useCallback(
    async (product: Product) => {
      if (!session) return;
      const existing = items.find((i) => i.product_id === product.id);
      if (existing) {
        await supabase.from('wishlists').delete().eq('id', existing.id);
        setItems((prev) => prev.filter((i) => i.product_id !== product.id));
      } else {
        const { data } = await supabase
          .from('wishlists')
          .insert({ user_id: session.user.id, product_id: product.id })
          .select('id, product_id, created_at')
          .single();
        if (data) {
          setItems((prev) => [
            { id: data.id, product_id: data.product_id, created_at: data.created_at, product },
            ...prev,
          ]);
        }
      }
    },
    [session, items]
  );

  const has = useCallback((productId: string) => productIds.has(productId), [productIds]);

  const value: WishlistContextValue = {
    items,
    productIds,
    loading,
    toggle,
    has,
    refresh: fetchWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
