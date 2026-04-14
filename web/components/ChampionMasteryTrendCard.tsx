import Image from "next/image";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { championSquareUrl } from "@/lib/ddragon";
import type { ChampionTrend } from "@/lib/match-insights";
import { cn } from "@/lib/utils";

export function ChampionMasteryTrendCard({
  champions,
  version,
}: {
  champions: ChampionTrend[];
  version: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Champion Mastery Trend</CardTitle>
        <div className="text-sm text-muted-foreground">
          Recent direction on the champions you are leaning on most.
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {champions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 bg-background/20 p-4 text-sm text-muted-foreground">
            Not enough repeated champions in the current view yet.
          </div>
        ) : (
          champions.map((champion) => (
            <div
              key={champion.championName}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/20 p-3"
            >
              <Image
                src={championSquareUrl(champion.championName, version)}
                alt={champion.championName}
                width={36}
                height={36}
                unoptimized
                className="rounded-md"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{champion.championName}</div>
                <div className="text-xs text-muted-foreground">
                  {champion.games} games - {champion.winRate}% WR - {champion.averageKda.toFixed(2)} KDA
                </div>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-semibold",
                  champion.direction === "up"
                    ? "text-win"
                    : champion.direction === "down"
                      ? "text-loss"
                      : "text-muted-foreground"
                )}
              >
                {champion.direction === "up" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : champion.direction === "down" ? (
                  <TrendingDown className="h-4 w-4" />
                ) : null}
                {champion.label}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
