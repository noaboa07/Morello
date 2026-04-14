import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { championSquareUrl } from "@/lib/ddragon";
import type { ChampionPoolEntry } from "@/lib/match-insights";

export function RecentChampionPoolCard({
  champions,
  version,
}: {
  champions: ChampionPoolEntry[];
  version: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Champion Pool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {champions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 bg-background/20 p-4 text-sm text-muted-foreground">
            No champions in the current view yet.
          </div>
        ) : (
          champions.slice(0, 4).map((champion) => {
            const winRate = Math.round((champion.wins / champion.games) * 100);
            return (
              <div
                key={champion.championName}
                className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/20 p-2.5"
              >
                <Image
                  src={championSquareUrl(champion.championName, version)}
                  alt={champion.championName}
                  width={40}
                  height={40}
                  unoptimized
                  className="rounded-md"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{champion.championName}</div>
                  <div className="text-xs text-muted-foreground">
                    {champion.games} games · {champion.averageKda.toFixed(2)} KDA
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{winRate}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    WR
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
