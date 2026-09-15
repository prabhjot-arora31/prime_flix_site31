"use client";

import Link from "next/link";
import Avatar from "./Avatar";
import LinkPendingOverlay from "./LinkPendingOverlay";

export default function PersonCard({
  staffId,
  detailPath,
  name,
  avatarUrl,
  subtitle,
  description,
  born,
}: {
  staffId: string;
  detailPath: string;
  name: string;
  avatarUrl: string;
  subtitle?: string;
  description?: string;
  born?: string;
}) {
  const params = new URLSearchParams({ name, avatarUrl });
  if (subtitle) params.set("subtitle", subtitle);
  if (description) params.set("description", description);
  if (born) params.set("born", born);

  return (
    <Link
      href={`/person/${detailPath}?staffId=${staffId}&${params.toString()}`}
      className="group flex w-24 shrink-0 flex-col items-center text-center sm:w-28"
    >
      <div className="relative h-20 w-20 sm:h-24 sm:w-24">
        <Avatar
          src={avatarUrl}
          alt={name}
          className="h-20 w-20 shadow-md transition-transform duration-200 group-hover:scale-105 sm:h-24 sm:w-24"
        />
        <LinkPendingOverlay rounded="rounded-full" />
      </div>
      <p className="mt-2 line-clamp-1 text-xs font-medium text-white">{name}</p>
      {subtitle && <p className="line-clamp-1 text-[11px] text-muted">{subtitle}</p>}
    </Link>
  );
}
