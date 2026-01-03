"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  category: string;
};

type WishlistContextValue = {
  items: WishlistItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clear: () => void;
  count: number;
  isEmpty: boolean;
  hasItems: boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = "shoestore_wishlist_v1";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem: WishlistContextValue["addItem"] = (product) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id);
      if (idx >= 0) {
        toast.info(`${product.name} is already in your wishlist`);
        return prev;
      }
      const image = product.images[0] ?? "/file.svg";
      const newItem: WishlistItem = {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image,
        brand: product.brand,
        category: product.category,
      };
      return [...prev, newItem];
    });
  };

  const removeItem: WishlistContextValue["removeItem"] = (productId) => {
    setItems((prev) => {
      return prev.filter((i) => i.productId !== productId);
    });
  };

  const isInWishlist: WishlistContextValue["isInWishlist"] = (productId) => {
    return items.some((i) => i.productId === productId);
  };

  const clear = () => {
    setItems([]);
  };

  const value = useMemo<WishlistContextValue>(() => {
    const count = items.length;
    const isEmpty = items.length === 0;
    const hasItems = items.length > 0;

    return {
      items,
      addItem,
      removeItem,
      isInWishlist,
      clear,
      count,
      isEmpty,
      hasItems,
    };
  }, [items]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return {
      items: [],
      addItem: () => {},
      removeItem: () => {},
      isInWishlist: () => false,
      clear: () => {},
      count: 0,
      isEmpty: true,
      hasItems: false,
    };
  }
  return ctx;
}
