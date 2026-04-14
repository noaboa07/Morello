import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchupInsight } from "@/lib/match-insights";
import { cn } from "@/lib/utils";

export function ChampionMatchupInsightsCard({
  best,
  worst,
  fallbackUsed,
}: {
  best: MatchupInsight[];
  worst: MatchupInsight[];
  fallbackUsed: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Champion Matchups</CardTitle>
        <div className="text-sm text-muted-foreground">
          Best and roughest enemy tendencies from the current view.
          {fallbackUsed ? " Some matchups use a conservative fallback opponent." : ""}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <MatchupColumn title="Best Into" entries={best} positive />
        <MatchupColumn title="Watch Outs" entries={worst} positive={false} />
      </CardContent>
    </Card>
  );
}

function MatchupColumn({
  title,
  entries,
  positive,
}: {
  title: string;
  entries: MatchupInsight[];
  positive: boolean;
}) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          positive ? "text-win" : "text-loss"
        )}
      >
        {title}
      </div>
      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/50 bg-background/20 p-4 text-sm text-muted-foreground">
          Not enough repeated matchups yet.
        </div>
      ) : (
        entries.map((entry) => (
          <div
            key={`${title}-${entry.championName}`}
            className="rounded-lg border border-border/50 bg-background/20 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{entry.championName}</div>
                <div className="text-xs text-muted-foreground">{entry.games} games</div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    "font-semibold",
                    entry.winRate >= 50 ? "text-win" : "text-loss"
                  )}
                >
                  {entry.winRate}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.averageKda.toFixed(2)} KDA
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
