"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  championSquareUrl,
  itemIconUrl,
  summonerSpellIconUrl,
} from "@/lib/ddragon";
import { queueName } from "@/lib/queues";
import { formatDuration, kdaRatio, timeAgo, cn } from "@/lib/utils";
import {
  getMatchBadges,
  damageShareForTeam,
  getMatchPerformanceReasons,
} from "@/lib/badges";
import type { MatchDTO, MatchParticipant } from "@/lib/types";

export interface MatchCardProps {
  match: MatchDTO;
  puuid: string;
  version: string;
  spellMap: Record<number, { name: string; key: string }>;
  itemMap: Record<number, string>;
}

export function MatchCard({
  match,
  puuid,
  version,
  spellMap,
  itemMap,
}: MatchCardProps) {
  const [open, setOpen] = useState(false);
  const me = match.info.participants.find((p) => p.puuid === puuid);
  if (!me) return null;

  const win = me.win;
  const totalCs = me.totalMinionsKilled + (me.neutralMinionsKilled ?? 0);
  const cspm = (totalCs / (match.info.gameDuration / 60)).toFixed(1);
  const items = [me.item0, me.item1, me.item2, me.item3, me.item4, me.item5];
  const trinket = me.item6;
  const teams: [MatchParticipant[], MatchParticipant[]] = [
    match.info.participants.filter((p) => p.teamId === 100),
    match.info.participants.filter((p) => p.teamId === 200),
  ];
  const badges = getMatchBadges(match, me);
  const reasons = getMatchPerformanceReasons(match, me);
  const date = new Date(match.info.gameCreation);
  const dateAbs = date.toLocaleString();

  const teamDamageScale = damageShareForTeam(match.info.participants);

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden transition-all animate-fade-in focus-within:ring-2 focus-within:ring-ring/50",
        win
          ? "border-win/40 bg-win/5 hover:bg-win/10 shadow-[0_0_24px_-12px] shadow-win/60"
          : "border-loss/40 bg-loss/5 hover:bg-loss/10 shadow-[0_0_24px_-12px] shadow-loss/60"
      )}
    >
      <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[170px_auto_1fr_auto] gap-3 p-4 items-center">
        <div className="flex flex-col gap-1 min-w-0">
          <div
            className={cn("text-sm font-bold", win ? "text-win" : "text-loss")}
          >
            {queueName(match.info.queueId)}
          </div>
          <div
            className="text-xs text-muted-foreground cursor-help"
            title={dateAbs}
          >
            {timeAgo(match.info.gameCreation)}
          </div>
          <div className="text-xs text-muted-foreground">
            <span
              className={cn("font-semibold", win ? "text-win" : "text-loss")}
            >
              {win ? "Victory" : "Defeat"}
            </span>
            {" · "}
            {formatDuration(match.info.gameDuration)}
          </div>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-wider",
                    b.className
                  )}
                >
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
              width={72}
              height={72}
              unoptimized
              className={cn(
                "rounded-xl ring-2",
                win ? "ring-win/60" : "ring-loss/60"
              )}
              title={me.championName}
            />
            <span className="absolute -bottom-1 -right-1 bg-background border border-border text-[10px] px-1.5 rounded-full font-bold">
              {me.champLevel}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {[me.summoner1Id, me.summoner2Id].map((sid, i) => {
              const spell = spellMap[sid];
              return (
                <Image
                  key={i}
                  src={summonerSpellIconUrl(sid, version)}
                  alt={spell?.name ?? `spell-${sid}`}
                  title={spell?.name ?? `Spell ${sid}`}
                  width={28}
                  height={28}
                  unoptimized
                  className="rounded"
                />
              );
            })}
          </div>
        </div>

        <div className="hidden sm:flex flex-col gap-0.5">
          <div className="text-base font-bold">
            {me.kills} <span className="text-muted-foreground">/</span>{" "}
            <span className="text-loss">{me.deaths}</span>{" "}
            <span className="text-muted-foreground">/</span> {me.assists}
          </div>
          <div className="text-xs text-muted-foreground">
            {kdaRatio(me.kills, me.deaths, me.assists)} KDA
          </div>
          <div className="text-xs text-muted-foreground">
            {totalCs} CS ({cspm}/m) · {me.visionScore} vis
          </div>
          <div className="text-xs text-muted-foreground">
            {me.totalDamageDealtToChampions.toLocaleString()} dmg
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-1">
            {items.map((id, i) => {
              const url = itemIconUrl(id, version);
              const name = id ? itemMap[id] : null;
              return (
                <div
                  key={i}
                  title={name ?? "Empty"}
                  className="h-8 w-8 rounded-md bg-secondary/80 overflow-hidden border border-border/40"
                >
                  {url && (
                    <Image
                      src={url}
                      alt={name ?? `item-${id}`}
                      width={32}
                      height={32}
                      unoptimized
                    />
                  )}
                </div>
              );
            })}
            {trinket ? (
              <div
                title={itemMap[trinket] ?? "Trinket"}
                className="h-8 w-8 rounded-full bg-secondary/80 overflow-hidden border border-border/40"
              >
                <Image
                  src={itemIconUrl(trinket, version) ?? ""}
                  alt={itemMap[trinket] ?? "trinket"}
                  width={32}
                  height={32}
                  unoptimized
                />
              </div>
            ) : (
              <div className="h-8 w-8" />
            )}
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-2 rounded-md hover:bg-secondary/60 transition-colors"
            aria-label="Toggle details"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0">
          <div className="border-t border-border/40 bg-background/40 p-4 space-y-4">
            {reasons.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Why This Game {win ? "Went Well" : "Went Poorly"}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {reasons.map((reason) => (
                    <div
                      key={reason.text}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm",
                        reason.tone === "good"
                          ? "border-win/30 bg-win/10 text-win"
                          : "border-loss/30 bg-loss/10 text-loss"
                      )}
                    >
                      {reason.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}

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
          "flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2",
          side === "blue" ? "text-win" : "text-loss"
        )}
      >
        <span>{side === "blue" ? "Blue Team" : "Red Team"}</span>
        <span className="text-muted-foreground font-medium normal-case">
          {win ? "Victory" : "Defeat"}
        </span>
      </div>
      <div className="space-y-1.5">
        {team.map((p) => {
          const cs = p.totalMinionsKilled + (p.neutralMinionsKilled ?? 0);
          const isMe = p.puuid === puuid;
          const dmgPct = dmgScale(p);
          return (
            <div
              key={p.puuid}
              className={cn(
                "grid grid-cols-[auto_1fr_auto] gap-2 items-center rounded-md px-2 py-1.5 text-xs",
                isMe ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-secondary/40"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Image
                  src={championSquareUrl(p.championName, version)}
                  alt={p.championName}
                  title={p.championName}
                  width={28}
                  height={28}
                  unoptimized
                  className="rounded"
                />
                <div className="flex flex-col gap-0.5">
                  <Image
                    src={summonerSpellIconUrl(p.summoner1Id, version)}
                    alt=""
                    width={12}
                    height={12}
                    unoptimized
                    title={spellMap[p.summoner1Id]?.name}
                    className="rounded-sm"
                  />
                  <Image
                    src={summonerSpellIconUrl(p.summoner2Id, version)}
                    alt=""
                    width={12}
                    height={12}
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
                <div className="mt-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      side === "blue"
                        ? "bg-gradient-to-r from-sky-400 to-sky-600"
                        : "bg-gradient-to-r from-rose-400 to-rose-600"
                    )}
                    style={{ width: `${dmgPct}%` }}
                    title={`${p.totalDamageDealtToChampions.toLocaleString()} damage`}
                  />
                </div>
              </div>
              <div className="text-right tabular-nums">
                <div className="font-mono font-semibold">
                  {p.kills}/{p.deaths}/{p.assists}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {cs} cs ·{" "}
                  {(p.totalDamageDealtToChampions / 1000).toFixed(1)}k
                </div>
              </div>
              <div className="col-span-3 flex gap-0.5 mt-1">
                {[p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map(
                  (id, i) => {
                    const url = id ? itemIconUrl(id, version) : null;
                    const name = id ? itemMap[id] : null;
                    return (
                      <div
                        key={i}
                        title={name ?? "Empty"}
                        className="h-5 w-5 rounded bg-secondary/60 overflow-hidden border border-border/30"
                      >
                        {url && (
                          <Image
                            src={url}
                            alt=""
                            width={20}
                            height={20}
                            unoptimized
                          />
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
