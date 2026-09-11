export default function PosterGridSkeleton({ count = 16 }: { count?: number }) {
  return (
    <div className="grid animate-pulse grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-2/3 rounded-lg bg-surface" />
      ))}
    </div>
  );
}
