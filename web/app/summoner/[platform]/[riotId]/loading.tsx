import { MatchHistorySkeleton } from "@/components/MatchHistorySkeleton";
import { SearchBar } from "@/components/SearchBar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SearchBar size="sm" />
      <Card className="overflow-hidden">
        <div className="h-24 bg-secondary/50" />
        <CardContent className="pt-0 -mt-12 flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <Skeleton className="h-24 w-24 rounded-2xl" />
          <div className="w-full space-y-3 mt-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid lg:grid-cols-3 gap-4">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
      <Skeleton className="h-56 w-full rounded-xl" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MatchHistorySkeleton />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
