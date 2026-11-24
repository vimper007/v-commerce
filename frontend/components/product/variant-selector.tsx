"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";

export interface Variant {
  id: string;
  sku: string;
  price: string;
  size?: string | null;
  color?: string | null;
  stock: number | null;
}

interface VariantSelectorProps {
  productId: string;
  variants: Variant[];
}

export function VariantSelector({ variants }: VariantSelectorProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || ""
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);

  const activeVariant =
    variants.find((v) => v.id === selectedVariantId) || variants[0];
  const stock = activeVariant?.stock ?? 0;
  const isAvailable = stock > 0;
  const isLowStock = stock > 0 && stock <= 15;

  const { addToCart, isLoading } = useCart();

  const handleAddToCart = async () => {
    if (!isAvailable || !activeVariant) return;
    await addToCart(activeVariant.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Dynamic Price & SKU Header */}
      <div className="flex items-baseline justify-between border-b border-neutral-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase text-neutral-500">
            Selected Price
          </span>
          <div className="text-3xl font-bold tracking-tight text-white">
            ${activeVariant?.price ? parseFloat(activeVariant.price).toFixed(2) : "0.00"}
          </div>
        </div>

        <div className="text-right">
          <span className="block font-mono text-xs text-neutral-400">
            {activeVariant?.sku || "SKU-N/A"}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              !isAvailable
                ? "text-red-400"
                : isLowStock
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                !isAvailable
                  ? "bg-red-400"
                  : isLowStock
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              }`}
            />
            {!isAvailable ? "Sold Out" : `${stock} units remaining`}
          </span>
        </div>
      </div>

      {/* Variant Pills (Color / Size) */}
      {variants.length > 1 && (
        <div>
          <span className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
            Select Configuration
          </span>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {variants.map((v) => {
              const isSelected = v.id === selectedVariantId;
              const label = [v.color, v.size].filter(Boolean).join(" - ") || v.sku;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-medium transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? "border border-white bg-white text-neutral-950 font-semibold shadow-sm"
                      : "border border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Action CTA */}
      <div className="flex items-center gap-4 pt-2">
        <div className="flex h-11 items-center rounded-xl border border-neutral-800 bg-neutral-900/80 px-2">
          <button
            type="button"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          >
            -
          </button>
          <span className="w-10 text-center font-mono text-sm font-semibold text-white">
            {quantity}
          </span>
          <button
            type="button"
            disabled={quantity >= stock}
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          >
            +
          </button>
        </div>

        <button
          type="button"
          disabled={!isAvailable}
          onClick={handleAddToCart}
          className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
            !isAvailable
              ? "cursor-not-allowed bg-neutral-800 text-neutral-500"
              : added
              ? "bg-emerald-500 text-neutral-950 font-bold shadow-lg shadow-emerald-500/20"
              : "bg-white text-neutral-950 hover:bg-neutral-200 shadow-md"
          }`}
        >
          {added ? "✓ Added to Cart" : isAvailable ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}
