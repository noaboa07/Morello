import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ProfileOverviewSummary } from "@/lib/match-insights";
import type { RankedEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProfileOverviewHeroCard({
  summary,
  solo,
}: {
  summary: ProfileOverviewSummary;
  solo?: RankedEntry;
}) {
  const rankLabel = solo
    ? `${solo.tier} ${solo.rank} - ${solo.leaguePoints} LP`
    : "Unranked";

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">
              Profile Overview
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              {summary.summaryLine}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="border-border/60 bg-background/30 text-foreground">
                Rank: {rankLabel}
              </Badge>
              {summary.strongestQueue && (
                <Badge className="border-border/60 bg-background/30 text-foreground">
                  Best queue: {summary.strongestQueue}
                </Badge>
              )}
              {summary.strongestRole && (
                <Badge className="border-border/60 bg-background/30 text-foreground">
                  Strong role: {summary.strongestRole}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroMetric
              label="Recent WR"
              value={`${summary.recentWinRate}%`}
              accent={summary.recentWinRate >= 50}
            />
            <HeroMetric
              label="Avg KDA"
              value={summary.averageKda.toFixed(2)}
              accent={summary.averageKda >= 3}
            />
            <HeroMetric
              label="Best Champ"
              value={summary.bestChampion?.championName ?? "None"}
            />
            <HeroMetric
              label="Comfort"
              value={summary.bestChampion ? `${summary.bestChampion.games} games` : "Building"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/30 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-base font-semibold", accent && "text-foreground")}>{value}</div>
    </div>
  );
}
