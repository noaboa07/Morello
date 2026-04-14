import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GameLengthBucket } from "@/lib/match-insights";
import { cn } from "@/lib/utils";

export function GameLengthPerformanceCard({
  buckets,
}: {
  buckets: GameLengthBucket[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Length Splits</CardTitle>
        <div className="text-sm text-muted-foreground">
          Short under 25m, medium 25-35m, long over 35m.
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {buckets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 bg-background/20 p-4 text-sm text-muted-foreground">
            Not enough visible games to form length buckets yet.
          </div>
        ) : (
          buckets.map((bucket) => (
            <div
              key={bucket.key}
              className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-border/50 bg-background/20 p-3"
            >
              <div>
                <div className="font-medium">{bucket.label}</div>
                <div className="text-xs text-muted-foreground">
                  {bucket.games} games
                  {bucket.topChampion ? ` - ${bucket.topChampion}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn("font-semibold", bucket.winRate >= 50 ? "text-win" : "text-loss")}
                >
                  {bucket.winRate}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {bucket.averageKda.toFixed(2)} KDA
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
