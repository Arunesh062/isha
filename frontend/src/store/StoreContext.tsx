import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '@/data/products';
import { supabase } from '@/lib/supabase';

interface StoreContextValue {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  cartTotal: number;
  cartCount: number;
  stockByProductId: Record<string, number>;
  stockLoading: boolean;
  stockError: string;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const isha = loadFromStorage<CartItem[]>('ishalife-cart', []);
    if (isha && isha.length > 0) return isha;
    return loadFromStorage('sattva-cart', []);
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const isha = loadFromStorage<string[]>('ishalife-wishlist', []);
    if (isha && isha.length > 0) return isha;
    return loadFromStorage('sattva-wishlist', []);
  });
  const [stockByProductId, setStockByProductId] = useState<Record<string, number>>({});
  const [stockLoading, setStockLoading] = useState(true);
  const [stockError, setStockError] = useState('');

  useEffect(() => {
    supabase.from('catalog_products').select('product_id, stock').then(({ data, error }) => {
      if (error) {
        setStockError('Could not load inventory. Stock information may be outdated.');
        setStockLoading(false);
        return;
      }
      if (data) {
        setStockByProductId(Object.fromEntries(data.map((row) => [row.product_id, row.stock])));
      }
      setStockLoading(false);
    });
  }, []);

  useEffect(() => {
    const serialized = JSON.stringify(cart);
    localStorage.setItem('ishalife-cart', serialized);
    localStorage.setItem('sattva-cart', serialized);
  }, [cart]);

  useEffect(() => {
    const serialized = JSON.stringify(wishlist);
    localStorage.setItem('ishalife-wishlist', serialized);
    localStorage.setItem('sattva-wishlist', serialized);
  }, [wishlist]);

  const addToCart = (product: Product, quantity = 1) => {
    const availableStock = stockByProductId[product.id];
    if (availableStock !== undefined && availableStock < quantity) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        const capped = availableStock !== undefined ? Math.min(newQty, availableStock) : newQty;
        if (capped <= existing.quantity) return prev; // already at max
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: capped }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const availableStock = stockByProductId[productId];
    const cappedQty = availableStock !== undefined ? Math.min(quantity, availableStock) : quantity;
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: cappedQty } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        cartTotal,
        cartCount,
        stockByProductId,
        stockLoading,
        stockError,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
