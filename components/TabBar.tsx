"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDownIcon, MenuIcon } from "./icons";

// Matches the real app's own bottom-nav labels (Main5.dart) — "Series" and
// "Anime", not the internal class names ("MovieBoxTV"/"MovieBoxAnimation").
const TABS = [
  { key: "movies", label: "Movies", href: "/" },
  { key: "series", label: "Series", href: "/?tab=series" },
  { key: "anime", label: "Anime", href: "/?tab=anime" },
];

export default function TabBar() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q");
  const activeTab = q ? null : (searchParams.get("tab") ?? "movies");
  const activeLabel = TABS.find((t) => t.key === activeTab)?.label ?? "Menu";

  const [mobileOpen, setMobileOpen] = useState(false);
  // Close the mobile dropdown whenever navigation actually changes it.
  useEffect(() => {
    setMobileOpen(false);
  }, [activeTab, q]);

  return (
    // top-16 lines up with NavBar's own height (py-3 + its content) so the
    // two stack flush with no gap or overlap while both stay sticky.
    <nav className="sticky top-16 z-30 border-b border-white/5 bg-background">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Desktop / tablet: full inline tab row */}
        <div className="hidden gap-1 sm:flex">
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  active ? "text-white" : "text-muted hover:text-white/80"
                }`}
              >
                {tab.label}
                {active && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </div>

        {/* Mobile: hamburger + current tab, opens a dropdown */}
        <div className="sm:hidden">
          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="flex items-center gap-2 py-3 text-sm font-medium text-white"
            aria-expanded={mobileOpen}
          >
            <MenuIcon className="h-5 w-5" />
            {activeLabel}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
          </button>

          {mobileOpen && (
            <div className="absolute inset-x-0 top-full border-b border-white/10 bg-surface shadow-xl">
              {TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`block px-4 py-3 text-sm font-medium ${
                    tab.key === activeTab ? "text-accent" : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
