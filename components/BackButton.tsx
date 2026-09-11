"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      className={`flex items-center gap-1.5 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/70 ${className}`}
    >
      <span className="text-base leading-none">‹</span> Back
    </button>
  );
}
