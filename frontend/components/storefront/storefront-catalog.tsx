"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { UserNav } from "@/components/auth/user-nav";
import { CartTrigger } from "@/components/cart/cart-trigger";

export interface CatalogProduct {
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
  categorySlug: string | null;
  variantId: string | null;
  price: string | null;
  sku: string | null;
  color?: string | null;
  size?: string | null;
  stock: number | null;
}

export function StorefrontCatalog({ initialProducts }: { initialProducts: CatalogProduct[] }) {
  const { addToCart, isLoading: cartLoading } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  // Group variants by product id to avoid duplicate cards on the storefront
  const uniqueProducts = useMemo(() => {
    const map = new Map<string, CatalogProduct>();
    for (const p of initialProducts) {
      if (!map.has(p.id)) {
        map.set(p.id, p);
      }
    }
    return Array.from(map.values());
  }, [initialProducts]);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return uniqueProducts
      .filter((product) => {
        if (selectedCategory !== "all" && product.categorySlug !== selectedCategory) {
          return false;
        }
        if (inStockOnly && (product.stock ?? 0) <= 0) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = product.title.toLowerCase().includes(q);
          const matchBrand = product.brand?.toLowerCase().includes(q);
          const matchCategory = product.category?.toLowerCase().includes(q);
          const matchDesc = product.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchBrand && !matchCategory && !matchDesc) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const priceA = parseFloat(a.price || "0");
        const priceB = parseFloat(b.price || "0");
        const ratingA = parseFloat(a.rating || "0");
        const ratingB = parseFloat(b.rating || "0");

        if (sortBy === "price-asc") return priceA - priceB;
        if (sortBy === "price-desc") return priceB - priceA;
        if (sortBy === "rating") return ratingB - ratingA;
        return 0; // featured default
      });
  }, [uniqueProducts, selectedCategory, searchQuery, sortBy, inStockOnly]);

  const handleQuickAdd = async (e: React.MouseEvent, product: CatalogProduct) => {
    e.preventDefault();
    if (!product.variantId) return;
    setAddingId(product.id);
    try {
      await addToCart(product.variantId, 1);
    } finally {
      setAddingId(null);
    }
  };

  const categories = [
    { slug: "all", name: "All Departments" },
    { slug: "audio", name: "Audio & Headphones" },
    { slug: "computing", name: "Computers & Laptops" },
    { slug: "gaming", name: "Gaming & Peripherals" },
    { slug: "wearables", name: "Smart Tech & Wearables" },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col font-sans">
      {/* 1. AMAZON-GRADE MAIN HEADER */}
      <header className="sticky top-0 z-50 bg-[#131921] border-b border-[#232f3e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-16">
          {/* Brand Logo */}
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

          {/* Delivery Location Widget */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 hover:outline hover:outline-1 hover:outline-white/40 p-1.5 rounded cursor-pointer transition-all">
            <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-[10px] text-slate-400 leading-none">Deliver to</p>
              <p className="font-bold text-white leading-tight">San Francisco 94105</p>
            </div>
          </div>

          {/* Central Mega Search Bar */}
          <div className="flex-1 max-w-2xl mx-2">
            <div className="flex items-center rounded-md bg-white text-slate-900 focus-within:ring-2 focus-within:ring-amber-500 shadow-sm overflow-hidden">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter products by department"
                className="bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 px-3 py-2.5 border-r border-slate-300 focus:outline-none cursor-pointer shrink-0"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Sony, MacBook, AirPods, Keychron, Samsung..."
                className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />

              <button
                type="button"
                className="bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-slate-950 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                title="Search"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* User Account & Cart Controls */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <UserNav />
            <CartTrigger />
          </div>
        </div>

        {/* 2. SUB-NAVIGATION BAR (AMAZON STYLE) */}
        <div className="bg-[#232f3e] text-xs text-slate-200 border-t border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-6 h-9 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex items-center gap-1.5 font-bold hover:text-amber-400 transition-colors whitespace-nowrap ${
                selectedCategory === "all" ? "text-amber-400" : ""
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              All Departments
            </button>

            {categories.slice(1).map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`whitespace-nowrap hover:text-amber-400 transition-colors font-medium ${
                  selectedCategory === cat.slug ? "text-amber-400 font-bold" : "text-slate-300"
                }`}
              >
                {cat.name}
              </button>
            ))}

            <span className="text-slate-500 hidden md:inline">|</span>
            <span className="text-amber-400 font-semibold cursor-pointer hidden md:inline hover:underline">
              ⚡ Lightning Deals
            </span>
            <span className="text-slate-300 cursor-pointer hidden lg:inline hover:text-white">
              Prime Free 1-Day Delivery
            </span>
            <span className="text-slate-300 cursor-pointer hidden lg:inline hover:text-white">
              Customer Service
            </span>
          </div>
        </div>
      </header>

      {/* 3. PROMO HERO / TODAY'S FEATURED DEAL BANNER */}
      <section className="bg-gradient-to-r from-[#1e293b] via-[#0f172a] to-[#1e1b4b] border-b border-slate-800 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Prime Deal Days • Limited Time Offers
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Flagship Audio & Computing Tech.
            </h1>
            <p className="text-slate-300 text-sm">
              Save up to 35% on Sony XM5, MacBook Pro M3 Max, and OLED Gaming Monitors. Genuine stock backed by ACID transaction row-level guarantees.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-xl shrink-0">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
              ⚡
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Deal of the Day</p>
              <p className="text-sm font-bold text-white">Guaranteed Fast Dispatch</p>
              <p className="text-xs text-slate-400">Order within 03h 42m for Tomorrow Delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MAIN STORE CONTENT & PRODUCT GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Results Bar / Sort & Filter Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <p className="text-sm text-slate-300">
              Showing <span className="font-bold text-white">{filteredProducts.length}</span> results
              {selectedCategory !== "all" && (
                <span>
                  {" "}
                  in <span className="text-amber-400 font-semibold">{categories.find((c) => c.slug === selectedCategory)?.name}</span>
                </span>
              )}
              {searchQuery && (
                <span>
                  {" "}
                  for &quot;<span className="text-amber-400">{searchQuery}</span>&quot;
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products"
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="featured">Featured / Best Match</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
            <p className="text-lg font-bold text-slate-300">No matching products found</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your search terms or clearing your department filter to see more items.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setInStockOnly(false);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => {
              const currentPrice = parseFloat(product.price || "0");
              const origPrice = product.originalPrice ? parseFloat(product.originalPrice) : null;
              const hasDiscount = origPrice && origPrice > currentPrice;
              const discountPercent = hasDiscount ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : null;
              const isLowStock = product.stock !== null && product.stock > 0 && product.stock <= 15;

              return (
                <div
                  key={product.id}
                  className="group bg-[#161b22] border border-slate-800/90 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-black/40"
                >
                  <div>
                    {/* Image Area with Badge */}
                    <div className="relative aspect-square w-full bg-[#0d1117] flex items-center justify-center p-4 overflow-hidden border-b border-slate-800/60">
                      {product.badge && (
                        <div
                          className={`absolute top-2.5 left-2.5 z-10 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-md ${
                            product.badge.includes("Best Seller")
                              ? "bg-amber-500 text-slate-950"
                              : product.badge.includes("Amazon's Choice")
                              ? "bg-[#232f3e] text-amber-400 border border-amber-500/30"
                              : "bg-rose-600 text-white"
                          }`}
                        >
                          {product.badge}
                        </div>
                      )}

                      {/* Prime Badge */}
                      <div className="absolute top-2.5 right-2.5 z-10 text-[10px] font-black text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/20">
                        prime
                      </div>

                      <Link href={`/products/${product.id}`} className="w-full h-full flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"}
                          alt={product.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </Link>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-2.5">
                      {/* Brand & Department */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-amber-400 uppercase tracking-wider">{product.brand || "Hardware"}</span>
                        <span>{product.category || "General"}</span>
                      </div>

                      {/* Product Title (2-line clamp) */}
                      <Link href={`/products/${product.id}`} className="block">
                        <h2 className="text-sm font-semibold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                          {product.title}
                        </h2>
                      </Link>

                      {/* Rating & Review Count */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="flex items-center text-amber-400 text-sm">
                          {"★".repeat(Math.round(parseFloat(product.rating || "5")))}
                          {"☆".repeat(5 - Math.round(parseFloat(product.rating || "5")))}
                        </div>
                        <span className="text-slate-300 font-semibold">{product.rating || "4.8"}</span>
                        <span className="text-slate-500">({(product.reviewCount || 100).toLocaleString()})</span>
                      </div>

                      {/* Price Block */}
                      <div className="pt-1">
                        <div className="flex items-baseline gap-2">
                          {hasDiscount && (
                            <span className="text-xs font-bold text-rose-400">
                              -{discountPercent}%
                            </span>
                          )}
                          <span className="text-2xl font-bold font-mono text-white">
                            ${currentPrice.toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-slate-500 line-through">
                              ${origPrice.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Delivery Guarantee */}
                        <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                          <span className="text-amber-400 font-bold">FREE delivery</span>
                          <span className="font-semibold text-white">Tomorrow</span>
                        </p>

                        {/* Stock Urgency */}
                        {isLowStock ? (
                          <p className="text-[11px] font-medium text-amber-400 mt-0.5">
                            Only {product.stock} left in stock - order soon.
                          </p>
                        ) : (
                          <p className="text-[11px] font-medium text-emerald-400 mt-0.5">
                            In Stock
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions (Bottom) */}
                  <div className="p-4 pt-0 space-y-2">
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, product)}
                      disabled={cartLoading || addingId === product.id || (product.stock ?? 0) <= 0}
                      className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/10"
                    >
                      {addingId === product.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Adding to Cart...</span>
                        </>
                      ) : (product.stock ?? 0) <= 0 ? (
                        <span>Out of Stock</span>
                      ) : (
                        <span>Add to Cart</span>
                      )}
                    </button>

                    <Link
                      href={`/products/${product.id}`}
                      className="block text-center text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
                    >
                      View Product Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. AMAZON-GRADE FOOTER */}
      <footer className="bg-[#131921] border-t border-[#232f3e] text-slate-400 text-xs mt-16">
        <div className="bg-[#232f3e] py-3 text-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-slate-200 hover:text-white font-semibold transition-colors"
          >
            Back to top ↑
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <p className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">Get to Know Us</p>
            <p className="hover:text-white cursor-pointer transition-colors">About V-Commerce</p>
            <p className="hover:text-white cursor-pointer transition-colors">Careers & Engineering</p>
            <p className="hover:text-white cursor-pointer transition-colors">Press Releases</p>
            <p className="hover:text-white cursor-pointer transition-colors">Amazon-Grade Architecture</p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">Payment Products</p>
            <p className="hover:text-white cursor-pointer transition-colors">V-Commerce Business Card</p>
            <p className="hover:text-white cursor-pointer transition-colors">Shop with Points</p>
            <p className="hover:text-white cursor-pointer transition-colors">Reload Your Balance</p>
            <p className="hover:text-white cursor-pointer transition-colors">Stripe Webhook Settlement</p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">Inventory Guarantees</p>
            <p className="hover:text-white cursor-pointer transition-colors">ACID Row-Lock Reservations</p>
            <p className="hover:text-white cursor-pointer transition-colors">Pessimistic Locking</p>
            <p className="hover:text-white cursor-pointer transition-colors">Zero-Oversell Engine</p>
            <p className="hover:text-white cursor-pointer transition-colors">BullMQ Asynchronous Queues</p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">Let Us Help You</p>
            <Link href="/orders" className="block hover:text-white transition-colors">
              Your Orders & Tracking
            </Link>
            <p className="hover:text-white cursor-pointer transition-colors">Shipping Rates & Policies</p>
            <p className="hover:text-white cursor-pointer transition-colors">Returns & Replacements</p>
            <p className="hover:text-white cursor-pointer transition-colors">Security & Privacy</p>
          </div>
        </div>

        <div className="border-t border-slate-800 py-6 text-center text-slate-500 text-[11px]">
          © 2026 V-Commerce Retail, Inc. Commercial-grade high-concurrency retail engine.
        </div>
      </footer>
    </div>
  );
}
