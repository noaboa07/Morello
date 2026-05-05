import { Skeleton } from "@/components/ui/skeleton";

const TIERS = ["S", "A", "B", "C", "D"] as const;

export default function TierListLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pt-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-24" />
      </div>

      {/* filter bar skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
        <Skeleton className="ml-auto h-8 w-48" />
      </div>

      {/* tier sections skeleton */}
      {TIERS.map((tier) => (
        <div key={tier} className="space-y-2">
          <Skeleton className="h-6 w-8" />
          <div className="rounded-lg border border-border">
            {Array.from({ length: tier === "S" ? 4 : tier === "A" ? 6 : 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-0"
              >
                <Skeleton className="h-6 w-6 rounded-sm" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="ml-auto h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
