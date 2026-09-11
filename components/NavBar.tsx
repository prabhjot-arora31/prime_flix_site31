"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  // Keep the input in sync when navigation changes `q` from elsewhere
  // (e.g. the browser back button after a search).
  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const trimmed = value.trim();
    const current = searchParams.get("q") ?? "";
    if (trimmed === current) return;

    const handle = setTimeout(() => {
      router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/primeflix-logo.png" alt="PrimeFlix" className="h-9 w-auto" />
        </Link>

        <div className="relative flex-1 max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
            />
          </svg>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search movies, shows…"
            className="w-full rounded-full border border-white/10 bg-surface py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          {value && (
            <button
              onClick={() => setValue("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
