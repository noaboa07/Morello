import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { championSquareUrl } from "@/lib/ddragon";
import type { ChampionDetailedEntry } from "@/lib/match-insights";

interface Props {
  pool: ChampionDetailedEntry[];
  version: string;
}

export function ChampionWinRateTrendCard({ pool, version }: Props) {
  if (pool.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Champion Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr className="border-b border-border/40">
              <th className="pb-1.5 text-left eyebrow text-muted-foreground">Champion</th>
              <th className="pb-1.5 text-right eyebrow text-muted-foreground">G</th>
              <th className="pb-1.5 text-right eyebrow text-muted-foreground">WR%</th>
              <th className="pb-1.5 text-right eyebrow text-muted-foreground">KDA</th>
              <th className="pb-1.5 text-right eyebrow text-muted-foreground">CS/m</th>
              <th className="pb-1.5 text-right eyebrow text-muted-foreground">Vision</th>
            </tr>
          </thead>
          <tbody>
            {pool.map((entry) => (
              <tr key={entry.championName} className="border-b border-border/20 last:border-0">
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-1.5">
                    <Image
                      src={championSquareUrl(entry.championName, version)}
                      alt={entry.championName}
                      width={20}
                      height={20}
                      unoptimized
                      className="rounded-sm"
                    />
                    <span className="font-medium truncate">{entry.championName}</span>
                  </div>
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">{entry.games}</td>
                <td className={cn("py-2 text-right tabular-nums font-semibold", entry.winRate >= 50 ? "text-win" : "text-loss")}>
                  {entry.winRate}%
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">{entry.averageKda.toFixed(2)}</td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">{entry.avgCsPerMin.toFixed(1)}</td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">{entry.avgVisionScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
