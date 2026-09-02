"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  category: string;
  image?: string;
  quantity: number;
  // Snapshot of available stock at the time this line was added/refreshed --
  // used to cap the quantity stepper in the cart. The checkout API still
  // re-checks the live figure since stock can change while an item sits
  // in the cart.
  stock?: number;
};

type CartContextValue = {
  lines: CartLine[];
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
  isHydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "gj-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Reading persisted state on mount (not reacting to a prop/state
    // change) -- this one-time hydration from localStorage has to happen
    // after mount to avoid a server/client markup mismatch.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupted/blocked storage
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore write failures (private browsing, quota, etc.)
    }
  }, [lines, isHydrated]);

  const addItem = useCallback((item: Omit<CartLine, "quantity">, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === item.productId);
      if (existing) {
        const cap = item.stock ?? existing.stock;
        const nextQuantity = existing.quantity + quantity;
        return prev.map((l) =>
          l.productId === item.productId
            ? { ...l, ...item, quantity: cap != null ? Math.min(nextQuantity, cap) : nextQuantity }
            : l
        );
      }
      const cap = item.stock;
      return [...prev, { ...item, quantity: cap != null ? Math.min(quantity, cap) : quantity }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) =>
            l.productId === productId
              ? { ...l, quantity: l.stock != null ? Math.min(quantity, l.stock) : quantity }
              : l
          )
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines]
  );
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  const value: CartContextValue = {
    lines,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    subtotal,
    itemCount,
    isHydrated,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
