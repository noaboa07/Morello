"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  championSquareUrl,
  itemIconUrl,
  runeIconUrl,
  summonerSpellIconUrl,
} from "@/lib/ddragon";
import { TimelinePanel } from "@/components/match-tabs/TimelinePanel";
import { MetricsPanel as MetricsPanelFull } from "@/components/match-tabs/MetricsPanel";
import { queueName } from "@/lib/queues";
import { formatDuration, kdaRatio, timeAgo, cn } from "@/lib/utils";
import {
  getMatchBadges,
  getMatchAnalysis,
  computeCarryScore,
  getGrade,
} from "@/lib/badges";
import type { MatchDTO, MatchParticipant, MatchTimeline, RuneTree } from "@/lib/types";

export interface MatchCardProps {
  match: MatchDTO;
  puuid: string;
  platform: string;
  version: string;
  spellMap: Record<number, { name: string; key: string }>;
  itemMap: Record<number, string>;
  playerAverages?: { csPerMin: number; deaths: number; visionScore: number };
}

const TABS = [
  { key: "post-game",   label: "Post Game"   },
  { key: "performance", label: "Performance" },
  { key: "items",       label: "Item Build"  },
  { key: "timeline",    label: "Timeline"    },
  { key: "metrics",     label: "Metrics"     },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function inferRole(pos: string): "Top" | "JG" | "Mid" | "Bot" | "Sup" | "?" {
  switch (pos.toUpperCase()) {
    case "TOP":     return "Top";
    case "JUNGLE":  return "JG";
    case "MIDDLE":  return "Mid";
    case "BOTTOM":  return "Bot";
    case "UTILITY": return "Sup";
    default:        return "?";
  }
}

function rolePillClass(role: string): string {
  switch (role) {
    case "Top": return "bg-slate-600/80 text-slate-100";
    case "JG":  return "bg-emerald-600/80 text-emerald-100";
    case "Mid": return "bg-blue-600/80 text-blue-100";
    case "Bot": return "bg-rose-600/80 text-rose-100";
    case "Sup": return "bg-amber-600/80 text-amber-100";
    default:    return "bg-secondary/60 text-muted-foreground";
  }
}


function gradeClass(grade: "S" | "GM" | "M" | "C"): string {
  switch (grade) {
    case "S":  return "bg-amber-400/20 text-amber-300 border-amber-400/40";
    case "GM": return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    case "M":  return "bg-sky-500/20 text-sky-300 border-sky-500/40";
    case "C":  return "bg-secondary/60 text-muted-foreground border-border/50";
  }
}

function damageShareForGame(allParticipants: MatchParticipant[]) {
  const max = Math.max(
    ...allParticipants.map((p) => p.totalDamageDealtToChampions ?? 0),
    1
  );
  return (p: MatchParticipant) =>
    Math.round(((p.totalDamageDealtToChampions ?? 0) / max) * 100);
}

export function MatchCard({
  match,
  puuid,
  platform,
  version,
  spellMap,
  itemMap,
  playerAverages,
}: MatchCardProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("post-game");
  const renderedRef = useRef<Set<TabKey>>(new Set(["post-game"]));

  const [timelineState, setTimelineState] = useState<
    "idle" | "loading" | "unavailable" | MatchTimeline
  >("idle");
  const timelineFetchedRef = useRef(false);

  const [runeData, setRuneData] = useState<RuneTree[] | null>(null);
  const runeFetchedRef = useRef(false);

  const me = match.info.participants.find((p) => p.puuid === puuid);
  if (!me) return null;

  const win = me.win;
  const totalCs = me.totalMinionsKilled + (me.neutralMinionsKilled ?? 0);
  const gameMins = match.info.gameDuration / 60;
  const cspm = gameMins > 0 ? (totalCs / gameMins).toFixed(1) : "0";
  const items = [me.item0, me.item1, me.item2, me.item3, me.item4, me.item5];
  const trinket = me.item6;
  const badges = getMatchBadges(match, me);
  const analysis = getMatchAnalysis(match, me);
  const dateAbs = new Date(match.info.gameCreation).toLocaleString();
  const gameDmgScale = damageShareForGame(match.info.participants);

  function triggerTimelineFetch() {
    if (timelineFetchedRef.current) return;
    timelineFetchedRef.current = true;
    setTimelineState("loading");
    fetch(`/api/matches/${match.metadata.matchId}/timeline?platform=${platform}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.info?.frames)) {
          setTimelineState(data as MatchTimeline);
        } else {
          setTimelineState("unavailable");
        }
      })
      .catch(() => setTimelineState("unavailable"));
  }

  function triggerRuneFetch() {
    if (runeFetchedRef.current) return;
    runeFetchedRef.current = true;
    fetch("/api/ddragon/runes")
      .then((r) => r.json())
      .then((data) => setRuneData(Array.isArray(data) ? (data as RuneTree[]) : null))
      .catch(() => {});
  }

  function handleTabChange(tab: TabKey) {
    renderedRef.current.add(tab);
    setActiveTab(tab);
    if (tab === "timeline" || tab === "metrics" || tab === "performance") triggerTimelineFetch();
    if (tab === "items") triggerRuneFetch();
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border border-l-2 bg-card overflow-hidden transition-colors focus-within:ring-1 focus-within:ring-ring/50",
        win ? "border-l-win hover:bg-win/[0.03]" : "border-l-loss hover:bg-loss/[0.03]"
      )}
    >
      {/* ── Summary row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[160px_auto_1fr_auto] gap-3 px-4 py-3 items-center">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className={cn("text-xs font-bold uppercase tracking-wide", win ? "text-win" : "text-loss")}>
            {win ? "Victory" : "Defeat"}
          </div>
          <div className="text-xs font-medium text-foreground">{queueName(match.info.queueId)}</div>
          <div className="text-xs text-muted-foreground cursor-help" title={dateAbs}>
            {timeAgo(match.info.gameCreation)}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {formatDuration(match.info.gameDuration)}
          </div>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {badges.map((b) => (
                <span key={b.label} className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-wider", b.className)}>
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Image
              src={championSquareUrl(me.championName, version)}
              alt={me.championName}
              width={64}
              height={64}
              unoptimized
              className={cn("rounded-lg ring-1", win ? "ring-win/50" : "ring-loss/40")}
              title={me.championName}
            />
            <span className="absolute -bottom-1 -right-1 bg-background border border-border text-[9px] px-1 rounded-sm font-bold tabular-nums">
              {me.champLevel}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {[me.summoner1Id, me.summoner2Id].map((sid, i) => (
              <Image
                key={i}
                src={summonerSpellIconUrl(sid, version)}
                alt={spellMap[sid]?.name ?? `spell-${sid}`}
                title={spellMap[sid]?.name ?? `Spell ${sid}`}
                width={24}
                height={24}
                unoptimized
                className="rounded-sm"
              />
            ))}
          </div>
        </div>

        <div className="hidden sm:flex flex-col gap-0.5">
          <div className="text-base font-bold tabular-nums font-mono">
            {me.kills} <span className="text-muted-foreground font-normal">/</span>{" "}
            <span className="text-loss">{me.deaths}</span>{" "}
            <span className="text-muted-foreground font-normal">/</span> {me.assists}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {kdaRatio(me.kills, me.deaths, me.assists)} KDA
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {totalCs} CS ({cspm}/m)
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {me.totalDamageDealtToChampions.toLocaleString()} dmg
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
            {items.map((id, i) => {
              const url = itemIconUrl(id, version);
              const name = id ? itemMap[id] : null;
              return (
                <div key={i} title={name ?? "Empty"} className="h-7 w-7 rounded-sm bg-secondary/60 overflow-hidden border border-border/40">
                  {url && <Image src={url} alt={name ?? ""} width={28} height={28} unoptimized />}
                </div>
              );
            })}
            {trinket ? (
              <div title={itemMap[trinket] ?? "Trinket"} className="h-7 w-7 rounded-full bg-secondary/60 overflow-hidden border border-border/40">
                <Image src={itemIconUrl(trinket, version) ?? ""} alt={itemMap[trinket] ?? "trinket"} width={28} height={28} unoptimized />
              </div>
            ) : (
              <div className="h-7 w-7" />
            )}
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-1.5 rounded-md hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Toggle match details"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* ── Expanded detail panel ───────────────────────────────────────────── */}
      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0">
          <Tabs.Root
            value={activeTab}
            onValueChange={(v) => handleTabChange(v as TabKey)}
            className="border-t border-border/60"
          >
            <Tabs.List className="flex border-b border-border/60 bg-[hsl(var(--surface))] px-4">
              {TABS.map((tab) => (
                <Tabs.Trigger
                  key={tab.key}
                  value={tab.key}
                  className={cn(
                    "px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
                    "text-muted-foreground hover:text-foreground",
                    "data-[state=active]:border-primary data-[state=active]:text-foreground",
                    "data-[state=inactive]:border-transparent"
                  )}
                >
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* Post Game */}
            <Tabs.Content
              value="post-game"
              forceMount
              hidden={activeTab !== "post-game"}
              className="bg-[hsl(var(--surface))] p-4 space-y-4"
            >
              <CoachingPanel analysis={analysis} win={win} />
              <PostGamePanel
                match={match}
                puuid={puuid}
                version={version}
                spellMap={spellMap}
                itemMap={itemMap}
                gameMins={gameMins}
                dmgScale={gameDmgScale}
              />
            </Tabs.Content>

            {/* Performance */}
            {renderedRef.current.has("performance") && (
              <Tabs.Content value="performance" className="bg-[hsl(var(--surface))] p-4">
                <PerformancePanel
                  match={match}
                  me={me}
                  puuid={puuid}
                  version={version}
                  gameMins={gameMins}
                  playerAverages={playerAverages}
                  dmgScale={gameDmgScale}
                  timelineState={timelineState}
                />
              </Tabs.Content>
            )}

            {/* Item Build */}
            {renderedRef.current.has("items") && (
              <Tabs.Content value="items" className="bg-[hsl(var(--surface))] p-4">
                <ItemBuildPanel me={me} version={version} itemMap={itemMap} runeData={runeData} />
              </Tabs.Content>
            )}

            {/* Timeline */}
            {renderedRef.current.has("timeline") && (
              <Tabs.Content value="timeline" className="bg-[hsl(var(--surface))] p-4">
                <TimelinePanel
                  timeline={timelineState === "idle" ? "loading" : timelineState}
                  match={match}
                  puuid={puuid}
                  version={version}
                />
              </Tabs.Content>
            )}

            {/* Metrics */}
            {renderedRef.current.has("metrics") && (
              <Tabs.Content value="metrics" className="bg-[hsl(var(--surface))] p-4">
                <MetricsPanelFull
                  timeline={timelineState === "idle" ? "loading" : timelineState}
                  match={match}
                  puuid={puuid}
                  version={version}
                />
              </Tabs.Content>
            )}
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
}

// ── Coaching panel ────────────────────────────────────────────────────────────

function CoachingPanel({
  analysis,
  win,
}: {
  analysis: ReturnType<typeof getMatchAnalysis>;
  win: boolean;
}) {
  if (analysis.hurt.length === 0 && analysis.solid.length === 0) return null;
  return (
    <div className="rounded-lg border border-border/70 bg-card p-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {analysis.hurt.length > 0 && (
          <div>
            <div className="eyebrow text-loss/70 mb-2">{win ? "Watch out" : "What hurt"}</div>
            <ul className="space-y-1.5">
              {analysis.hurt.map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-loss mt-0.5 text-xs font-bold leading-none shrink-0">−</span>
                  <span className="leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {analysis.solid.length > 0 && (
          <div>
            <div className="eyebrow text-win/70 mb-2">What held up</div>
            <ul className="space-y-1.5">
              {analysis.solid.map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-win mt-0.5 text-xs font-bold leading-none shrink-0">+</span>
                  <span className="leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-border/50 pt-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Focus: </span>
        {analysis.coaching}
      </div>
    </div>
  );
}

// ── Post Game panel ───────────────────────────────────────────────────────────

function PostGamePanel({
  match,
  puuid,
  version,
  spellMap,
  itemMap,
  gameMins,
  dmgScale,
}: {
  match: MatchDTO;
  puuid: string;
  version: string;
  spellMap: Record<number, { name: string; key: string }>;
  itemMap: Record<number, string>;
  gameMins: number;
  dmgScale: (p: MatchParticipant) => number;
}) {
  const all = match.info.participants;
  const topScore = Math.max(...all.map((p) => computeCarryScore(match, p)));
  const blueTeam = all.filter((p) => p.teamId === 100);
  const redTeam = all.filter((p) => p.teamId === 200);

  return (
    <div className="space-y-6">
      <TeamPostGameSection
        team={blueTeam}
        side="blue"
        match={match}
        puuid={puuid}
        version={version}
        spellMap={spellMap}
        itemMap={itemMap}
        gameMins={gameMins}
        dmgScale={dmgScale}
        topScore={topScore}
      />
      <TeamPostGameSection
        team={redTeam}
        side="red"
        match={match}
        puuid={puuid}
        version={version}
        spellMap={spellMap}
        itemMap={itemMap}
        gameMins={gameMins}
        dmgScale={dmgScale}
        topScore={topScore}
      />
    </div>
  );
}

function TeamPostGameSection({
  team,
  side,
  match,
  puuid,
  version,
  itemMap,
  gameMins,
  dmgScale,
  topScore,
}: {
  team: MatchParticipant[];
  side: "blue" | "red";
  match: MatchDTO;
  puuid: string;
  version: string;
  spellMap: Record<number, { name: string; key: string }>;
  itemMap: Record<number, string>;
  gameMins: number;
  dmgScale: (p: MatchParticipant) => number;
  topScore: number;
}) {
  const win = team[0]?.win ?? false;

  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between mb-2 text-[10px] font-semibold uppercase tracking-wider",
          side === "blue" ? "text-sky-400" : "text-rose-400"
        )}
      >
        <span>{side === "blue" ? "Blue" : "Red"} Team</span>
        <span className={cn("font-medium normal-case tracking-normal", win ? "text-win" : "text-loss")}>
          {win ? "Victory" : "Defeat"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-xs" style={{ tableLayout: "fixed", borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: 48 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 96 }} />
            <col />
            <col style={{ width: 72 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 56 }} />
            <col style={{ width: 132 }} />
          </colgroup>
          <thead>
            <tr className="border-b border-border/60 bg-secondary/20">
              <th className="px-2 py-1.5 text-left" />
              <th className="px-2 py-1.5 text-left eyebrow text-muted-foreground">Player</th>
              <th className="px-2 py-1.5 text-center eyebrow text-muted-foreground">Carry</th>
              <th className="px-2 py-1.5 text-center eyebrow text-muted-foreground">KDA</th>
              <th className="px-2 py-1.5 eyebrow text-muted-foreground">Damage</th>
              <th className="px-2 py-1.5 text-right eyebrow text-muted-foreground">Gold</th>
              <th className="px-2 py-1.5 text-right eyebrow text-muted-foreground">CS</th>
              <th className="px-2 py-1.5 text-right eyebrow text-muted-foreground">Wards</th>
              <th className="px-2 py-1.5 eyebrow text-muted-foreground">Items</th>
            </tr>
          </thead>
          <tbody>
            {team.map((p) => {
              const cs = p.totalMinionsKilled + (p.neutralMinionsKilled ?? 0);
              const csMin = gameMins > 0 ? (cs / gameMins).toFixed(1) : "0";
              const kdaVal = p.deaths === 0
                ? (p.kills + p.assists).toFixed(1)
                : ((p.kills + p.assists) / p.deaths).toFixed(2);
              const isMe = p.puuid === puuid;
              const carryScore = computeCarryScore(match, p);
              const grade = getGrade(carryScore, carryScore >= topScore);
              const role = inferRole(p.teamPosition ?? "");
              const dmgPct = dmgScale(p);
              const dmgK = (p.totalDamageDealtToChampions / 1000).toFixed(1);
              const goldK = (p.goldEarned / 1000).toFixed(1);
              const coreItems = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5];

              return (
                <tr
                  key={p.puuid}
                  className={cn(
                    "border-b border-border/20 last:border-0",
                    isMe ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : "hover:bg-secondary/10"
                  )}
                >
                  {/* Champion icon */}
                  <td className="px-2 py-2">
                    <div className="relative w-9 h-9">
                      <Image
                        src={championSquareUrl(p.championName, version)}
                        alt={p.championName}
                        title={p.championName}
                        width={36}
                        height={36}
                        unoptimized
                        className="rounded-md"
                      />
                      {role !== "?" && (
                        <span className={cn("absolute -top-1 -left-1 text-[7px] font-bold px-0.5 rounded-sm leading-4", rolePillClass(role))}>
                          {role}
                        </span>
                      )}
                      <span className="absolute -bottom-1 -right-1 bg-background border border-border text-[7px] px-0.5 rounded-sm font-bold tabular-nums leading-4">
                        {p.champLevel}
                      </span>
                    </div>
                  </td>

                  {/* Player name + grade */}
                  <td className="px-2 py-2">
                    <div className={cn("text-xs truncate font-medium leading-tight", isMe ? "text-foreground" : "text-muted-foreground")}>
                      {p.riotIdGameName ?? p.summonerName}
                    </div>
                    {grade && (
                      <span className={cn("inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide mt-0.5", gradeClass(grade))}>
                        {grade}
                      </span>
                    )}
                  </td>

                  {/* Carry score */}
                  <td className="px-2 py-2 text-center">
                    <span className={cn(
                      "text-xs font-bold tabular-nums font-mono",
                      carryScore >= 70 ? "text-win" : carryScore >= 40 ? "text-yellow-400" : "text-loss"
                    )}>
                      {carryScore}
                    </span>
                    <div className="w-8 h-1 rounded-full bg-secondary/50 overflow-hidden mx-auto mt-0.5">
                      <div
                        className={cn("h-full rounded-full", carryScore >= 70 ? "bg-win/70" : carryScore >= 40 ? "bg-yellow-400/70" : "bg-loss/70")}
                        style={{ width: `${carryScore}%` }}
                      />
                    </div>
                  </td>

                  {/* KDA */}
                  <td className="px-2 py-2 text-center">
                    <div className="text-xs font-mono tabular-nums font-semibold">
                      {p.kills}/{p.deaths}/{p.assists}
                    </div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">{kdaVal}</div>
                  </td>

                  {/* Damage */}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 rounded-full bg-secondary/50 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", side === "blue" ? "bg-sky-500/70" : "bg-rose-500/70")}
                          style={{ width: `${dmgPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">{dmgK}k</span>
                    </div>
                  </td>

                  {/* Gold */}
                  <td className="px-2 py-2 text-right">
                    <span className="text-xs font-mono tabular-nums text-yellow-300/80">{goldK}k</span>
                  </td>

                  {/* CS */}
                  <td className="px-2 py-2 text-right">
                    <div className="text-xs font-mono tabular-nums">{cs} · {csMin}/m</div>
                  </td>

                  {/* Wards */}
                  <td className="px-2 py-2 text-right">
                    <div className="text-xs font-mono tabular-nums text-muted-foreground">
                      {p.wardsPlaced ?? 0}/{p.wardsKilled ?? 0}
                    </div>
                  </td>

                  {/* Items */}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-0.5">
                      {coreItems.map((id, i) => {
                        const url = id ? itemIconUrl(id, version) : null;
                        const name = id ? itemMap[id] : null;
                        return (
                          <div key={i} title={name ?? "Empty"} className="h-[22px] w-[22px] rounded-sm bg-secondary/50 overflow-hidden border border-border/30">
                            {url && <Image src={url} alt="" width={22} height={22} unoptimized />}
                          </div>
                        );
                      })}
                      <div title={p.item6 ? (itemMap[p.item6] ?? "Trinket") : "No trinket"} className="h-[22px] w-[22px] rounded-full bg-secondary/50 overflow-hidden border border-border/30 shrink-0">
                        {p.item6 ? <Image src={itemIconUrl(p.item6, version) ?? ""} alt="" width={22} height={22} unoptimized /> : null}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Laning phase helpers ──────────────────────────────────────────────────────

function findOpponent(me: MatchParticipant, participants: MatchParticipant[]): MatchParticipant | undefined {
  const enemies = participants.filter((p) => p.teamId !== me.teamId);
  if (me.teamPosition) {
    const exact = enemies.find((p) => p.teamPosition === me.teamPosition);
    if (exact) return exact;
  }
  return enemies.reduce((best, p) =>
    p.totalDamageDealtToChampions > best.totalDamageDealtToChampions ? p : best
  );
}

function extractLaningDiff(
  timeline: MatchTimeline,
  myId: number,
  oppId: number,
  minute: 10 | 15
): { goldDiff: number; csDiff: number } | null {
  const frame = timeline.info.frames[minute];
  if (!frame) return null;
  const myFrame = frame.participantFrames[String(myId)];
  const oppFrame = frame.participantFrames[String(oppId)];
  if (!myFrame || !oppFrame) return null;
  return {
    goldDiff: myFrame.totalGold - oppFrame.totalGold,
    csDiff:
      myFrame.minionsKilled +
      myFrame.jungleMinionsKilled -
      (oppFrame.minionsKilled + oppFrame.jungleMinionsKilled),
  };
}

function LaningPhaseSection({
  timeline,
  match,
  me,
}: {
  timeline: "idle" | "loading" | "unavailable" | MatchTimeline;
  match: MatchDTO;
  me: MatchParticipant;
}) {
  if (timeline === "idle" || timeline === "unavailable") return null;

  const participants = match.info.participants;
  const myId = participants.indexOf(me) + 1;
  const opp = findOpponent(me, participants);
  const oppId = opp ? participants.indexOf(opp) + 1 : -1;

  function DiffRow({ label, minute }: { label: string; minute: 10 | 15 }) {
    if (timeline === "loading") {
      return (
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
          <span className="skeleton h-3 w-24 rounded" />
        </div>
      );
    }
    const diff = oppId > 0 ? extractLaningDiff(timeline as MatchTimeline, myId, oppId, minute) : null;
    const fmt = (n: number) => (n > 0 ? `+${n}` : String(n));
    return (
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted-foreground w-16 shrink-0">{label}</span>
        {diff ? (
          <>
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground">Gold</span>
              <span className={cn("font-mono tabular-nums font-semibold", diff.goldDiff >= 0 ? "text-win" : "text-loss")}>
                {fmt(diff.goldDiff)}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground">CS</span>
              <span className={cn("font-mono tabular-nums font-semibold", diff.csDiff >= 0 ? "text-win" : "text-loss")}>
                {fmt(diff.csDiff)}
              </span>
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/70 bg-card p-3 space-y-2">
      <div className="eyebrow text-muted-foreground mb-1">Laning Phase</div>
      <DiffRow label="At 10 min" minute={10} />
      <DiffRow label="At 15 min" minute={15} />
    </div>
  );
}

// ── Performance panel ─────────────────────────────────────────────────────────

type SortCol = "kills" | "kda" | "damage" | "gold" | "wards" | "cs";

function PerformancePanel({
  match,
  me,
  puuid: _puuid,
  version,
  gameMins,
  playerAverages,
  dmgScale,
  timelineState,
}: {
  match: MatchDTO;
  me: MatchParticipant;
  puuid: string;
  version: string;
  gameMins: number;
  playerAverages?: { csPerMin: number; deaths: number; visionScore: number };
  dmgScale: (p: MatchParticipant) => number;
  timelineState: "idle" | "loading" | "unavailable" | MatchTimeline;
}) {
  const [sortCol, setSortCol] = useState<SortCol>("damage");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const myTeam = match.info.participants.filter((p) => p.teamId === me.teamId);
  const teamKills = myTeam.reduce((s, p) => s + p.kills, 0);
  const kp = teamKills > 0 ? ((me.kills + me.assists) / teamKills) * 100 : 0;
  const csPerMin =
    gameMins > 0
      ? (me.totalMinionsKilled + (me.neutralMinionsKilled ?? 0)) / gameMins
      : 0;

  const callouts: string[] = [];
  if (playerAverages) {
    if (csPerMin < playerAverages.csPerMin * 0.9) {
      callouts.push(
        `CS/min is below your recent average (${playerAverages.csPerMin.toFixed(1)}) — maintain farm pressure.`
      );
    }
    if (me.deaths > playerAverages.deaths * 1.25) {
      callouts.push(
        `${me.deaths} deaths is above your norm — look for safer positioning patterns.`
      );
    }
    if ((me.visionScore ?? 0) < playerAverages.visionScore * 0.85) {
      callouts.push("Vision score dropped off — prioritize ward upkeep next game.");
    }
  }
  if (kp < 40 && me.deaths >= 5) {
    callouts.push("Low kill participation with high deaths — avoid side-lane overextension.");
  }

  function colValue(p: MatchParticipant): number {
    const cs = p.totalMinionsKilled + (p.neutralMinionsKilled ?? 0);
    const kda = p.deaths === 0 ? p.kills + p.assists : (p.kills + p.assists) / p.deaths;
    switch (sortCol) {
      case "kills":  return p.kills;
      case "kda":    return kda;
      case "damage": return p.totalDamageDealtToChampions;
      case "gold":   return p.goldEarned;
      case "wards":  return (p.wardsPlaced ?? 0) + (p.wardsKilled ?? 0);
      case "cs":     return gameMins > 0 ? cs / gameMins : 0;
    }
  }

  const sorted = [...match.info.participants].sort((a, b) => {
    const diff = colValue(b) - colValue(a);
    return sortDir === "desc" ? diff : -diff;
  });

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ChevronsUpDown className="inline h-3 w-3 opacity-40 ml-0.5" />;
    return sortDir === "desc"
      ? <ChevronDown className="inline h-3 w-3 ml-0.5" />
      : <ChevronUp className="inline h-3 w-3 ml-0.5" />;
  }

  const thClass =
    "px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none transition-colors";

  return (
    <div className="space-y-4">
      <LaningPhaseSection timeline={timelineState} match={match} me={me} />
      {callouts.length > 0 && (
        <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1.5">
          <div className="eyebrow text-primary/70 mb-2">Coaching Notes</div>
          {callouts.map((note, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-snug">
              <span className="text-primary font-semibold">→ </span>
              {note}
            </p>
          ))}
        </div>
      )}
      {playerAverages == null && (
        <p className="text-xs text-muted-foreground italic">
          Load more matches to enable coaching notes based on your recent averages.
        </p>
      )}

      <div className="rounded-lg border border-border/70 overflow-x-auto">
        <table className="w-full text-xs min-w-[560px]">
          <thead className="bg-secondary/30 border-b border-border/60">
            <tr>
              <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                Player
              </th>
              <th className={cn(thClass, "text-right")} onClick={() => toggleSort("kills")}>
                Kills <SortIcon col="kills" />
              </th>
              <th className={cn(thClass, "text-right")} onClick={() => toggleSort("kda")}>
                KDA <SortIcon col="kda" />
              </th>
              <th className={thClass} onClick={() => toggleSort("damage")}>
                Damage <SortIcon col="damage" />
              </th>
              <th className={cn(thClass, "text-right")} onClick={() => toggleSort("gold")}>
                Gold <SortIcon col="gold" />
              </th>
              <th className={cn(thClass, "text-right")} onClick={() => toggleSort("wards")}>
                Wards <SortIcon col="wards" />
              </th>
              <th className={cn(thClass, "text-right")} onClick={() => toggleSort("cs")}>
                CS/m <SortIcon col="cs" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const cs = p.totalMinionsKilled + (p.neutralMinionsKilled ?? 0);
              const csMin = gameMins > 0 ? (cs / gameMins).toFixed(1) : "0";
              const kdaVal = p.deaths === 0
                ? (p.kills + p.assists).toFixed(1)
                : ((p.kills + p.assists) / p.deaths).toFixed(2);
              const isMe = p.puuid === me.puuid;
              const dmgPct = dmgScale(p);
              const dmgK = (p.totalDamageDealtToChampions / 1000).toFixed(1);
              const goldK = (p.goldEarned / 1000).toFixed(1);
              const side = p.teamId === 100 ? "blue" : "red";

              return (
                <tr
                  key={p.puuid}
                  className={cn(
                    "border-b border-border/30 last:border-0",
                    isMe ? "bg-primary/10" : "hover:bg-secondary/20"
                  )}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={championSquareUrl(p.championName, version)}
                        alt={p.championName}
                        title={`${p.championName} (${side === "blue" ? "Blue" : "Red"})`}
                        width={22}
                        height={22}
                        unoptimized
                        className={cn("rounded-sm ring-1 shrink-0", side === "blue" ? "ring-sky-500/40" : "ring-rose-500/40")}
                      />
                      <span className={cn("truncate font-medium max-w-[100px]", isMe ? "text-foreground" : "text-muted-foreground")}>
                        {p.riotIdGameName ?? p.summonerName}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    <span className="text-foreground">{p.kills}</span>
                    <span className="text-muted-foreground text-[10px]">/{p.deaths}/{p.assists}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">{kdaVal}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 rounded-full bg-secondary/50 overflow-hidden shrink-0">
                        <div
                          className={cn("h-full rounded-full", side === "blue" ? "bg-sky-500/70" : "bg-rose-500/70")}
                          style={{ width: `${dmgPct}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums text-muted-foreground">{dmgK}k</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-yellow-300/80">{goldK}k</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {p.wardsPlaced ?? 0}/{p.wardsKilled ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">{csMin}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Item build panel ──────────────────────────────────────────────────────────

function ItemBuildPanel({
  me,
  version,
  itemMap,
  runeData,
}: {
  me: MatchParticipant;
  version: string;
  itemMap: Record<number, string>;
  runeData: RuneTree[] | null;
}) {
  const coreItems = [me.item0, me.item1, me.item2, me.item3, me.item4, me.item5];
  const trinket = me.item6;

  const perks = me.perks;
  const primaryStyle = perks?.styles[0];
  const secondaryStyle = perks?.styles[1];
  const primaryTree = runeData?.find((t) => t.id === primaryStyle?.style);
  const secondaryTree = runeData?.find((t) => t.id === secondaryStyle?.style);
  const allRunes = runeData?.flatMap((t) => t.slots.flatMap((s) => s.runes)) ?? [];

  const showRunes = perks && runeData;

  return (
    <div className="space-y-4">
      {/* ── Rune page ── */}
      {showRunes ? (
        <div className="rounded-lg border border-border/70 bg-card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Primary tree */}
            {primaryTree && primaryStyle && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={runeIconUrl(primaryTree.icon)} alt={primaryTree.name} className="h-5 w-5 object-contain" />
                  <span className="text-xs font-semibold text-foreground">{primaryTree.name}</span>
                </div>
                {primaryTree.slots.map((slot, si) => {
                  const selectedId = primaryStyle.selections[si]?.perk;
                  return (
                    <div key={si} className="flex gap-2 mb-2.5">
                      {slot.runes.map((rune) => {
                        const selected = rune.id === selectedId;
                        return (
                          <div
                            key={rune.id}
                            title={rune.name}
                            className={cn(
                              "relative transition-opacity",
                              selected ? "opacity-100" : "opacity-30"
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={runeIconUrl(rune.icon)}
                              alt={rune.name}
                              className={cn(
                                "h-8 w-8 rounded-full object-contain",
                                selected ? "ring-2 ring-primary/60" : ""
                              )}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Secondary tree */}
            {secondaryTree && secondaryStyle && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={runeIconUrl(secondaryTree.icon)} alt={secondaryTree.name} className="h-5 w-5 object-contain" />
                  <span className="text-xs font-semibold text-foreground">{secondaryTree.name}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {secondaryStyle.selections.map((sel, i) => {
                    const rune = allRunes.find((r) => r.id === sel.perk);
                    return rune ? (
                      <div key={i} title={rune.name}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={runeIconUrl(rune.icon)}
                          alt={rune.name}
                          className="h-8 w-8 rounded-full object-contain ring-2 ring-secondary/60"
                        />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Stat shards */}
          {perks.statPerks && (
            <div className="border-t border-border/40 pt-3">
              <div className="eyebrow text-muted-foreground mb-2">Stat Shards</div>
              <div className="flex gap-2">
                {[perks.statPerks.offense, perks.statPerks.flex, perks.statPerks.defense].map(
                  (id, i) => {
                    const rune = allRunes.find((r) => r.id === id);
                    return rune ? (
                      <div key={i} title={rune.name}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={runeIconUrl(rune.icon)} alt={rune.name} className="h-6 w-6 object-contain" />
                      </div>
                    ) : (
                      <div key={i} className="h-6 w-6 rounded-full bg-secondary/40" />
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        !runeData && perks === undefined ? null : (
          <p className="text-xs text-muted-foreground italic">
            {!runeData ? "Rune data unavailable — showing items only." : "No rune data for this match."}
          </p>
        )
      )}

      {/* ── Final build ── */}
      <div>
        <div className="eyebrow text-muted-foreground mb-3">Final Build</div>
        <div className="flex items-center gap-2 flex-wrap">
          {coreItems.map((id, i) => {
            const url = id ? itemIconUrl(id, version) : null;
            const name = id ? (itemMap[id] ?? `Item ${id}`) : null;
            return (
              <div
                key={i}
                title={name ?? "Empty slot"}
                className={cn(
                  "h-12 w-12 rounded-md overflow-hidden border",
                  id ? "border-border/60 bg-secondary/60" : "border-dashed border-border/30 bg-secondary/20"
                )}
              >
                {url && <Image src={url} alt={name ?? ""} width={48} height={48} unoptimized className="object-cover" />}
              </div>
            );
          })}
          <div className="h-12 w-px bg-border/40 mx-1" />
          <div
            title={trinket ? (itemMap[trinket] ?? "Trinket") : "No trinket"}
            className={cn(
              "h-12 w-12 rounded-full overflow-hidden border",
              trinket ? "border-border/60 bg-secondary/60" : "border-dashed border-border/30 bg-secondary/20"
            )}
          >
            {trinket ? (
              <Image src={itemIconUrl(trinket, version) ?? ""} alt={itemMap[trinket] ?? "trinket"} width={48} height={48} unoptimized className="object-cover" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/70 bg-card p-3">
        <div className="eyebrow text-muted-foreground mb-2">Items</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {coreItems
            .filter((id) => id > 0)
            .map((id, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="h-5 w-5 rounded-sm overflow-hidden border border-border/40 shrink-0">
                  {itemIconUrl(id, version) && (
                    <Image src={itemIconUrl(id, version) ?? ""} alt="" width={20} height={20} unoptimized />
                  )}
                </div>
                <span className="text-muted-foreground truncate">{itemMap[id] ?? `Item ${id}`}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
