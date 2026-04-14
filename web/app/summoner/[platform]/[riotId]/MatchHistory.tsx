"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ChampionMatchupInsightsCard } from "@/components/ChampionMatchupInsightsCard";
import { ChampionStats } from "@/components/ChampionStats";
import { ChampionMasteryTrendCard } from "@/components/ChampionMasteryTrendCard";
import { GameLengthPerformanceCard } from "@/components/GameLengthPerformanceCard";
import { MatchCard } from "@/components/MatchCard";
import { RecentChampionPoolCard } from "@/components/RecentChampionPoolCard";
import { RolePerformanceCard } from "@/components/RolePerformanceCard";
import { ScoutingReportCard } from "@/components/ScoutingReportCard";
import { SessionInsightsCard } from "@/components/SessionInsightsCard";
import { KdaSparkline } from "@/components/Sparkline";
import { WinLossAnalysisCard } from "@/components/WinLossAnalysisCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  QUEUE_FILTER_OPTIONS,
  deriveMatchupInsights,
  deriveRoleInsights,
  deriveScoutingReport,
  deriveSessionInsights,
  deriveWinLossComparison,
  deriveGameLengthBuckets,
  deriveChampionTrends,
  matchesQueueFilter,
  queueFilterSummary,
  type QueueFilterKey,
} from "@/lib/match-insights";
import { cn } from "@/lib/utils";
import type { MatchDTO } from "@/lib/types";

const PAGE_SIZE = 20;

export function MatchHistory({
  matches,
  puuid,
  version,
  spellMap,
  itemMap,
  platform,
}: {
  matches: MatchDTO[];
  puuid: string;
  version: string;
  spellMap: Record<number, { name: string; key: string }>;
  itemMap: Record<number, string>;
  platform: string;
}) {
  const [selectedChampion, setSelectedChampion] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<QueueFilterKey>("all");
  const [loadedMatches, setLoadedMatches] = useState(matches);
  const [nextStart, setNextStart] = useState(matches.length);
  const [hasMore, setHasMore] = useState(matches.length >= PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const deferredMatches = useDeferredValue(loadedMatches);

  const visibleMatches = useMemo(() => {
    return deferredMatches.filter((match) => {
      const me = match.info.participants.find((participant) => participant.puuid === puuid);
      if (!me) return false;
      if (selectedChampion && me.championName !== selectedChampion) return false;
      return matchesQueueFilter(match, queueFilter);
    });
  }, [deferredMatches, puuid, queueFilter, selectedChampion]);

  const trendMatches = useMemo(() => visibleMatches.slice(0, 10), [visibleMatches]);
  const insights = useMemo(
    () => deriveSessionInsights(visibleMatches, puuid),
    [visibleMatches, puuid]
  );
  const matchupInsights = useMemo(
    () => deriveMatchupInsights(visibleMatches, puuid),
    [visibleMatches, puuid]
  );
  const roleInsights = useMemo(
    () => deriveRoleInsights(visibleMatches, puuid),
    [visibleMatches, puuid]
  );
  const scoutingReport = useMemo(
    () => deriveScoutingReport(visibleMatches, puuid),
    [visibleMatches, puuid]
  );
  const winLossComparison = useMemo(
    () => deriveWinLossComparison(visibleMatches, puuid),
    [visibleMatches, puuid]
  );
  const gameLengthBuckets = useMemo(
    () => deriveGameLengthBuckets(visibleMatches, puuid),
    [visibleMatches, puuid]
  );
  const championTrends = useMemo(
    () => deriveChampionTrends(visibleMatches, puuid),
    [visibleMatches, puuid]
  );

  const loadMore = async () => {
    setLoadingMore(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/matches/${platform}/${puuid}?start=${nextStart}&count=${PAGE_SIZE}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Couldn't load more matches.");
      }

      setLoadedMatches((current) => {
        const seen = new Set(current.map((match) => match.metadata.matchId));
        const incoming = ((data.matches ?? []) as MatchDTO[]).filter(
          (match) => !seen.has(match.metadata.matchId)
        );
        return [...current, ...incoming];
      });
      setNextStart(Number(data.nextStart ?? nextStart + PAGE_SIZE));
      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unexpected load error.");
    } finally {
      setLoadingMore(false);
    }
  };

  if (loadedMatches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No recent matches found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SessionInsightsCard
        insights={insights}
        queueLabel={queueFilterSummary(queueFilter)}
        championFilter={selectedChampion}
      />

      <ScoutingReportCard insights={scoutingReport} />

      <div className="grid gap-6 xl:grid-cols-2">
        <WinLossAnalysisCard comparison={winLossComparison} />
        <ChampionMatchupInsightsCard
          best={matchupInsights.best}
          worst={matchupInsights.worst}
          fallbackUsed={matchupInsights.fallbackUsed}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">Recent Matches</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {selectedChampion && (
                  <Badge className="border-primary/30 bg-primary/10 text-primary">
                    Champion: {selectedChampion}
                  </Badge>
                )}
                {queueFilter !== "all" && (
                  <Badge className="border-border/70 bg-secondary/50 text-foreground">
                    Queue: {queueFilterSummary(queueFilter)}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {selectedChampion && (
                <button
                  onClick={() => setSelectedChampion(null)}
                  className="rounded-full px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Clear champion
                </button>
              )}
              {queueFilter !== "all" && (
                <button
                  onClick={() => setQueueFilter("all")}
                  className="rounded-full px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Clear queue
                </button>
              )}
              <div className="text-sm text-muted-foreground">
                {insights.wins}W {insights.losses}L -{" "}
                <span
                  className={cn(
                    "font-semibold",
                    insights.winRate >= 50 ? "text-win" : "text-loss"
                  )}
                >
                  {insights.winRate}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUEUE_FILTER_OPTIONS.map((option) => {
              const active = queueFilter === option.key;
              return (
                <button
                  key={option.key}
                  onClick={() => setQueueFilter(option.key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary/40 bg-primary/15 text-primary shadow-[0_0_18px_-12px] shadow-primary/70"
                      : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {trendMatches.length > 0 ? (
            <KdaSparkline matches={trendMatches} puuid={puuid} />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No trend data for the current filters yet.
              </CardContent>
            </Card>
          )}

          {visibleMatches.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No recent matches found for the current filters.
              </CardContent>
            </Card>
          ) : (
            <>
              {visibleMatches.map((match) => (
                <MatchCard
                  key={match.metadata.matchId}
                  match={match}
                  puuid={puuid}
                  version={version}
                  spellMap={spellMap}
                  itemMap={itemMap}
                />
              ))}
              <div className="rounded-xl border border-border/50 bg-background/20 p-4 text-center">
                {loadError && <div className="mb-3 text-sm text-loss">{loadError}</div>}
                {hasMore ? (
                  <Button onClick={loadMore} disabled={loadingMore} variant="secondary">
                    {loadingMore ? "Loading more..." : "Load more matches"}
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    You&apos;ve reached the end of the currently available recent match set.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          <ChampionStats
            matches={loadedMatches.filter((match) => matchesQueueFilter(match, queueFilter))}
            puuid={puuid}
            version={version}
            selected={selectedChampion}
            onSelect={setSelectedChampion}
          />
          <RolePerformanceCard roles={roleInsights} />
          <GameLengthPerformanceCard buckets={gameLengthBuckets} />
          <ChampionMasteryTrendCard champions={championTrends} version={version} />
          <RecentChampionPoolCard champions={insights.championPool} version={version} />
        </div>
      </div>
    </div>
  );
}
