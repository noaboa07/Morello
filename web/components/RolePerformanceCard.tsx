import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoleInsight } from "@/lib/match-insights";
import { cn } from "@/lib/utils";

export function RolePerformanceCard({ roles }: { roles: RoleInsight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Performance</CardTitle>
        <div className="text-sm text-muted-foreground">
          Recent role breakdown using Riot lane data when it is stable enough.
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {roles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 bg-background/20 p-4 text-sm text-muted-foreground">
            Not enough reliable role data in the current sample.
          </div>
        ) : (
          roles.map((role) => (
            <div
              key={role.role}
              className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-border/50 bg-background/20 p-3"
            >
              <div>
                <div className="font-medium">{role.role}</div>
                <div className="text-xs text-muted-foreground">
                  {role.games} games
                  {role.topChampion ? ` - ${role.topChampion}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    "font-semibold",
                    role.winRate >= 50 ? "text-win" : "text-loss"
                  )}
                >
                  {role.winRate}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {role.averageKda.toFixed(2)} KDA - {role.averageCsPerMinute.toFixed(1)} CS/m
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
