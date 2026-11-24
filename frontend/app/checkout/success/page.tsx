"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/api-config";

interface OrderDetail {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state?: string | null;
    postalCode: string;
    country: string;
  } | null;
  items: Array<{
    id: string;
    variantId: string;
    productTitle: string;
    sku: string;
    size?: string | null;
    color?: string | null;
    imageUrl?: string | null;
    priceAtPurchase: string;
    quantity: number;
  }>;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { token, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const fetchOrder = () => {
    if (!orderId || !token) return;

    fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Order not found or access denied");
        return res.json();
      })
      .then((data) => {
        if (data.order) setOrder(data.order);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load order:", err);
        setError("Unable to load order confirmation details.");
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!orderId) {
      setError("No order ID specified.");
      setLoading(false);
      return;
    }
    fetchOrder();
  }, [orderId, token]);

  const handlePayNow = async () => {
    if (!orderId || !token) return;
    setIsPaying(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrder();
      }
    } catch (err) {
      console.error("Payment failed:", err);
    } finally {
      setIsPaying(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Retrieving order confirmation...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-rose-400">Order Notice</h1>
          <p className="text-slate-400 text-sm">{error || "Could not find order details."}</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 rounded-lg transition-colors text-sm"
          >
            Back to Storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#131921] border-b border-[#232f3e] py-3.5 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
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
          <Link href="/" className="text-xs text-amber-400 hover:underline font-semibold">
            ← Continue Shopping
          </Link>
        </div>
      </header>

      {/* Main Order Confirmation */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-8">
        {/* Amazon-style Order Placed Banner */}
        <div className="p-6 rounded-2xl bg-[#161b22] border border-slate-800 shadow-xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Order placed, thank you!</h1>
            <p className="text-xs text-slate-400">
              Confirmation and invoice details have been dispatched to your account email.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400">Order Number:</span>
              <span className="font-mono font-bold text-amber-400 bg-[#0d1117] px-2.5 py-1 rounded border border-slate-800 select-all">
                {order.id}
              </span>
            </div>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#161b22] border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Guaranteed Delivery</span>
              <span className="text-white font-bold text-sm">Tomorrow by 8 PM</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Payment Status</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize mt-0.5 ${
                  order.status === "paid"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : "bg-amber-950 text-amber-300 border border-amber-800"
                }`}
              >
                {order.status === "paid" ? "✓ Paid & Settled" : "⏳ Reserved (Pending)"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Total Charged</span>
              <span className="font-mono font-bold text-white text-base">${parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>

          {/* Reserved / Purchased Items */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Items Ordered</h2>
            <div className="divide-y divide-slate-800">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-lg bg-[#0d1117] border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">📦</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-white text-sm">{item.productTitle}</p>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="font-mono bg-[#0d1117] px-2 py-0.5 rounded border border-slate-800">{item.sku}</span>
                        {item.color && <span>• {item.color}</span>}
                        {item.size && <span>• {item.size}</span>}
                        <span className="text-amber-400 font-semibold">• Qty: {item.quantity}</span>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-medium">✓ Guaranteed Prime Next-Day Delivery</p>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-white text-sm shrink-0">
                    ${(parseFloat(item.priceAtPurchase) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="pt-4 border-t border-slate-800 space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Ship To
              </span>
              <p className="text-slate-200 font-semibold">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p className="text-slate-400">{order.shippingAddress.addressLine2}</p>}
              <p className="text-slate-400">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode},{" "}
                {order.shippingAddress.country}
              </p>
            </div>
          )}
        </div>

        {/* Payment Trigger Card (If Pending) */}
        {order.status !== "paid" && (
          <div className="p-5 rounded-2xl bg-[#161b22] border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <p className="font-bold text-white text-sm">Payment Pending — Complete Settlement</p>
              <p className="text-slate-400 leading-relaxed">
                Your items are reserved exclusively for 15 minutes. Complete payment now for guaranteed next-day Prime dispatch.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePayNow}
              disabled={isPaying}
              className="px-5 py-2.5 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:from-slate-800 disabled:to-slate-800 font-bold text-slate-950 rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-md shadow-amber-500/10"
            >
              {isPaying ? "Processing Payment..." : "Pay Now with Card"}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/orders"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#161b22] hover:bg-[#1f2937] border border-slate-700 text-xs font-bold text-white text-center transition-colors"
          >
            View Your Orders
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 text-center transition-colors shadow-lg shadow-amber-500/10"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d1117] text-slate-100 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
