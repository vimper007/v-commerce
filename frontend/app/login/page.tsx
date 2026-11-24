"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      router.push(redirectTarget);
    } else {
      setError(result.error || "Failed to log in");
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand Header */}
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/20">
            V
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xl font-black tracking-tight leading-none text-white group-hover:text-amber-400 transition-colors">
              v-commerce<span className="text-amber-500">.</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Prime Retail</span>
          </div>
        </Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">Sign in</h1>
        <p className="mt-1 text-xs text-slate-400">
          Access secure checkout, your orders, and prime delivery.
        </p>
      </div>

      {/* Card */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-[#161b22] p-8 shadow-2xl">
        {error && (
          <div className="mb-5 rounded-xl border border-rose-800 bg-rose-950/70 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. customer@example.com"
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0d1117] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0d1117] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 py-3 text-xs font-bold text-slate-950 transition-colors shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            {submitting ? "Signing in..." : "Continue"}
          </button>

          <button
            type="button"
            onClick={async () => {
              setEmail("shopper@vcommerce.com");
              setPassword("Password123!");
              setSubmitting(true);
              const result = await login("shopper@vcommerce.com", "Password123!");
              setSubmitting(false);
              if (result.success) {
                router.push(redirectTarget);
              } else {
                setError(result.error || "Demo login failed");
              }
            }}
            className="w-full rounded-xl bg-[#0d1117] hover:bg-slate-800/80 border border-slate-700 py-2.5 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
          >
            ⚡ 1-Click Demo Login (Alex Mercer)
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
          New to V-Commerce?{" "}
          <Link
            href={`/register${redirectTarget !== "/" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
            className="text-amber-400 hover:underline font-semibold"
          >
            Create your account →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] px-6 py-12 selection:bg-slate-800">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
