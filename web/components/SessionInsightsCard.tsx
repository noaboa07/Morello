import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionInsights } from "@/lib/match-insights";
import { cn } from "@/lib/utils";

export function SessionInsightsCard({
  insights,
  queueLabel,
  championFilter,
}: {
  insights: SessionInsights;
  queueLabel: string;
  championFilter: string | null;
}) {
  const streakLabel =
    insights.streakType && insights.streakCount > 0
      ? `${insights.streakCount} ${insights.streakType === "win" ? "W" : "L"} streak`
      : "No streak";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Session Insights</CardTitle>
          <div className="mt-1 text-sm text-muted-foreground">
            {insights.games} visible games - {queueLabel}
            {championFilter ? ` - ${championFilter}` : ""}
          </div>
        </div>
        <Badge
          className={cn(
            "shrink-0 border",
            insights.statusLabel === "Hot streak" &&
              "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
            insights.statusLabel === "Consistent carry" &&
              "border-amber-400/40 bg-amber-500/15 text-amber-200",
            insights.statusLabel === "Rough patch" &&
              "border-rose-400/40 bg-rose-500/15 text-rose-200",
            insights.statusLabel !== "Hot streak" &&
              insights.statusLabel !== "Consistent carry" &&
              insights.statusLabel !== "Rough patch" &&
              "border-primary/30 bg-primary/10 text-primary"
          )}
        >
          {insights.statusLabel}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Win rate" value={`${insights.winRate}%`} accent={insights.winRate >= 50} />
        <Metric
          label="Average KDA"
          value={insights.averageKda.toFixed(2)}
          accent={insights.averageKda >= 3}
        />
        <Metric label="Current streak" value={streakLabel} />
        <Metric
          label="Best champion"
          value={
            insights.bestChampion
              ? `${insights.bestChampion.championName} (${insights.bestChampion.games}g)`
              : "None yet"
          }
        />
        <Metric
          label="Farm"
          value={
            insights.averageCsPerMinute > 0
              ? `${insights.averageCsPerMinute.toFixed(1)} CS/min`
              : `${Math.round(insights.averageCs)} CS`
          }
        />
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/30 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-base font-semibold", accent && "text-foreground")}>
        {value}
      </div>
    </div>
  );
}
