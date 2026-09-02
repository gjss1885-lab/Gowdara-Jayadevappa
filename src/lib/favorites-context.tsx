"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// A liked/saved saree -- just enough to render the /favorites grid without
// re-fetching the whole catalog. Mirrors the CartLine pattern in
// cart-context.tsx: client-only state persisted to localStorage, no login
// required.
export type FavoriteItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  color: string;
  category: string;
  image?: string;
};

type FavoritesContextValue = {
  items: FavoriteItem[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
  removeFavorite: (productId: string) => void;
  count: number;
  isHydrated: boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const STORAGE_KEY = "gj-favorites-v1";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupted/blocked storage
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore write failures (private browsing, quota, etc.)
    }
  }, [items, isHydrated]);

  const isFavorite = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.productId === item.productId);
      return exists ? prev.filter((i) => i.productId !== item.productId) : [...prev, item];
    });
  }, []);

  const removeFavorite = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const count = useMemo(() => items.length, [items]);

  const value: FavoritesContextValue = {
    items,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    count,
    isHydrated,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
