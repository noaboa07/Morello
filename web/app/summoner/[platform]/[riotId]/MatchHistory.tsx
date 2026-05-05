"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ChampionMatchupInsightsCard } from "@/components/ChampionMatchupInsightsCard";
import { ChampionMasteryTrendCard } from "@/components/ChampionMasteryTrendCard";
import { ChampionStats } from "@/components/ChampionStats";
import { CompareSummonersCard } from "@/components/CompareSummonersCard";
import { ConsistencyScoreCard } from "@/components/ConsistencyScoreCard";
import { DeathReviewCard } from "@/components/DeathReviewCard";
import { GameLengthPerformanceCard } from "@/components/GameLengthPerformanceCard";
import { MatchCard } from "@/components/MatchCard";
import { RecentChampionPoolCard } from "@/components/RecentChampionPoolCard";
import { RolePerformanceCard } from "@/components/RolePerformanceCard";
import { ScoutingReportCard } from "@/components/ScoutingReportCard";
import { ShareProfileSnapshotCard } from "@/components/ShareProfileSnapshotCard";
import { KdaSparkline } from "@/components/Sparkline";
import { WinConditionFingerprintCard } from "@/components/WinConditionFingerprintCard";
import { WinLossAnalysisCard } from "@/components/WinLossAnalysisCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  QUEUE_FILTER_OPTIONS,
  deriveChampionTrends,
  deriveConsistencyScore,
  deriveDeathReview,
  deriveGameLengthBuckets,
  deriveMatchupInsights,
  deriveProfileOverview,
  deriveRoleInsights,
  deriveScoutingReport,
  deriveSessionInsights,
  deriveWinConditionFingerprint,
  deriveWinLossComparison,
  matchesQueueFilter,
  queueFilterSummary,
  type QueueFilterKey,
} from "@/lib/match-insights";
import { cn } from "@/lib/utils";
import type { MatchDTO, ProfilePayload } from "@/lib/types";

const PAGE_SIZE = 20;

