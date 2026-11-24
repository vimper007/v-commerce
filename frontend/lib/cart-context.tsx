"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "./api-config";

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  color?: string | null;
  size?: string | null;
  imageUrl?: string | null;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  updatedAt: string;
}

interface CartContextType {
  cart: Cart;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  isLoading: boolean;
}

const emptyCart: Cart = {
  id: "",
  items: [],
  subtotal: 0,
  itemCount: 0,
  updatedAt: new Date().toISOString(),
};

const CartContext = createContext<CartContextType | null>(null);

const CART_ID_KEY = "vcommerce_cart_id";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize or fetch cart on mount
  useEffect(() => {
    let storedCartId = localStorage.getItem(CART_ID_KEY);
    if (!storedCartId) {
      storedCartId = crypto.randomUUID();
      localStorage.setItem(CART_ID_KEY, storedCartId);
    }

    const fetchCart = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/cart?cartId=${storedCartId}`, {
          headers: { "x-cart-id": storedCartId },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) setCart(json.data);
        }
      } catch (err) {
        console.warn("Could not load cart from Redis, starting fresh session:", err);
      }
    };

    fetchCart();
  }, []);

  const addToCart = useCallback(async (variantId: string, quantity: number = 1) => {
    setIsLoading(true);
    let cartId = localStorage.getItem(CART_ID_KEY);
    if (!cartId) {
      cartId = crypto.randomUUID();
      localStorage.setItem(CART_ID_KEY, cartId);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, variantId, quantity }),
      });
      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
        setIsOpen(true);
      }
    } catch (err) {
      console.warn("Failed to sync cart with backend:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (variantId: string, quantity: number) => {
    const cartId = localStorage.getItem(CART_ID_KEY);
    if (!cartId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/cart/items/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, quantity }),
      });
      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
      }
    } catch (err) {
      console.warn("Failed to update item quantity:", err);
    }
  }, []);

  const removeItem = useCallback(async (variantId: string) => {
    const cartId = localStorage.getItem(CART_ID_KEY);
    if (!cartId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/cart/items/${variantId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId }),
      });
      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
      }
    } catch (err) {
      console.warn("Failed to remove item from cart:", err);
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart(emptyCart);
    localStorage.removeItem(CART_ID_KEY);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
