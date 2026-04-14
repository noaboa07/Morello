import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { rankEmblemUrl } from "@/lib/ddragon";
import type { RankedEntry } from "@/lib/types";

const QUEUE_LABELS: Record<string, string> = {
  RANKED_SOLO_5x5: "Ranked Solo/Duo",
  RANKED_FLEX_SR: "Ranked Flex",
};

export function RankCard({ queue, entry }: { queue: string; entry?: RankedEntry }) {
  if (!entry) {
    return (
      <Card className="flex-1">
        <CardContent className="flex items-center gap-4 pt-5">
          <div className="h-16 w-16 rounded-full bg-secondary/60 grid place-items-center text-muted-foreground text-xs">
            UNRANKED
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              {QUEUE_LABELS[queue] ?? queue}
            </div>
            <div className="text-lg font-semibold mt-1">Unranked</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = entry.wins + entry.losses;
  const winRate = total > 0 ? Math.round((entry.wins / total) * 100) : 0;
  const lpPct = Math.min(100, Math.max(0, entry.leaguePoints));
  const apex = ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(
    entry.tier.toUpperCase()
  );

  return (
    <Card className="flex-1 animate-fade-in">
      <CardContent className="pt-5">
        <div className="flex items-center gap-4">
          <Image
            src={rankEmblemUrl(entry.tier)}
            alt={entry.tier}
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 drop-shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              {QUEUE_LABELS[queue] ?? queue}
            </div>
            <div className="text-lg font-semibold mt-0.5 capitalize">
              {entry.tier.toLowerCase()} {apex ? "" : entry.rank}
            </div>
            <div className="text-sm text-muted-foreground">
              {entry.leaguePoints} LP
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-medium tabular-nums">
              {entry.wins}W <span className="text-muted-foreground">/</span>{" "}
              {entry.losses}L
            </div>
            <div
              className={`text-sm font-semibold ${
                winRate >= 50 ? "text-win" : "text-loss"
              }`}
            >
              {winRate}%
            </div>
          </div>
        </div>

        {!apex && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              <span>Progress to next division</span>
              <span className="tabular-nums">{lpPct}/100 LP</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-purple-400 transition-all"
                style={{ width: `${lpPct}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
