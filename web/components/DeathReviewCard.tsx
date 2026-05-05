import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeathReviewSummary } from "@/lib/match-insights";

interface Props {
  summary: DeathReviewSummary;
}

const PHASE_LABEL: Record<DeathReviewSummary["peakPhase"], string> = {
  early: "Early Game",
  mid: "Mid Game",
  late: "Late Game",
};

export function DeathReviewCard({ summary }: Props) {
  const deathLevel =
    summary.avgDeathsPerGame > 5
      ? "high"
      : summary.avgDeathsPerGame > 3
        ? "moderate"
        : "low";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Death Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatBlock label="Total Deaths" value={String(summary.totalDeaths)} />
          <StatBlock
            label="Per Game"
            value={summary.avgDeathsPerGame.toFixed(1)}
            emphasis={deathLevel === "high" ? "loss" : deathLevel === "moderate" ? "warn" : "win"}
          />
          <StatBlock label="Peak Phase" value={PHASE_LABEL[summary.peakPhase]} small />
        </div>

        <p className="text-sm text-muted-foreground leading-snug border-t border-border/40 pt-3">
          {summary.patternLine}
        </p>
      </CardContent>
    </Card>
  );
}

function StatBlock({
  label,
  value,
  emphasis,
  small,
}: {
  label: string;
  value: string;
  emphasis?: "win" | "loss" | "warn";
  small?: boolean;
}) {
  const valueClass =
    emphasis === "win"
      ? "text-win"
      : emphasis === "loss"
        ? "text-loss"
        : emphasis === "warn"
          ? "text-yellow-400"
          : "text-foreground";

  return (
    <div className="rounded-md border border-border/50 bg-secondary/20 p-2.5 text-center">
      <div className="eyebrow text-muted-foreground mb-1">{label}</div>
      <div className={`font-mono font-bold tabular-nums ${small ? "text-xs" : "text-lg"} ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}