export function MatchHistory({
  matches,
  puuid,
  version,
  spellMap,
  itemMap,
  platform,
  currentProfile,
}: {
  matches: MatchDTO[];
  puuid: string;
  version: string;
  spellMap: Record<number, { name: string; key: string }>;
  itemMap: Record<number, string>;
  platform: string;
  currentProfile: ProfilePayload;
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
      const me = match.info.participants.find((p) => p.puuid === puuid);
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
  const deathReview = useMemo(
    () => deriveDeathReview(visibleMatches, puuid),
    [visibleMatches, puuid]
  );
  const consistencyScore = useMemo(
    () => deriveConsistencyScore(visibleMatches, puuid),
    [visibleMatches, puuid]
  );
  const winConditions = useMemo(
    () => deriveWinConditionFingerprint(visibleMatches, puuid),
    [visibleMatches, puuid]
  );
  const playerAverages = useMemo(() => {
    if (visibleMatches.length === 0) return undefined;
    let totalDeaths = 0;
    let totalVision = 0;
    let count = 0;
    for (const match of visibleMatches) {
      const me = match.info.participants.find((p) => p.puuid === puuid);
      if (!me) continue;
      totalDeaths += me.deaths;
      totalVision += me.visionScore;
      count++;
    }
    if (count === 0) return undefined;
    return {
      csPerMin: insights.averageCsPerMinute,
      deaths: totalDeaths / count,
      visionScore: totalVision / count,
    };
  }, [visibleMatches, puuid, insights.averageCsPerMinute]);

  const loadMore = async () => {
    setLoadingMore(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/matches/${platform}/${puuid}?start=${nextStart}&count=${PAGE_SIZE}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't load more matches.");
      setLoadedMatches((current) => {
        const seen = new Set(current.map((m) => m.metadata.matchId));
        const incoming = ((data.matches ?? []) as MatchDTO[]).filter(
          (m) => !seen.has(m.metadata.matchId)
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
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No recent matches found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Compact form strip ─────────────────────────────────────────────── */}
      <FormStrip insights={insights} queueFilter={queueFilter} selectedChampion={selectedChampion} />

      {/* ── Filter row ───────────────────────────────────────────────────────── */}
      <FilterRow
        queueFilter={queueFilter}
        setQueueFilter={setQueueFilter}
        selectedChampion={selectedChampion}
        setSelectedChampion={setSelectedChampion}
        wins={insights.wins}
        losses={insights.losses}
        winRate={insights.winRate}
      />

      {/* ── Primary 2-column layout: match list + champion sidebar ──────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px]">
        {/* Match list */}
        <div className="min-w-0 space-y-4">
          {trendMatches.length > 0 && (
            <KdaSparkline matches={trendMatches} puuid={puuid} />
          )}

          {visibleMatches.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No matches match the current filters.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-1.5">
                {visibleMatches.map((match) => (
                  <MatchCard
                    key={match.metadata.matchId}
                    match={match}
                    puuid={puuid}
                    version={version}
                    spellMap={spellMap}
                    itemMap={itemMap}
                    playerAverages={playerAverages}
                  />
                ))}
              </div>
              <div className="pt-1 text-center">
                {loadError && (
                  <div className="mb-3 text-sm text-loss">{loadError}</div>
                )}
                {hasMore ? (
                  <Button onClick={loadMore} disabled={loadingMore} variant="secondary">
                    {loadingMore ? "Loading…" : "Load more matches"}
                  </Button>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    End of available match history
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Champion sidebar — interactive filter + role + game length */}
        <aside className="space-y-4">
          <ChampionStats
            matches={loadedMatches.filter((m) => matchesQueueFilter(m, queueFilter))}
            puuid={puuid}
            version={version}
            selected={selectedChampion}
            onSelect={setSelectedChampion}
          />
          <RolePerformanceCard roles={roleInsights} />
          <GameLengthPerformanceCard buckets={gameLengthBuckets} />
        </aside>
      </div>

      {/* ── Analytics grid — supporting context, below matches ──────────────── */}
      <div className="space-y-4">
        <SectionLabel>Analysis</SectionLabel>
        <div className="grid gap-4 xl:grid-cols-2">
          <WinLossAnalysisCard comparison={winLossComparison} />
          <ChampionMatchupInsightsCard
            best={matchupInsights.best}
            worst={matchupInsights.worst}
            fallbackUsed={matchupInsights.fallbackUsed}
          />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChampionMasteryTrendCard champions={championTrends} version={version} />
          <RecentChampionPoolCard champions={insights.championPool} version={version} />
        </div>
        <ScoutingReportCard insights={scoutingReport} />

        {/* High-elo coaching widgets — require ≥5 matches to derive signal */}
        {(deathReview || consistencyScore || winConditions) && (
          <div className="grid gap-4 xl:grid-cols-3">
            {deathReview && <DeathReviewCard summary={deathReview} />}
            {consistencyScore && <ConsistencyScoreCard data={consistencyScore} />}
            {winConditions && <WinConditionFingerprintCard data={winConditions} />}
          </div>
        )}
      </div>

      {/* ── Tools — compare + share, lowest priority ─────────────────────────── */}
      <div className="space-y-4">
        <SectionLabel>Tools</SectionLabel>
        <div id="compare" className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          <CompareSummonersCard
            currentProfile={currentProfile}
            currentMatches={loadedMatches}
            version={version}
          />
          <ShareProfileSnapshotCard
            profile={currentProfile}
            summary={deriveProfileOverview(loadedMatches, puuid)}
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="eyebrow">{children}</div>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

function FormStrip({
  insights,
  queueFilter,
  selectedChampion,
}: {
  insights: ReturnType<typeof deriveSessionInsights>;
  queueFilter: QueueFilterKey;
  selectedChampion: string | null;
}) {
  const streak =
    insights.streakType && insights.streakCount >= 2
      ? `${insights.streakCount}${insights.streakType === "win" ? "W" : "L"} streak`
      : null;

  const contextParts: string[] = [];
  if (queueFilter !== "all") contextParts.push(queueFilterSummary(queueFilter));
  if (selectedChampion) contextParts.push(selectedChampion);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1">
      <StatPill label="W/L">
        <span className="text-win">{insights.wins}W</span>
        <span className="text-muted-foreground mx-0.5">/</span>
        <span className="text-loss">{insights.losses}L</span>
        <span
          className={cn(
            "ml-1 font-semibold",
            insights.winRate >= 55
              ? "text-win"
              : insights.winRate >= 50
                ? "text-foreground"
                : "text-loss"
          )}
        >
          {insights.winRate}%
        </span>
      </StatPill>

      <StatPill label="KDA">
        <span>{insights.averageKda.toFixed(2)}</span>
      </StatPill>

      {insights.averageCsPerMinute > 0 && (
        <StatPill label="CS/min">
          <span>{insights.averageCsPerMinute.toFixed(1)}</span>
        </StatPill>
      )}

      {streak && (
        <StatPill label="Streak">
          <span className={insights.streakType === "win" ? "text-win" : "text-loss"}>
            {streak}
          </span>
        </StatPill>
      )}

      <span
        className={cn(
          "ml-auto text-xs px-2 py-0.5 rounded-full border font-medium",
          insights.statusLabel === "Hot streak"
            ? "border-win/40 bg-win/10 text-win"
            : insights.statusLabel === "Rough patch"
              ? "border-loss/40 bg-loss/10 text-loss"
              : "border-border/60 text-muted-foreground"
        )}
      >
        {insights.statusLabel}
      </span>

      {contextParts.length > 0 && (
        <span className="text-xs text-muted-foreground">
          {contextParts.join(" · ")}
        </span>
      )}
    </div>
  );
}

function StatPill({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-1.5 text-sm tabular-nums font-mono">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground not-mono">
        {label}
      </span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}

function FilterRow({
  queueFilter,
  setQueueFilter,
  selectedChampion,
  setSelectedChampion,
  wins,
  losses,
  winRate,
}: {
  queueFilter: QueueFilterKey;
  setQueueFilter: (k: QueueFilterKey) => void;
  selectedChampion: string | null;
  setSelectedChampion: (c: string | null) => void;
  wins: number;
  losses: number;
  winRate: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {QUEUE_FILTER_OPTIONS.map((option) => {
        const active = queueFilter === option.key;
        return (
          <button
            key={option.key}
            onClick={() => setQueueFilter(option.key)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              active
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {option.label}
          </button>
        );
      })}

      {/* Active filter chips */}
      {selectedChampion && (
        <button
          onClick={() => setSelectedChampion(null)}
          className="ml-1 flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          {selectedChampion}
          <span className="opacity-60">×</span>
        </button>
      )}
      {queueFilter !== "all" && (
        <button
          onClick={() => setQueueFilter("all")}
          className="flex items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {queueFilterSummary(queueFilter)}
          <span className="opacity-60">×</span>
        </button>
      )}
    </div>
  );
}
