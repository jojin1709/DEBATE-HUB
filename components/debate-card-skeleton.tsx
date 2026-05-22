import { Skeleton } from "@/components/ui/skeleton"

export function DebateCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border/80 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-lg" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <Skeleton className="h-3 w-16 rounded-full" />
      </div>
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-full rounded-lg" />
        <Skeleton className="h-5 w-5/6 rounded-lg" />
      </div>
      {/* Vote buttons */}
      <div className="flex gap-2.5">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>
      {/* Progress bar */}
      <div className="space-y-1.5">
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/40 pt-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-10 rounded ml-2" />
        </div>
        <Skeleton className="h-8 w-16 rounded-xl" />
      </div>
    </div>
  )
}
