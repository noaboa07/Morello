import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ConsistencyScore } from "@/lib/match-insights";

interface Props {
  data: ConsistencyScore;
}

function VarianceBar({ label, cv }: { label: string; cv: number }) {
  // Coefficient of variation: lower = more consistent. Cap display at 1.0.
  const stability = Math.max(0, Math.min(100, Math.round((1 - Math.min(cv, 1)) * 100)));
  const barClass =
    stability >= 70 ? "bg-win/70" : stability >= 45 ? "bg-yellow-400/70" : "bg-loss/70";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-foreground">{stability}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barClass)}
          style={{ width: `${stability}%` }}
        />
      </div>
    </div>
  );
}

export function ConsistencyScoreCard({ data }: Props) {
  const scoreClass =
    data.score >= 70 ? "text-win" : data.score >= 45 ? "text-yellow-400" : "text-loss";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Consistency Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={cn("text-4xl font-bold font-mono tabular-nums", scoreClass)}>
            {data.score}
          </div>
          <div className="flex-1 text-xs text-muted-foreground leading-snug">
            {data.interpretation}
          </div>
        </div>

        <div className="space-y-2.5 border-t border-border/40 pt-3">
          <div className="eyebrow text-muted-foreground mb-2">Stability by Metric</div>
          <VarianceBar label="KDA" cv={data.kdaVariance} />
          <VarianceBar label="CS / min" cv={data.csVariance} />
          <VarianceBar label="Vision score" cv={data.visionVariance} />
        </div>
      </CardContent>
    </Card>
  );
}
