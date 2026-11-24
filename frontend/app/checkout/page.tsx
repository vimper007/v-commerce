"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/api-config";

interface SavedAddress {
  id: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  // Shipping form fields
  const [fullName, setFullName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [phone, setPhone] = useState("");

  // Payment method fields
  const [paymentMode, setPaymentMode] = useState<"instant" | "hold">("instant");
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");
  const [cardHolder, setCardHolder] = useState("Alex Mercer");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("•••");

  // Delivery speed selection
  const [deliverySpeed, setDeliverySpeed] = useState<"prime" | "standard">("prime");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch saved addresses if logged in
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.addresses && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          const defaultAddr = data.addresses.find((a: SavedAddress) => a.isDefault);
          setSelectedAddressId(defaultAddr ? defaultAddr.id : data.addresses[0].id);
        }
      })
      .catch((err) => console.warn("Failed to fetch addresses:", err));
  }, [token]);

  // Pre-fill user name if available
  useEffect(() => {
    if (user) {
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      if (name) {
        setFullName(name);
        setCardHolder(name);
      }
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Securing checkout session...</span>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col items-center justify-center px-4 font-sans">
        <div className="max-w-md text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#161b22] border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Shopping Cart is empty</h1>
          <p className="text-slate-400 text-sm">
            Check out today&apos;s lightning deals and bestsellers to fill your cart.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 font-black text-slate-950 rounded-xl transition-all text-xs shadow-lg shadow-amber-500/10 uppercase tracking-wider"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const taxAmount = Number((cart.subtotal * 0.0825).toFixed(2));
  const shippingAmount = 0.0;
  const grandTotal = Number((cart.subtotal + taxAmount + shippingAmount).toFixed(2));

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg("Authentication session expired. Please sign in again.");
      return;
    }

    if (selectedAddressId === "new") {
      if (!addressLine1.trim() || !city.trim() || !postalCode.trim() || !country.trim()) {
        setErrorMsg("Please complete all required shipping address fields.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: {
        items: Array<{ variantId: string; quantity: number }>;
        shippingAddress?: {
          addressLine1: string;
          addressLine2?: string;
          city: string;
          state?: string;
          postalCode: string;
          country: string;
        };
        savedAddressId?: string;
        cartId?: string;
      } = {
        items: cart.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        cartId: cart.id || undefined,
      };

      if (selectedAddressId === "new") {
        payload.shippingAddress = {
          addressLine1,
          addressLine2: addressLine2.trim() || undefined,
          city,
          state: state.trim() || undefined,
          postalCode,
          country,
        };
      } else {
        payload.savedAddressId = selectedAddressId;
      }

      const res = await fetch(`${API_BASE_URL}/api/checkout/reserve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 409) {
          setErrorMsg(
            data.message ||
              `Stock conflict: ${data.title || "an item"} was reserved by another shopper before your order completed.`
          );
        } else {
          setErrorMsg(data.error || "Failed to complete reservation. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }

      const createdOrderId = data.order.id;

      if (paymentMode === "instant") {
        try {
          await fetch(`${API_BASE_URL}/api/payment/simulate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId: createdOrderId }),
          });
        } catch (paymentErr) {
          console.warn("Instant payment webhook trigger encountered error:", paymentErr);
        }
      }

      clearCart();
      startTransition(() => {
        router.push(`/checkout/success?orderId=${createdOrderId}`);
      });
    } catch (err) {
      console.error("Checkout request failed:", err);
      setErrorMsg("Network error communicating with the checkout service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col font-sans">
      {/* 1. AMAZON-GRADE CLEAN CHECKOUT HEADER */}
      <header className="sticky top-0 z-50 bg-[#131921] border-b border-[#232f3e] py-3.5 px-4 sm:px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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

          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">Checkout</h1>
            <span className="text-slate-400 text-sm">
              (<Link href="/" className="text-amber-400 hover:underline">{cart.itemCount} items</Link>)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="hidden sm:inline font-medium text-slate-300">256-Bit SSL Encrypted</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN CHECKOUT WORKFLOW */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm flex items-start gap-3 shadow-lg">
            <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">Checkout Notice</p>
              <p className="mt-0.5 text-xs text-rose-300">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: 3-STEP AMAZON WORKFLOW */}
          <div className="lg:col-span-8 space-y-6">
            {/* STEP 1: DELIVERY ADDRESS */}
            <div className="p-6 rounded-2xl bg-[#161b22] border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center">
                    1
                  </span>
                  <span>Select Delivery Address</span>
                </h2>
                <span className="text-xs text-slate-400">
                  Customer: <span className="font-semibold text-slate-200">{user?.email}</span>
                </span>
              </div>

              {savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2.5">
                    {savedAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`p-4 rounded-xl border text-sm cursor-pointer flex items-start gap-3.5 transition-all ${
                          selectedAddressId === addr.id
                            ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/20"
                            : "border-slate-800 bg-[#0d1117] hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping_addr"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 accent-amber-500 cursor-pointer"
                        />
                        <div className="flex-1 text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white text-sm">
                              {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Default Address"}
                            </p>
                            {addr.isDefault && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300">{addr.addressLine1}</p>
                          {addr.addressLine2 && <p className="text-slate-400">{addr.addressLine2}</p>}
                          <p className="text-slate-400">
                            {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                          </p>
                        </div>
                      </label>
                    ))}

                    <label
                      className={`p-3.5 rounded-xl border text-sm cursor-pointer flex items-center gap-3 transition-all ${
                        selectedAddressId === "new"
                          ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/20"
                          : "border-slate-800 bg-[#0d1117] hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping_addr"
                        checked={selectedAddressId === "new"}
                        onChange={() => setSelectedAddressId("new")}
                        className="accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-200">+ Deliver to a new address</span>
                    </label>
                  </div>
                </div>
              )}

              {selectedAddressId === "new" && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Mercer"
                        className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (For delivery updates)</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(415) 555-0199"
                        className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="e.g. 500 Howard Street"
                      className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Apartment, Suite, Unit, Building (Optional)</label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Suite 400"
                      className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="San Francisco"
                        className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">State / Province</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="CA"
                        className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">ZIP / Postal Code *</label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="94105"
                        className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Country / Region *</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="US">United States (US)</option>
                      <option value="CA">Canada (CA)</option>
                      <option value="GB">United Kingdom (GB)</option>
                      <option value="DE">Germany (DE)</option>
                      <option value="LK">Sri Lanka (LK)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: PAYMENT METHOD */}
            <div className="p-6 rounded-2xl bg-[#161b22] border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  <span>Payment Method</span>
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-white">VISA</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-white">MC</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-white">AMEX</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-white">DISCOVER</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Option 1: Credit / Debit Card */}
                <label
                  className={`p-4 rounded-xl border text-sm cursor-pointer block transition-all ${
                    paymentMode === "instant"
                      ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/20"
                      : "border-slate-800 bg-[#0d1117] hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <input
                      type="radio"
                      name="payment_mode"
                      checked={paymentMode === "instant"}
                      onChange={() => setPaymentMode("instant")}
                      className="mt-1 accent-amber-500 cursor-pointer"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white">Credit or Debit Card</span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Instant 1-click settlement. Guaranteed delivery protection and immediate order confirmation receipt.
                      </p>
                    </div>
                  </div>

                  {paymentMode === "instant" && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 pl-7 space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-slate-700/60 max-w-sm">
                        <div className="w-10 h-7 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-black tracking-wider">
                          VISA
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-white font-mono">Visa ending in 4242</p>
                          <p className="text-slate-400 text-[11px]">{cardHolder} • Expires 12/28</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-w-md pt-1">
                        <div>
                          <label className="block text-slate-400 mb-1">Name on card</label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="w-full px-3 py-2 bg-[#0d1117] border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Security code (CVV)</label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-24 px-3 py-2 bg-[#0d1117] border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </label>

                {/* Option 2: 15-Minute Priority Hold */}
                <label
                  className={`p-4 rounded-xl border text-sm cursor-pointer flex items-start gap-3.5 transition-all ${
                    paymentMode === "hold"
                      ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/20"
                      : "border-slate-800 bg-[#0d1117] hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_mode"
                    checked={paymentMode === "hold"}
                    onChange={() => setPaymentMode("hold")}
                    className="mt-1 accent-amber-500 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-white">Reserve & Pay Later (15-Minute Priority Hold)</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Exclusively locks stock for 15 minutes to guarantee availability while you complete payment at your leisure.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* STEP 3: REVIEW ITEMS AND DELIVERY OPTIONS */}
            <div className="p-6 rounded-2xl bg-[#161b22] border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <span>Review Items & Delivery Options</span>
                </h2>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Guaranteed Prime Delivery</span>
                </span>
              </div>

              {/* Delivery Speed Selector */}
              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Choose your Prime delivery option:
                </span>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-xs cursor-pointer p-2 rounded-lg hover:bg-slate-800/40 transition-colors">
                    <input
                      type="radio"
                      name="delivery_speed"
                      checked={deliverySpeed === "prime"}
                      onChange={() => setDeliverySpeed("prime")}
                      className="accent-amber-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-400">Tomorrow by 8 PM</span>
                      <span className="text-slate-400">— FREE Prime Next-Day Delivery</span>
                      <span className="px-1.5 py-0.2 bg-[#00a8e1] text-white text-[10px] font-black italic rounded">
                        prime
                      </span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 text-xs cursor-pointer p-2 rounded-lg hover:bg-slate-800/40 transition-colors">
                    <input
                      type="radio"
                      name="delivery_speed"
                      checked={deliverySpeed === "standard"}
                      onChange={() => setDeliverySpeed("standard")}
                      className="accent-amber-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-300">Standard Delivery (3-5 business days)</span>
                      <span className="text-slate-400 ml-1">— FREE</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Items List with Thumbnails */}
              <div className="divide-y divide-slate-800 pt-1">
                {cart.items.map((item) => (
                  <div key={item.variantId} className="py-4 flex items-start gap-4 text-sm">
                    {/* Item Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#0d1117] border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-bold text-white hover:text-amber-400 transition-colors line-clamp-2 text-sm leading-snug"
                      >
                        {item.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-0.5">
                        <span className="font-mono bg-[#0d1117] px-2 py-0.5 rounded border border-slate-800">
                          {item.sku}
                        </span>
                        {item.color && <span>• {item.color}</span>}
                        {item.size && <span>• {item.size}</span>}
                        <span className="text-amber-400 font-bold">• Qty: {item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1 text-[11px]">
                        <span className="text-emerald-400 font-semibold">✓ In Stock</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">Sold by V-Commerce Prime</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">FREE 30-Day Returns</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black font-mono text-white text-base">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-slate-400 font-mono">${item.price.toFixed(2)} each</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
          <div className="lg:col-span-4 sticky top-20">
            <div className="bg-[#161b22] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
              <button
                type="submit"
                disabled={isSubmitting || isPending}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 font-black text-slate-950 text-sm shadow-xl shadow-amber-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-500/30"
              >
                {isSubmitting || isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Placing Your Order...</span>
                  </>
                ) : (
                  <span>Place Your Order</span>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                By placing your order, you agree to V-Commerce&apos;s Conditions of Use and Privacy Notice.
              </p>

              <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs">
                <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Order Summary</h3>
                <div className="flex justify-between text-slate-300">
                  <span>Items ({cart.itemCount}):</span>
                  <span className="font-mono text-white font-semibold">${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Shipping & handling:</span>
                  <span className="text-emerald-400 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Total before tax:</span>
                  <span className="font-mono text-white font-semibold">${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimated Tax (8.25%):</span>
                  <span className="font-mono text-white font-semibold">${taxAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 flex justify-between items-baseline">
                <span className="text-base font-bold text-white">Order Total:</span>
                <span className="text-2xl font-black font-mono text-amber-400">${grandTotal.toFixed(2)}</span>
              </div>

              {/* Amazon Trust Guarantees */}
              <div className="p-4 rounded-xl bg-[#0d1117] border border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>V-Commerce Purchase Protection</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Every order is backed by our A-to-Z Guarantee, authentic product warranty, and dedicated 24/7 customer support.
                </p>
                <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-300">
                  <span>✓ 100% In-Stock Guarantee</span>
                  <span>✓ Insured Prime Dispatch</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
