"use client";

import { Copy, Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileOverviewSummary } from "@/lib/match-insights";
import type { ProfilePayload } from "@/lib/types";

export function ShareProfileSnapshotCard({
  profile,
  summary,
}: {
  profile: ProfilePayload;
  summary: ProfileOverviewSummary;
}) {
  const [copied, setCopied] = useState(false);

  const snapshotText = [
    `${profile.account.gameName}#${profile.account.tagLine}`,
    `Recent WR: ${summary.recentWinRate}%`,
    `Average KDA: ${summary.averageKda.toFixed(2)}`,
    summary.bestChampion
      ? `Best recent champion: ${summary.bestChampion.championName} (${summary.bestChampion.games} games)`
      : "Best recent champion: n/a",
    summary.strongestQueue ? `Best queue: ${summary.strongestQueue}` : null,
    summary.strongestRole ? `Strong role: ${summary.strongestRole}` : null,
    summary.summaryLine,
  ]
    .filter(Boolean)
    .join("\n");

  const copySnapshot = async () => {
    await navigator.clipboard.writeText(snapshotText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card id="snapshot">
      <CardHeader className="flex-row items-center justify-between space-y-0 gap-3">
        <div>
          <CardTitle>Profile Snapshot</CardTitle>
          <div className="mt-1 text-sm text-muted-foreground">
            A compact, presentation-ready summary for sharing or screenshots.
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={copySnapshot}>
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border/50 bg-background/20 p-4">
          <div className="text-xl font-semibold">
            {profile.account.gameName}
            <span className="text-muted-foreground">#{profile.account.tagLine}</span>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">{summary.summaryLine}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SnapshotMetric label="Recent WR" value={`${summary.recentWinRate}%`} />
            <SnapshotMetric label="Average KDA" value={summary.averageKda.toFixed(2)} />
            <SnapshotMetric
              label="Best Champion"
              value={summary.bestChampion?.championName ?? "None"}
            />
            <SnapshotMetric
              label="Best Queue/Role"
              value={summary.strongestQueue ?? summary.strongestRole ?? "Building"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SnapshotMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/30 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}
