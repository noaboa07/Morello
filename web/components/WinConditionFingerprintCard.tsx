import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WinConditionFingerprint } from "@/lib/match-insights";

interface Props {
  data: WinConditionFingerprint;
}

export function WinConditionFingerprintCard({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Win Condition Fingerprint</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.conditions.map((c) => {
          const isWinCorrelated = c.winPct >= 50;
          const intensity = Math.abs(c.winPct - 50);

          return (
            <div
              key={c.condition}
              className="flex items-center gap-3 rounded-md border border-border/50 bg-secondary/20 px-3 py-2.5"
            >
              <div
                className={cn(
                  "shrink-0 text-xs font-bold font-mono tabular-nums w-10 text-center",
                  isWinCorrelated ? "text-win" : "text-loss"
                )}
              >
                {c.winPct}%
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground truncate">{c.condition}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {c.sampleSize} games ·{" "}
                  {isWinCorrelated
                    ? intensity >= 30
                      ? "Strong win indicator"
                      : "Moderate win indicator"
                    : intensity >= 30
                      ? "Strong loss indicator"
                      : "Moderate loss indicator"}
                </div>
              </div>
              <div className="shrink-0 w-16 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    isWinCorrelated ? "bg-win/70" : "bg-loss/70"
                  )}
                  style={{ width: `${c.winPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
