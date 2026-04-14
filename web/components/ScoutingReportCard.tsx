import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ScoutingReportCard({ insights }: { insights: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scouting Report</CardTitle>
        <div className="text-sm text-muted-foreground">
          A quick read on the visible sample and the habits it suggests.
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2">
        {insights.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 bg-background/20 p-4 text-sm text-muted-foreground">
            Not enough visible games to form a scouting report yet.
          </div>
        ) : (
          insights.map((insight) => (
            <div
              key={insight}
              className="rounded-lg border border-border/50 bg-background/20 px-3 py-2.5 text-sm"
            >
              {insight}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
