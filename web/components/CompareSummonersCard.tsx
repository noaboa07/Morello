"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Loader2, Scale } from "lucide-react";
import { championSquareUrl } from "@/lib/ddragon";
import { deriveCompareSummary } from "@/lib/match-insights";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SUPPORTED_PLATFORMS, PLATFORM_LABELS } from "@/lib/regions";
import type { MatchDTO, ProfilePayload } from "@/lib/types";

type CompareState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: ProfilePayload; matches: MatchDTO[] };

export function CompareSummonersCard({
  currentProfile,
  currentMatches,
  version,
}: {
  currentProfile: ProfilePayload;
  currentMatches: MatchDTO[];
  version: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState(currentProfile.platform);
  const [state, setState] = useState<CompareState>({ status: "idle" });
  const searchParams = useSearchParams();

  const currentSummary = useMemo(
    () => deriveCompareSummary(currentMatches, currentProfile.account.puuid),
    [currentMatches, currentProfile.account.puuid]
  );

  const compareSummary =
    state.status === "ready"
      ? deriveCompareSummary(state.matches, state.profile.account.puuid)
      : null;

  const runCompare = async (riotId: string, targetPlatform: string) => {
    const trimmed = riotId.trim();
    if (!trimmed.includes("#")) {
      setState({ status: "error", message: "Use Riot ID format: GameName#TAG" });
      return;
    }

    const [name, tag] = trimmed.split("#");
    if (!name || !tag) {
      setState({ status: "error", message: "Use Riot ID format: GameName#TAG" });
      return;
    }

      setState({ status: "loading" });

    try {
      const profileRes = await fetch(
        `/api/profile/${targetPlatform}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
        { cache: "no-store" }
      );
      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(
          humanizeCompareError(profileRes.status, profileData.error) ??
            "Couldn't load comparison summoner."
        );
      }

      const matchRes = await fetch(
        `/api/matches/${targetPlatform}/${profileData.account.puuid}?count=20`,
        { cache: "no-store" }
      );
      const matchData = await matchRes.json();
      if (!matchRes.ok) {
        throw new Error(
          humanizeCompareError(matchRes.status, matchData.error) ??
            "Couldn't load comparison matches."
        );
      }

      setState({
        status: "ready",
        profile: profileData as ProfilePayload,
        matches: (matchData.matches ?? []) as MatchDTO[],
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Unexpected compare error.",
      });
    }
  };

  useEffect(() => {
    const compareRiotId = searchParams.get("compareRiotId");
    if (!compareRiotId) return;
    const comparePlatform = searchParams.get("comparePlatform") ?? currentProfile.platform;
    setOpen(true);
    setPlatform(comparePlatform);
    setQuery(compareRiotId);
    void runCompare(compareRiotId, comparePlatform);
  }, [searchParams, currentProfile.platform]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runCompare(query, platform);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Compare Summoners</CardTitle>
          <div className="mt-1 text-sm text-muted-foreground">
            Put recent form, rank, champions, and queues side by side.
          </div>
        </div>
        <button
          onClick={() => setOpen((value) => !value)}
          className="rounded-full border border-border/60 bg-background/30 p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={open}
          aria-label="Toggle compare summoners"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </CardHeader>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="space-y-4">
            <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/20 p-3 sm:flex-row">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="h-11 rounded-md bg-secondary/60 border border-border/60 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SUPPORTED_PLATFORMS.map((region) => (
                  <option key={region} value={region}>
                    {PLATFORM_LABELS[region]}
                  </option>
                ))}
              </select>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Second summoner: GameName#TAG"
                className="flex-1"
              />
              <Button type="submit" size="lg">
                {state.status === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Comparing
                  </>
                ) : (
                  <>
                    <Scale className="h-4 w-4" />
                    Compare
                  </>
                )}
              </Button>
            </form>

            {state.status === "error" && (
              <div className="rounded-lg border border-loss/30 bg-loss/10 p-4 text-sm text-loss">
                {state.message}
              </div>
            )}

            {state.status === "ready" && compareSummary && (
              <div className="grid gap-4 xl:grid-cols-2">
                <ComparePane
                  title={`${currentProfile.account.gameName}#${currentProfile.account.tagLine}`}
                  profile={currentProfile}
                  summary={currentSummary}
                  version={version}
                />
                <ComparePane
                  title={`${state.profile.account.gameName}#${state.profile.account.tagLine}`}
                  profile={state.profile}
                  summary={compareSummary}
                  version={version}
                />
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

function humanizeCompareError(status: number, message?: string) {
  if (status === 404) return "That summoner couldn't be found.";
  if (status === 429) return "Riot rate limit reached. Try again in a moment.";
  if (status >= 500) return "Riot data is temporarily unavailable. Try again shortly.";
  return message;
}

function ComparePane({
  title,
  profile,
  summary,
  version,
}: {
  title: string;
  profile: ProfilePayload;
  summary: ReturnType<typeof deriveCompareSummary>;
  version: string;
}) {
  const solo = profile.ranked.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
  const rankLabel = solo ? `${solo.tier} ${solo.rank} - ${solo.leaguePoints} LP` : "Unranked";

  return (
    <div className="rounded-xl border border-border/50 bg-background/20 p-4">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{rankLabel}</div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="Recent WR" value={`${summary.recentWinRate}%`} />
        <Metric label="Avg KDA" value={summary.averageKda.toFixed(2)} />
      </div>
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Top champions</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {summary.topChampions.length === 0 ? (
            <span className="text-sm text-muted-foreground">No recent games</span>
          ) : (
            summary.topChampions.map((champion) => (
              <div
                key={champion.championName}
                className="flex items-center gap-2 rounded-full border border-border/50 bg-background/30 px-2.5 py-1"
              >
                <Image
                  src={championSquareUrl(champion.championName, version)}
                  alt={champion.championName}
                  width={20}
                  height={20}
                  unoptimized
                  className="rounded-full"
                />
                <span className="text-sm">{champion.championName}</span>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Recent queues</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {summary.recentQueues.map((queue) => (
            <span
              key={queue}
              className="rounded-full border border-border/50 bg-background/30 px-2.5 py-1 text-sm"
            >
              {queue}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/30 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}
