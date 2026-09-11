export default function RowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mb-8">
      <div className="mb-3 h-5 w-32 animate-pulse rounded bg-surface" />
      <div className="flex gap-3 overflow-hidden px-4 sm:px-6">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="aspect-2/3 w-30 shrink-0 animate-pulse rounded-lg bg-surface sm:w-36 md:w-40"
          />
        ))}
      </div>
    </div>
  );
}
