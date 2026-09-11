"use client";

import { useState } from "react";
import { UserIcon } from "./icons";

/** A circular avatar that falls back to a generic user icon when there's no
 * image URL at all, or the image fails to load. */
export default function Avatar({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <div className={`overflow-hidden rounded-full bg-surface ${className}`}>
      {showFallback ? (
        <div className="flex h-full w-full items-center justify-center">
          <UserIcon className="h-1/2 w-1/2 text-white/30" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
