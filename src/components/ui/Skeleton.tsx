export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-neutral-200/80 dark:bg-neutral-800/80 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="w-24 h-3.5" />
        <Skeleton className="w-16 h-3.5 ml-auto" />
      </div>
      <Skeleton className="w-3/4 h-5" />
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-2/3 h-4" />
      <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
        <Skeleton className="w-16 h-3" />
        <Skeleton className="w-16 h-3" />
      </div>
    </div>
  );
}
