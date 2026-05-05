"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  championSquareUrl,
  itemIconUrl,
  summonerSpellIconUrl,
} from "@/lib/ddragon";
import { queueName } from "@/lib/queues";
import { formatDuration, kdaRatio, timeAgo, cn } from "@/lib/utils";
import {
  getMatchBadges,
  getMatchAnalysis,
  damageShareForTeam,
} from "@/lib/badges";
import type { MatchDTO, MatchParticipant } from "@/lib/types";

export interface MatchCardProps {
  match: MatchDTO;
  puuid: string;
  version: string;
  spellMap: Record<number, { name: string; key: string }>;
  itemMap: Record<number, string>;
  playerAverages?: { csPerMin: number; deaths: number; visionScore: number };
}

const TABS = [
  { key: "post-game", label: "Post Game" },
  { key: "performance", label: "Performance" },
  { key: "items", label: "Item Build" },
  // Timeline tab omitted: per-event data requires the Riot timeline endpoint
  // (/lol/match/v5/matches/{id}/timeline), which is a separate fetch not in
  // the current SSR pipeline. TODO: add when timeline endpoint is integrated.
  { key: "metrics", label: "Metrics" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function MatchCard({
  match,
  puuid,
  version,
  spellMap,
  itemMap,
  playerAverages,
}: MatchCardProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("post-game");
  const renderedRef = useRef<Set<TabKey>>(new Set(["post-game"]));

  const me = match.info.participants.find((p) => p.puuid === puuid);
  if (!me) return null;

  const win = me.win;
  const totalCs = me.totalMinionsKilled + (me.neutralMinionsKilled ?? 0);
  const gameMins = match.info.gameDuration / 60;
  const cspm = gameMins > 0 ? (totalCs / gameMins).toFixed(1) : "0";
  const items = [me.item0, me.item1, me.item2, me.item3, me.item4, me.item5];
  const trinket = me.item6;
  const teams: [MatchParticipant[], MatchParticipant[]] = [
    match.info.participants.filter((p) => p.teamId === 100),
    match.info.participants.filter((p) => p.teamId === 200),
  ];
  const badges = getMatchBadges(match, me);
  const analysis = getMatchAnalysis(match, me);
  const date = new Date(match.info.gameCreation);
  const dateAbs = date.toLocaleString();
  const teamDamageScale = damageShareForTeam(match.info.participants);

  function handleTabChange(tab: TabKey) {
    renderedRef.current.add(tab);
    setActiveTab(tab);
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border border-l-2 bg-card overflow-hidden transition-colors focus-within:ring-1 focus-within:ring-ring/50",
        win
          ? "border-l-win hover:bg-win/[0.03]"
          : "border-l-loss hover:bg-loss/[0.03]"
      )}
    >
      {/* ── Summary row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[160px_auto_1fr_auto] gap-3 px-4 py-3 items-center">

        {/* Game metadata */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className={cn("text-xs font-bold uppercase tracking-wide", win ? "text-win" : "text-loss")}>
            {win ? "Victory" : "Defeat"}
          </div>
          <div className="text-xs font-medium text-foreground">
            {queueName(match.info.queueId)}
          </div>
          <div className="text-xs text-muted-foreground cursor-help" title={dateAbs}>
            {timeAgo(match.info.gameCreation)}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {formatDuration(match.info.gameDuration)}
          </div>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-wider",
                    b.className
                  )}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Champion portrait + spells */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Image
              src={championSquareUrl(me.championName, version)}
              alt={me.championName}
              width={64}
              height={64}
              unoptimized
              className={cn(
                "rounded-lg ring-1",
                win ? "ring-win/50" : "ring-loss/40"
              )}
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

        {/* KDA + stats */}
        <div className="hidden sm:flex flex-col gap-0.5">
          <div className="text-base font-bold tabular-nums font-mono">
            {me.kills}{" "}
            <span className="text-muted-foreground font-normal">/</span>{" "}
            <span className="text-loss">{me.deaths}</span>{" "}
            <span className="text-muted-foreground font-normal">/</span>{" "}
            {me.assists}
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

        {/* Items + expand toggle */}
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
            {items.map((id, i) => {
              const url = itemIconUrl(id, version);
              const name = id ? itemMap[id] : null;
              return (
                <div
                  key={i}
                  title={name ?? "Empty"}
                  className="h-7 w-7 rounded-sm bg-secondary/60 overflow-hidden border border-border/40"
                >
                  {url && (
                    <Image
                      src={url}
                      alt={name ?? ""}
                      width={28}
                      height={28}
                      unoptimized
                    />
                  )}
                </div>
              );
            })}
            {trinket ? (
              <div
                title={itemMap[trinket] ?? "Trinket"}
                className="h-7 w-7 rounded-full bg-secondary/60 overflow-hidden border border-border/40"
              >
                <Image
                  src={itemIconUrl(trinket, version) ?? ""}
                  alt={itemMap[trinket] ?? "trinket"}
                  width={28}
                  height={28}
                  unoptimized
                />
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
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
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
            {/* Tab bar */}
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
              hidden={activeTab !== "post-game" && !renderedRef.current.has("post-game")}
              className="bg-[hsl(var(--surface))] p-4 space-y-5"
            >
              <CoachingPanel analysis={analysis} win={win} />
              <div className="grid gap-5 lg:grid-cols-2">
                {teams.map((team, ti) => (
                  <TeamPanel
                    key={ti}
                    team={team}
                    side={ti === 0 ? "blue" : "red"}
                    version={version}
                    puuid={puuid}
                    spellMap={spellMap}
                    itemMap={itemMap}
                    dmgScale={teamDamageScale}
                  />
                ))}
              </div>
            </Tabs.Content>

            {/* Performance */}
            {renderedRef.current.has("performance") && (
              <Tabs.Content
                value="performance"
                className="bg-[hsl(var(--surface))] p-4"
              >
                <PerformancePanel
                  match={match}
                  me={me}
                  gameMins={gameMins}
                  playerAverages={playerAverages}
                />
              </Tabs.Content>
            )}

            {/* Item Build */}
            {renderedRef.current.has("items") && (
              <Tabs.Content
                value="items"
                className="bg-[hsl(var(--surface))] p-4"
              >
                <ItemBuildPanel
                  me={me}
                  version={version}
                  itemMap={itemMap}
                />
              </Tabs.Content>
            )}

            {/* Metrics */}
            {renderedRef.current.has("metrics") && (
              <Tabs.Content
                value="metrics"
                className="bg-[hsl(var(--surface))] p-4"
              >
                <MetricsPanel match={match} me={me} />
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
            <div className="eyebrow text-loss/70 mb-2">
              {win ? "Watch out" : "What hurt"}
            </div>
            <ul className="space-y-1.5">
              {analysis.hurt.map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-loss mt-0.5 text-xs font-bold leading-none shrink-0">
                    −
                  </span>
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
                  <span className="text-win mt-0.5 text-xs font-bold leading-none shrink-0">
                    +
                  </span>
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

// ── Team panel ────────────────────────────────────────────────────────────────

function TeamPanel({
  team,
  side,
  version,
  puuid,
  spellMap,
  itemMap,
  dmgScale,
}: {
  team: MatchParticipant[];
  side: "blue" | "red";
  version: string;
  puuid: string;
  spellMap: Record<number, { name: string; key: string }>;
  itemMap: Record<number, string>;
  dmgScale: (p: MatchParticipant) => number;
}) {
  const win = team[0]?.win ?? false;
  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider mb-2",
          side === "blue" ? "text-win" : "text-loss"
        )}
      >
        <span>{side === "blue" ? "Blue" : "Red"} Team</span>
        <span className="text-muted-foreground font-medium normal-case tracking-normal">
          {win ? "Victory" : "Defeat"}
        </span>
      </div>
      <div className="space-y-1">
        {team.map((p) => {
          const cs = p.totalMinionsKilled + (p.neutralMinionsKilled ?? 0);
          const isMe = p.puuid === puuid;
          const dmgPct = dmgScale(p);
          return (
            <div
              key={p.puuid}
              className={cn(
                "grid grid-cols-[auto_1fr_auto] gap-2 items-center rounded-md px-2 py-1.5 text-xs",
                isMe ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-secondary/30"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Image
                  src={championSquareUrl(p.championName, version)}
                  alt={p.championName}
                  title={p.championName}
                  width={26}
                  height={26}
                  unoptimized
                  className="rounded-sm"
                />
                <div className="flex flex-col gap-0.5">
                  <Image
                    src={summonerSpellIconUrl(p.summoner1Id, version)}
                    alt=""
                    width={11}
                    height={11}
                    unoptimized
                    title={spellMap[p.summoner1Id]?.name}
                    className="rounded-sm"
                  />
                  <Image
                    src={summonerSpellIconUrl(p.summoner2Id, version)}
                    alt=""
                    width={11}
                    height={11}
                    unoptimized
                    title={spellMap[p.summoner2Id]?.name}
                    className="rounded-sm"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <div
                  className={cn(
                    "truncate font-medium",
                    isMe ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {p.riotIdGameName ?? p.summonerName}
                </div>
                <div className="mt-1 h-1 rounded-full bg-secondary/50 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      side === "blue" ? "bg-win/60" : "bg-loss/60"
                    )}
                    style={{ width: `${dmgPct}%` }}
                    title={`${p.totalDamageDealtToChampions.toLocaleString()} dmg`}
                  />
                </div>
              </div>

              <div className="text-right tabular-nums">
                <div className="font-mono font-semibold">
                  {p.kills}/{p.deaths}/{p.assists}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {cs} cs · {(p.totalDamageDealtToChampions / 1000).toFixed(1)}k
                </div>
              </div>

              <div className="col-span-3 flex gap-0.5 mt-0.5">
                {[p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map(
                  (id, i) => {
                    const url = id ? itemIconUrl(id, version) : null;
                    const name = id ? itemMap[id] : null;
                    return (
                      <div
                        key={i}
                        title={name ?? "Empty"}
                        className="h-5 w-5 rounded-sm bg-secondary/50 overflow-hidden border border-border/30"
                      >
                        {url && (
                          <Image src={url} alt="" width={20} height={20} unoptimized />
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Performance panel ─────────────────────────────────────────────────────────

type MetricRating = "green" | "yellow" | "red" | "neutral";

function rateMetric(
  value: number,
  avg: number,
  higherIsBetter: boolean
): MetricRating {
  if (avg === 0) return "neutral";
  const ratio = value / avg;
  if (higherIsBetter) {
    if (ratio >= 1.1) return "green";
    if (ratio >= 0.9) return "yellow";
    return "red";
  } else {
    if (ratio <= 0.9) return "green";
    if (ratio <= 1.1) return "yellow";
    return "red";
  }
}

const RATING_CLASS: Record<MetricRating, string> = {
  green: "text-win",
  yellow: "text-yellow-400",
  red: "text-loss",
  neutral: "text-muted-foreground",
};

function PerfRow({
  label,
  value,
  displayValue,
  avg,
  higherIsBetter,
}: {
  label: string;
  value: number;
  displayValue: string;
  avg?: number;
  higherIsBetter: boolean;
}) {
  const rating = avg != null ? rateMetric(value, avg, higherIsBetter) : "neutral";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono font-semibold tabular-nums", RATING_CLASS[rating])}>
        {displayValue}
      </span>
    </div>
  );
}

function PerformancePanel({
  match,
  me,
  gameMins,
  playerAverages,
}: {
  match: MatchDTO;
  me: MatchParticipant;
  gameMins: number;
  playerAverages?: { csPerMin: number; deaths: number; visionScore: number };
}) {
  const myTeam = match.info.participants.filter((p) => p.teamId === me.teamId);
  const teamKills = myTeam.reduce((s, p) => s + p.kills, 0);
  const kp = teamKills > 0 ? ((me.kills + me.assists) / teamKills) * 100 : 0;

  const teamDmgTotal = myTeam.reduce(
    (s, p) => s + p.totalDamageDealtToChampions,
    0
  );
  const dmgShare =
    teamDmgTotal > 0
      ? (me.totalDamageDealtToChampions / teamDmgTotal) * 100
      : 0;

  const csPerMin = gameMins > 0
    ? (me.totalMinionsKilled + (me.neutralMinionsKilled ?? 0)) / gameMins
    : 0;

  // Early game: CS/min (lower 3rd of game is a proxy — no timeline available)
  // Mid/late: aggregates from final stats
  const hasFirstBlood = me.firstBloodKill || me.firstBloodAssist;

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

  return (
    <div className="space-y-4">
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

      <div className="rounded-lg border border-border/70 bg-card p-4">
        <div className="eyebrow text-muted-foreground mb-3">This Game</div>
        <PerfRow
          label="CS / min"
          value={csPerMin}
          displayValue={csPerMin.toFixed(1)}
          avg={playerAverages?.csPerMin}
          higherIsBetter
        />
        <PerfRow
          label="Deaths"
          value={me.deaths}
          displayValue={String(me.deaths)}
          avg={playerAverages?.deaths}
          higherIsBetter={false}
        />
        <PerfRow
          label="Kill participation"
          value={kp}
          displayValue={`${kp.toFixed(0)}%`}
          higherIsBetter
        />
        <PerfRow
          label="Damage share"
          value={dmgShare}
          displayValue={`${dmgShare.toFixed(0)}%`}
          higherIsBetter
        />
        <PerfRow
          label="Vision score"
          value={me.visionScore}
          displayValue={String(me.visionScore)}
          avg={playerAverages?.visionScore}
          higherIsBetter
        />
        {hasFirstBlood != null && (
          <PerfRow
            label="First blood involvement"
            value={hasFirstBlood ? 1 : 0}
            displayValue={hasFirstBlood ? "Yes" : "No"}
            higherIsBetter
          />
        )}
      </div>

      {playerAverages == null && (
        <p className="text-xs text-muted-foreground italic">
          Load more matches to enable comparison against your recent averages.
        </p>
      )}
    </div>
  );
}

// ── Item build panel ──────────────────────────────────────────────────────────

function ItemBuildPanel({
  me,
  version,
  itemMap,
}: {
  me: MatchParticipant;
  version: string;
  itemMap: Record<number, string>;
}) {
  const coreItems = [me.item0, me.item1, me.item2, me.item3, me.item4, me.item5];
  const trinket = me.item6;

  return (
    <div className="space-y-4">
      {/* Purchase order requires Riot timeline endpoint — showing final build only. */}
      {/* TODO: integrate /lol/match/v5/matches/{id}/timeline to show item purchase sequence. */}
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
                  id
                    ? "border-border/60 bg-secondary/60"
                    : "border-dashed border-border/30 bg-secondary/20"
                )}
              >
                {url && (
                  <Image
                    src={url}
                    alt={name ?? ""}
                    width={48}
                    height={48}
                    unoptimized
                    className="object-cover"
                  />
                )}
              </div>
            );
          })}

          {/* Divider before trinket */}
          <div className="h-12 w-px bg-border/40 mx-1" />

          <div
            title={trinket ? (itemMap[trinket] ?? "Trinket") : "No trinket"}
            className={cn(
              "h-12 w-12 rounded-full overflow-hidden border",
              trinket
                ? "border-border/60 bg-secondary/60"
                : "border-dashed border-border/30 bg-secondary/20"
            )}
          >
            {trinket ? (
              <Image
                src={itemIconUrl(trinket, version) ?? ""}
                alt={itemMap[trinket] ?? "trinket"}
                width={48}
                height={48}
                unoptimized
                className="object-cover"
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Item name list */}
      <div className="rounded-lg border border-border/70 bg-card p-3">
        <div className="eyebrow text-muted-foreground mb-2">Items</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {coreItems
            .filter((id) => id > 0)
            .map((id, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="h-5 w-5 rounded-sm overflow-hidden border border-border/40 shrink-0">
                  {itemIconUrl(id, version) && (
                    <Image
                      src={itemIconUrl(id, version) ?? ""}
                      alt=""
                      width={20}
                      height={20}
                      unoptimized
                    />
                  )}
                </div>
                <span className="text-muted-foreground truncate">
                  {itemMap[id] ?? `Item ${id}`}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ── Metrics panel ─────────────────────────────────────────────────────────────

function MetricsPanel({
  match,
  me,
}: {
  match: MatchDTO;
  me: MatchParticipant;
}) {
  const myTeam = match.info.participants.filter((p) => p.teamId === me.teamId);
  const teamSize = myTeam.length || 1;

  function teamAvg(selector: (p: MatchParticipant) => number): number {
    return myTeam.reduce((s, p) => s + selector(p), 0) / teamSize;
  }

  const rows: Array<{ label: string; player: string; avg: string }> = [
    {
      label: "Damage dealt",
      player: me.totalDamageDealtToChampions.toLocaleString(),
      avg: Math.round(teamAvg((p) => p.totalDamageDealtToChampions)).toLocaleString(),
    },
    {
      label: "Damage taken",
      player: (me.totalDamageTaken ?? 0).toLocaleString(),
      avg: Math.round(teamAvg((p) => p.totalDamageTaken ?? 0)).toLocaleString(),
    },
    {
      label: "Healing done",
      player: (me.totalHeal ?? 0).toLocaleString(),
      avg: Math.round(teamAvg((p) => p.totalHeal ?? 0)).toLocaleString(),
    },
    {
      label: "Shielding",
      player: (me.totalDamageShieldedOnTeammates ?? 0).toLocaleString(),
      avg: Math.round(
        teamAvg((p) => p.totalDamageShieldedOnTeammates ?? 0)
      ).toLocaleString(),
    },
    {
      label: "CC time (s)",
      player: String(me.timeCCingOthers ?? 0),
      avg: (teamAvg((p) => p.timeCCingOthers ?? 0)).toFixed(0),
    },
    {
      label: "Turret damage",
      player: (me.damageDealtToObjectives ?? 0).toLocaleString(),
      avg: Math.round(
        teamAvg((p) => p.damageDealtToObjectives ?? 0)
      ).toLocaleString(),
    },
    {
      label: "Vision score",
      player: String(me.visionScore),
      avg: (teamAvg((p) => p.visionScore)).toFixed(1),
    },
    {
      label: "Wards placed",
      player: String(me.wardsPlaced ?? 0),
      avg: (teamAvg((p) => p.wardsPlaced ?? 0)).toFixed(1),
    },
    {
      label: "Wards killed",
      player: String(me.wardsKilled ?? 0),
      avg: (teamAvg((p) => p.wardsKilled ?? 0)).toFixed(1),
    },
  ];

  return (
    <div className="rounded-lg border border-border/70 bg-card overflow-hidden">
      <div className="grid grid-cols-3 border-b border-border/60 bg-secondary/30 px-4 py-2">
        <div className="eyebrow text-muted-foreground">Stat</div>
        <div className="eyebrow text-primary/70 text-right">You</div>
        <div className="eyebrow text-muted-foreground text-right">Team avg</div>
      </div>
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-border/30 last:border-0 hover:bg-secondary/20"
        >
          <span className="text-muted-foreground">{row.label}</span>
          <span className="text-right font-mono font-semibold tabular-nums text-foreground">
            {row.player}
          </span>
          <span className="text-right font-mono tabular-nums text-muted-foreground">
            {row.avg}
          </span>
        </div>
      ))}
    </div>
  );
}
