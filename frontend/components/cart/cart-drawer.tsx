"use client";

import { useCart } from "@/lib/cart-context";
import Link from "next/link";
import Image from "next/image";

export function CartDrawer() {
  const { cart, isOpen, closeCart, updateQuantity, removeItem } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      {/* Slide-over panel */}
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col justify-between border-l border-[#232f3e] bg-[#161b22] p-6 shadow-2xl text-slate-100">
        {/* Drawer Header */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">Shopping Cart</span>
              <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-xs font-mono font-bold">
                {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
              </span>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>✓ Eligible for FREE Prime Next-Day Delivery</span>
          </div>

          {/* Cart Item List */}
          <div className="mt-5 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-290px)] pr-1">
            {cart.items.length === 0 ? (
              <div className="py-20 text-center">
                <span className="text-4xl">🛒</span>
                <p className="mt-4 text-sm font-bold text-white">Your shopping cart is empty</p>
                <p className="mt-1 text-xs text-slate-400">Add electronics and prime deals to proceed.</p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex items-start gap-3.5 rounded-xl border border-slate-800 bg-[#0d1117] p-3.5 transition-colors hover:border-slate-700"
                >
                  {/* Thumbnail Image */}
                  <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">📦</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                    <span className="block font-mono text-[11px] text-slate-400 mt-0.5">
                      {item.sku}
                      {item.color ? ` • ${item.color}` : ""}
                      {item.size ? ` • ${item.size}` : ""}
                    </span>
                    <span className="mt-1.5 block text-xs font-bold text-amber-400 font-mono">
                      ${(item.price * item.quantity).toFixed(2)}
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          (${item.price.toFixed(2)} ea)
                        </span>
                      )}
                    </span>

                    {/* Quantity Selector */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex h-7 items-center rounded-lg border border-slate-700 bg-[#161b22] px-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="flex h-5 w-5 items-center justify-center text-xs text-slate-400 hover:text-white"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-mono text-xs font-semibold text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="flex h-5 w-5 items-center justify-center text-xs text-slate-400 hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 text-xs">Subtotal ({cart.itemCount} items):</span>
              <span className="text-xl font-bold font-mono text-white">${cart.subtotal.toFixed(2)}</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Eligible for FREE Prime Next-Day shipping at checkout.
            </p>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 py-3 text-xs font-black text-slate-950 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              Proceed to Checkout ({cart.itemCount} items)
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
