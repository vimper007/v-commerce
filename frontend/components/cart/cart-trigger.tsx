"use client";

import { useCart } from "@/lib/cart-context";

export function CartTrigger() {
  const { cart, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      className="relative flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-1.5 text-xs font-medium text-neutral-200 transition-all duration-150 hover:border-neutral-700 hover:bg-neutral-800 active:scale-95 shadow-sm"
    >
      <span>🛒 Cart</span>
      {cart.itemCount > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-neutral-950 animate-in fade-in zoom-in-50">
          {cart.itemCount}
        </span>
      )}
    </button>
  );
}
