"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function UserNav() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-8 w-16 animate-pulse rounded-lg bg-neutral-900" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 text-xs text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
        >
          Orders
        </Link>
        <span className="text-xs font-medium text-neutral-300">
          Hi, <span className="font-semibold text-white">{user.firstName || user.email.split("@")[0]}</span>
        </span>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-400 hover:border-neutral-700 hover:text-white transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
    >
      Sign In
    </Link>
  );
}
