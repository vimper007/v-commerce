"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await register({ email, password, firstName, lastName });
    setSubmitting(false);

    if (result.success) {
      router.push(redirectTarget);
    } else {
      setError(result.error || "Failed to create account");
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
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">Create Account</h1>
        <p className="mt-1 text-xs text-slate-400">
          Join V-Commerce for 1-day Prime delivery and row-locked checkout.
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Marcus"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0d1117] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Kowalski"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0d1117] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
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
              placeholder="Minimum 6 characters"
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0d1117] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 py-3 text-xs font-bold text-slate-950 transition-colors shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            {submitting ? "Creating Account..." : "Create your V-Commerce account"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link
            href={`/login${redirectTarget !== "/" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
            className="text-amber-400 hover:underline font-semibold"
          >
            Sign in →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
        <RegisterForm />
      </Suspense>
    </div>
  );
}
