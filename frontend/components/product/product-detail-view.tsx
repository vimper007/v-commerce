"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { UserNav } from "@/components/auth/user-nav";
import { CartTrigger } from "@/components/cart/cart-trigger";

export interface PDPVariant {
  id: string;
  sku: string;
  price: string;
  color?: string | null;
  size?: string | null;
  imageUrl?: string | null;
  stock: number;
}

export interface PDPProduct {
  id: string;
  title: string;
  description: string | null;
  brand: string | null;
  imageUrl: string | null;
  rating: string | null;
  reviewCount: number | null;
  badge: string | null;
  originalPrice: string | null;
  status: string;
  category: string | null;
  variants: PDPVariant[];
}

export function ProductDetailView({ product }: { product: PDPProduct }) {
  const { addToCart, isLoading: cartLoading } = useCart();
  const router = useRouter();

  const [selectedVariant, setSelectedVariant] = useState<PDPVariant>(() => {
    return product.variants[0] || {
      id: "fallback-v1",
      sku: "SKU-DEF",
      price: "199.99",
      stock: 10,
    };
  });

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  // Gallery images: use variant image, product image, and high-res alternatives
  const galleryImages = [
    selectedVariant.imageUrl || product.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
  ];
  const [activeImage, setActiveImage] = useState(galleryImages[0]);

  const currentPrice = parseFloat(selectedVariant.price || "0");
  const origPrice = product.originalPrice ? parseFloat(product.originalPrice) : null;
  const hasDiscount = origPrice && origPrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : null;
  const isOutOfStock = selectedVariant.stock <= 0;
  const isLowStock = selectedVariant.stock > 0 && selectedVariant.stock <= 10;

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setIsAdding(true);
    try {
      await addToCart(selectedVariant.id, quantity);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    setIsBuyingNow(true);
    try {
      await addToCart(selectedVariant.id, quantity);
      router.push("/checkout");
    } finally {
      setIsBuyingNow(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col font-sans">
      {/* 1. AMAZON-GRADE HEADER */}
      <header className="sticky top-0 z-50 bg-[#131921] border-b border-[#232f3e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-16">
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

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-300">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              ← Storefront
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{product.category || "Electronics"}</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400 font-semibold">{product.brand || "Brand"}</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <UserNav />
            <CartTrigger />
          </div>
        </div>
      </header>

      {/* 2. MAIN PRODUCT VIEW */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: MULTI-IMAGE GALLERY (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col-reverse sm:flex-row gap-4 items-start sticky top-24">
            {/* Thumbnails */}
            <div className="flex sm:flex-col gap-2 shrink-0 overflow-x-auto">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-lg p-1 bg-[#161b22] border transition-all cursor-pointer overflow-hidden ${
                    activeImage === img ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-800 hover:border-slate-600"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Angle ${i}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>

            {/* Main Stage Image */}
            <div className="flex-1 w-full aspect-square bg-[#161b22] border border-slate-800 rounded-2xl p-6 flex items-center justify-center relative overflow-hidden shadow-xl">
              {product.badge && (
                <div
                  className={`absolute top-3 left-3 z-10 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded shadow-md ${
                    product.badge.includes("Best Seller")
                      ? "bg-amber-500 text-slate-950"
                      : "bg-[#232f3e] text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {product.badge}
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt={product.title}
                className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>

          {/* CENTER: PRODUCT SPECS & DETAILS (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Brand Link */}
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                Brand: {product.brand || "Official Store"}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white mt-1 leading-snug tracking-tight">
                {product.title}
              </h1>
            </div>

            {/* Rating Stars & Social Proof */}
            <div className="flex items-center gap-2 text-xs border-b border-slate-800 pb-3">
              <span className="text-amber-400 font-bold">{product.rating || "4.85"}</span>
              <div className="flex text-amber-400 text-sm">
                {"★".repeat(Math.round(parseFloat(product.rating || "5")))}
                {"☆".repeat(5 - Math.round(parseFloat(product.rating || "5")))}
              </div>
              <span className="text-slate-400">•</span>
              <span className="text-indigo-400 hover:underline cursor-pointer">
                {(product.reviewCount || 1200).toLocaleString()} customer ratings
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-400">1K+ bought in past month</span>
            </div>

            {/* Price Box */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5">
                {hasDiscount && (
                  <span className="text-xl font-bold text-rose-400">
                    -{discountPercent}%
                  </span>
                )}
                <span className="text-3xl font-extrabold font-mono text-white">
                  ${currentPrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-slate-500 line-through">
                    List: ${origPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-400 font-semibold">FREE Returns</span>
                <span>•</span>
                <span>All prices include import duties & taxes</span>
              </p>
            </div>

            {/* Color / Variant Selector */}
            {product.variants.length > 1 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300">
                  Select Edition / Color:{" "}
                  <span className="text-amber-400 font-bold">{selectedVariant.color || selectedVariant.sku}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(v);
                        if (v.imageUrl) setActiveImage(v.imageUrl);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selectedVariant.id === v.id
                          ? "border-amber-500 bg-amber-500/10 text-amber-300 ring-2 ring-amber-500/20"
                          : "border-slate-800 bg-[#161b22] text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {v.color || v.size || v.sku} • ${parseFloat(v.price).toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* "About this item" / Bullet Points */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">About this item</h2>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Commercial grade hardware with precision-engineered tactile feedback and response.</li>
                <li>Fully backed by PostgreSQL ACID row-level reservation guarantees for zero oversell.</li>
                <li>Instant Redis cart synchronisation and background BullMQ invoice delivery.</li>
                <li>Comprehensive 30-day no-questions-asked refund and replacement policy.</li>
              </ul>
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-1 pt-3 border-t border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Product Overview</h2>
                <p className="text-xs text-slate-400 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>

          {/* RIGHT: THE CLASSIC AMAZON BUY BOX (3 Cols) */}
          <div className="lg:col-span-3">
            <div className="bg-[#161b22] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 sticky top-24">
              <div className="space-y-1">
                <div className="text-2xl font-bold font-mono text-white">
                  ${currentPrice.toFixed(2)}
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <p>
                    <span className="text-amber-400 font-bold">FREE delivery</span>{" "}
                    <span className="font-bold text-white">Tomorrow</span>
                  </p>
                  <p className="text-slate-400 text-[11px]">Order within 02h 45m for priority dispatch</p>
                </div>
              </div>

              {/* Delivery Pin */}
              <div className="text-xs text-slate-400 flex items-center gap-1.5 py-1 border-y border-slate-800">
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>Deliver to <span className="text-slate-200 font-medium">San Francisco 94105</span></span>
              </div>

              {/* Stock Status */}
              <div>
                {isOutOfStock ? (
                  <p className="text-sm font-bold text-rose-500">Currently unavailable.</p>
                ) : isLowStock ? (
                  <p className="text-sm font-bold text-amber-400">
                    Only {selectedVariant.stock} left in stock - order soon.
                  </p>
                ) : (
                  <p className="text-sm font-bold text-emerald-400">In Stock</p>
                )}
              </div>

              {/* Quantity Dropdown */}
              {!isOutOfStock && (
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="pdp-quantity-select" className="text-slate-400 font-medium">Quantity:</label>
                  <select
                    id="pdp-quantity-select"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                    aria-label="Select quantity to purchase"
                    className="bg-slate-900 border border-slate-700 text-white rounded-md px-2.5 py-1 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Buy Box Actions */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={cartLoading || isAdding || isOutOfStock}
                  className="w-full py-3 rounded-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAdding ? "Adding to Cart..." : "Add to Cart"}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={cartLoading || isBuyingNow || isOutOfStock}
                  className="w-full py-3 rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs transition-colors shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isBuyingNow ? "Reserving Checkout..." : "Buy Now"}
                </button>
              </div>

              {/* Trust & Guarantee Rows */}
              <div className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Ships from</span>
                  <span className="font-medium text-slate-200">V-Commerce Prime</span>
                </div>
                <div className="flex justify-between">
                  <span>Sold by</span>
                  <span className="font-medium text-slate-200">{product.brand || "Official Brand Store"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Returns</span>
                  <span className="text-emerald-400">30-day refund guarantee</span>
                </div>
                <div className="flex justify-between">
                  <span>Security</span>
                  <span className="text-slate-300">ACID Row-Lock Protection</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CUSTOMER REVIEWS BREAKDOWN SECTION */}
        <section className="border-t border-slate-800 pt-10 space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Customer Reviews & Ratings</h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Star Distribution Column */}
            <div className="md:col-span-4 space-y-3 bg-[#161b22] border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-white">{product.rating || "4.8"}</span>
                <div>
                  <div className="flex text-amber-400 text-sm">★★★★★</div>
                  <p className="text-xs text-slate-400">{(product.reviewCount || 1000).toLocaleString()} global ratings</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                {[
                  { star: "5 star", pct: "78%" },
                  { star: "4 star", pct: "14%" },
                  { star: "3 star", pct: "5%" },
                  { star: "2 star", pct: "2%" },
                  { star: "1 star", pct: "1%" },
                ].map((row) => (
                  <div key={row.star} className="flex items-center gap-2">
                    <span className="w-12 text-slate-400">{row.star}</span>
                    <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: row.pct }} />
                    </div>
                    <span className="w-8 text-right text-slate-400 font-mono">{row.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="md:col-span-8 space-y-4">
              <div className="p-4 rounded-xl bg-[#161b22] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                      MK
                    </div>
                    <span className="font-semibold text-slate-200">Marcus K.</span>
                    <span className="text-emerald-400 font-medium">✓ Verified Purchase</span>
                  </div>
                  <span className="text-slate-500">2 days ago</span>
                </div>
                <div className="flex text-amber-400 text-xs">★★★★★</div>
                <p className="font-bold text-xs text-white">Exceptional quality and instant delivery confirmation.</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ordered with the 1-day delivery guarantee. Arrived in immaculate packaging, and the hardware performance matches the specs exactly. Checkout experience was seamless.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#161b22] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px]">
                      SL
                    </div>
                    <span className="font-semibold text-slate-200">Sarah L.</span>
                    <span className="text-emerald-400 font-medium">✓ Verified Purchase</span>
                  </div>
                  <span className="text-slate-500">1 week ago</span>
                </div>
                <div className="flex text-amber-400 text-xs">★★★★★</div>
                <p className="font-bold text-xs text-white">Best investment for my workstation this year.</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Superb battery life and acoustic clarity. The checkout reservation locked the last in-stock item for me while I finished typing my address.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
