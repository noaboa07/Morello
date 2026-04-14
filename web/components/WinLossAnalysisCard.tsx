import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WinLossComparison } from "@/lib/match-insights";

export function WinLossAnalysisCard({
  comparison,
}: {
  comparison: WinLossComparison;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Win vs Loss Analysis</CardTitle>
        <div className="text-sm text-muted-foreground">
          What shifts most between your visible wins and losses.
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {comparison.metrics.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 bg-background/20 p-4 text-sm text-muted-foreground">
            Need both wins and losses in the current view to compare patterns.
          </div>
        ) : (
          comparison.metrics.map((metric) => (
            <div
              key={metric.label}
              className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-lg border border-border/50 bg-background/20 p-3"
            >
              <div>
                <div className="font-medium">{metric.label}</div>
                {metric.emphasis && (
                  <div className="text-xs text-muted-foreground mt-0.5">{metric.emphasis}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Wins</div>
                <div className="font-semibold text-win">{metric.winValue}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Losses</div>
                <div className="font-semibold text-loss">{metric.lossValue}</div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
