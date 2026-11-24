"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { UserNav } from "@/components/auth/user-nav";
import { CartTrigger } from "@/components/cart/cart-trigger";
import { API_BASE_URL } from "@/lib/api-config";

interface UserOrder {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  itemsCount: number;
}

export default function OrdersPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.orders) setOrders(data.orders);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load user orders:", err);
        setLoading(false);
      });
  }, [token]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading your order history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#131921] border-b border-[#232f3e] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/20">
              V
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight leading-none text-white group-hover:text-amber-400 transition-colors">
                v-commerce<span className="text-amber-500">.</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Prime Retail</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-amber-400 hover:underline font-semibold">
              ← Storefront
            </Link>
            <UserNav />
            <CartTrigger />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Your Orders</h1>
            <p className="text-xs text-slate-400 mt-1">Review, track, and settle your recent purchases</p>
          </div>
          <span className="text-xs font-mono text-slate-300 bg-[#161b22] border border-slate-800 px-3 py-1.5 rounded-lg">
            {orders.length} {orders.length === 1 ? "Order placed" : "Orders placed"}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#0d1117] border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-white">No orders found</p>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              You haven&apos;t placed any orders with this account yet. Browse our catalog for Prime deals.
            </p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-md shadow-amber-500/10"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="rounded-2xl bg-[#161b22] border border-slate-800 overflow-hidden shadow-xl"
              >
                {/* Amazon-style Order Header Strip */}
                <div className="bg-[#1f2937]/50 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Order Placed</span>
                      <span className="text-white font-semibold">
                        {new Date(ord.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Total</span>
                      <span className="font-mono font-bold text-white">${parseFloat(ord.totalAmount).toFixed(2)}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Status</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold capitalize mt-0.5 ${
                          ord.status === "paid"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : ord.status === "pending"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {ord.status === "paid" ? "✓ Paid & Settled" : ord.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px] font-mono">
                      ORDER # <span className="text-slate-200 select-all">{ord.id}</span>
                    </span>
                    <Link
                      href={`/checkout/success?orderId=${ord.id}`}
                      className="text-amber-400 hover:underline font-semibold"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Order Body */}
                <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <p className="font-bold text-white text-base">
                      {ord.status === "paid" ? "Guaranteed Delivery: Tomorrow by 8 PM" : "Reserved for 15 Minutes"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Contains {ord.itemsCount} {ord.itemsCount === 1 ? "item" : "items"} • Handled via PostgreSQL ACID row-lock fulfillment
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                      href={`/checkout/success?orderId=${ord.id}`}
                      className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs rounded-xl text-center transition-colors shadow-md shadow-amber-500/10"
                    >
                      {ord.status === "paid" ? "View Order Invoice" : "Complete Payment Now"}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
