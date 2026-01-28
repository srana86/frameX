"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api-client";

type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
  category?: string; // Product category for tracking
};

type CartContextValue = {
  items: CartItem[];
  addItem: (
    item: Omit<CartItem, "quantity">,
    qty?: number,
    options?: { eventId?: string; track?: boolean; skipCartOpen?: boolean }
  ) => void;
  removeItem: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  isEmpty: boolean;
  hasItems: boolean;
  baseShippingFee: number;
  freeShippingThreshold: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "shoestore_cart_v2";
export const FREE_SHIPPING_THRESHOLD = 75;
export const BASE_SHIPPING_FEE = 5;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [baseShippingFee, setBaseShippingFee] = useState<number>(BASE_SHIPPING_FEE);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(FREE_SHIPPING_THRESHOLD);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch { }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch { }
  }, [items]);

  // Load shipping config from tenant delivery settings (managed in dashboard)
  useEffect(() => {
    const loadShippingConfig = async () => {
      try {
        const data = await apiRequest<any>("/storefront/delivery-config", { method: "GET" });
        if (!data) return;

        if (typeof data.defaultDeliveryCharge === "number") {
          setBaseShippingFee(data.defaultDeliveryCharge);
        }

        // Optional future extension – if backend provides threshold, use it
        // If not provided, disable free shipping by setting threshold to max value
        if (typeof data.freeShippingThreshold === "number") {
          setFreeShippingThreshold(data.freeShippingThreshold);
        } else {
          // Disable free shipping by default
          setFreeShippingThreshold(Number.MAX_SAFE_INTEGER);
        }
      } catch {
        // Fail soft – keep using defaults
      }
    };

    loadShippingConfig();
  }, []);

  const addItem: CartContextValue["addItem"] = (item, qty = 1, options = {}) => {
    const { eventId, track = true, skipCartOpen = false } = options;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === item.productId && i.size === item.size && i.color === item.color);
      if (idx >= 0) {
        const copy = [...prev];
        const newQuantity = copy[idx].quantity + qty;
        copy[idx] = { ...copy[idx], quantity: newQuantity };

        // Track AddToCart server-side with stored user data
        if (track && typeof window !== "undefined") {
          import("@/lib/tracking/user-data-store")
            .then(({ getUserDataForTracking }) => {
              const userData = getUserDataForTracking();
              return import("@/lib/tracking/server-side-tracking").then(({ trackAddToCart }) => {
                trackAddToCart({
                  productId: item.productId,
                  productName: item.name,
                  price: item.price,
                  quantity: qty,
                  eventId,
                  userData,
                }).catch(() => { }); // Fail silently
              });
            })
            .catch(() => { }); // Fail silently if module not available
        }

        return copy;
      }
      // New item added
      const newItem = { ...item, quantity: qty };

      // Track AddToCart server-side with stored user data
      if (track && typeof window !== "undefined") {
        import("@/lib/tracking/user-data-store")
          .then(({ getUserDataForTracking }) => {
            const userData = getUserDataForTracking();
            return import("@/lib/tracking/server-side-tracking").then(({ trackAddToCart }) => {
              trackAddToCart({
                productId: item.productId,
                productName: item.name,
                price: item.price,
                quantity: qty,
                eventId,
                userData,
              }).catch(() => { }); // Fail silently
            });
          })
          .catch(() => { }); // Fail silently if module not available
      }

      return [...prev, newItem];
    });

    // Trigger cart badge animation by adding a class to body temporarily
    // Skip if skipCartOpen is true (e.g., Buy Now button)
    if (typeof window !== "undefined" && !skipCartOpen) {
      document.body.classList.add("cart-item-added");
      setTimeout(() => {
        document.body.classList.remove("cart-item-added");
      }, 600);
    }
  };

  const removeItem: CartContextValue["removeItem"] = (productId, size) => {
    setItems((prev) => {
      return prev.filter((i) => !(i.productId === productId && i.size === size));
    });
  };

  const updateQuantity: CartContextValue["updateQuantity"] = (productId, quantity, size) => {
    if (quantity < 1) return;
    setItems((prev) => prev.map((i) => (i.productId === productId && i.size === size ? { ...i, quantity } : i)));
  };

  const clear = () => {
    setItems([]);
  };

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((acc, i) => acc + i.quantity, 0);
    const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    // Disable free shipping by default - only apply if threshold is explicitly configured and not max value
    // If freeShippingThreshold is set to a very high value, shipping is always charged
    const isFreeShippingEnabled = freeShippingThreshold < Number.MAX_SAFE_INTEGER;
    const shipping = isFreeShippingEnabled && subtotal >= freeShippingThreshold ? 0 : subtotal > 0 ? baseShippingFee : 0;
    const total = subtotal + shipping;
    const isEmpty = items.length === 0;
    const hasItems = items.length > 0;

    return {
      items,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      count,
      subtotal,
      shipping,
      total,
      isEmpty,
      hasItems,
      baseShippingFee,
      freeShippingThreshold,
    };
  }, [items, baseShippingFee, freeShippingThreshold]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [],
      addItem: (
        _item?: Omit<CartItem, "quantity">,
        _qty?: number,
        _options?: { eventId?: string; track?: boolean; skipCartOpen?: boolean }
      ) => { },
      removeItem: () => { },
      updateQuantity: () => { },
      clear: () => { },
      count: 0,
      subtotal: 0,
      shipping: 0,
      total: 0,
      isEmpty: true,
      hasItems: false,
      baseShippingFee: BASE_SHIPPING_FEE,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    };
  }
  return ctx;
}
