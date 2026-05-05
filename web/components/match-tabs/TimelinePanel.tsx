"use client";

import { useState } from "react";
import Image from "next/image";
import { championSquareUrl } from "@/lib/ddragon";
import { cn } from "@/lib/utils";
import type { MatchDTO, MatchParticipant, MatchTimeline, TimelineEvent } from "@/lib/types";

interface TimelinePanelProps {
  timeline: MatchTimeline | "loading" | "unavailable";
  match: MatchDTO;
  puuid: string;
  version: string;
}

type EventFilter = "kills" | "objectives" | "vision";

function fmtTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function TimelinePanel({ timeline, match, puuid, version }: TimelinePanelProps) {
  const [filters, setFilters] = useState<Set<EventFilter>>(
    new Set(["kills", "objectives", "vision"])
  );

  if (timeline === "loading" || timeline === "unavailable") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-32 text-sm text-muted-foreground">
        {timeline === "loading" ? (
          <span className="animate-pulse">Loading timeline data…</span>
        ) : (
          <>
            <span className="text-2xl">⏱</span>
            <span>Timeline data is not available for this match.</span>
            <span className="text-xs">Older matches may not have timeline data in the Riot API.</span>
          </>
        )}
      </div>
    );
  }

  const participants = match.info.participants;
  const myParticipantId =
    participants.findIndex((p) => p.puuid === puuid) + 1; // 1-indexed

  function getParticipant(id: number): MatchParticipant | undefined {
    return participants[id - 1];
  }

  // Collect all relevant events from all frames
  const allEvents: TimelineEvent[] = timeline.info.frames.flatMap((f) => f.events);

  const filteredEvents = allEvents.filter((e) => {
    if (e.type === "CHAMPION_KILL" && filters.has("kills")) return true;
    if (
      e.type === "ELITE_MONSTER_KILL" &&
      filters.has("objectives") &&
      ["DRAGON", "BARON_NASHOR", "RIFTHERALD", "HORDE"].includes(e.monsterType ?? "")
    )
      return true;
    if (e.type === "BUILDING_KILL" && filters.has("objectives")) return true;
    if ((e.type === "WARD_PLACED" || e.type === "WARD_KILL") && filters.has("vision")) return true;
    return false;
  });

  function toggleFilter(f: EventFilter) {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }

  // Minimap events: only kills + objectives with position data
  const minimapEvents = allEvents.filter(
    (e) =>
      e.position &&
      (e.type === "CHAMPION_KILL" ||
        (e.type === "ELITE_MONSTER_KILL" &&
          ["DRAGON", "BARON_NASHOR", "RIFTHERALD"].includes(e.monsterType ?? "")) ||
        e.type === "BUILDING_KILL")
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* ── Event feed (left) ── */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {(["kills", "objectives", "vision"] as EventFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => toggleFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize",
                filters.has(f)
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Event list */}
        <div className="space-y-0.5 max-h-[420px] overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events match the current filters.
            </p>
          ) : (
            filteredEvents.map((e, idx) => {
              const involveMe =
                e.killerId === myParticipantId ||
                e.victimId === myParticipantId ||
                e.assistingParticipantIds?.includes(myParticipantId) ||
                e.creatorId === myParticipantId;

              return (
                <EventRow
                  key={idx}
                  event={e}
                  involveMe={involveMe}
                  getParticipant={getParticipant}
                  version={version}
                />
              );
            })
          )}
        </div>
      </div>

      {/* ── Minimap (right) ── */}
      <div className="lg:w-[240px] shrink-0">
        <div className="eyebrow text-muted-foreground mb-2">Event Map</div>
        <div className="relative w-full aspect-square max-w-[240px]">
          <Image
            src="https://ddragon.leagueoflegends.com/cdn/img/map/map11.png"
            alt="Summoner's Rift minimap"
            fill
            unoptimized
            className="rounded-md object-cover"
          />
          {minimapEvents.map((e, idx) => {
            if (!e.position) return null;
            const left = `clamp(0px, ${(e.position.x / 15000) * 100}%, calc(100% - 8px))`;
            const top = `clamp(0px, ${(1 - e.position.y / 15000) * 100}%, calc(100% - 8px))`;

            const killer = e.killerId ? getParticipant(e.killerId) : undefined;
            const teamId = killer?.teamId ?? (e.teamId ?? 100);
            const isBlue = teamId === 100;
            const involveMe =
              e.killerId === myParticipantId || e.victimId === myParticipantId;

            return (
              <span
                key={idx}
                className={cn(
                  "absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80",
                  involveMe
                    ? "h-3 w-3 ring-2 ring-white/60 opacity-100"
                    : "",
                  isBlue ? "bg-sky-400" : "bg-rose-400"
                )}
                style={{ left, top }}
                title={`${e.type} at ${fmtTime(e.timestamp)}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventRow({
  event: e,
  involveMe,
  getParticipant,
  version,
}: {
  event: TimelineEvent;
  involveMe: boolean;
  getParticipant: (id: number) => MatchParticipant | undefined;
  version: string;
}) {
  const time = fmtTime(e.timestamp);

  const base = cn(
    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
    involveMe ? "bg-primary/10" : "hover:bg-secondary/20"
  );

  if (e.type === "CHAMPION_KILL") {
    const killer = e.killerId ? getParticipant(e.killerId) : undefined;
    const victim = e.victimId ? getParticipant(e.victimId) : undefined;
    const assistCount = e.assistingParticipantIds?.length ?? 0;
    return (
      <div className={base}>
        <span className="text-[10px] text-muted-foreground tabular-nums w-12 shrink-0">{time}</span>
        {killer ? (
          <Image src={championSquareUrl(killer.championName, version)} alt={killer.championName} width={18} height={18} unoptimized className="rounded-sm shrink-0" />
        ) : (
          <span className="text-muted-foreground text-[10px]">Env</span>
        )}
        <span className="text-muted-foreground">→</span>
        {victim && (
          <Image src={championSquareUrl(victim.championName, version)} alt={victim.championName} width={18} height={18} unoptimized className="rounded-sm shrink-0 opacity-60" />
        )}
        <span className="text-foreground font-medium">
          {killer ? (killer.riotIdGameName ?? killer.summonerName) : "Environment"} killed {victim ? (victim.riotIdGameName ?? victim.summonerName) : "unknown"}
          {assistCount > 0 && <span className="text-muted-foreground"> (+{assistCount})</span>}
        </span>
      </div>
    );
  }

  if (e.type === "ELITE_MONSTER_KILL") {
    const killer = e.killerId ? getParticipant(e.killerId) : undefined;
    const monster = e.monsterType === "BARON_NASHOR" ? "Baron"
      : e.monsterType === "DRAGON" ? `${e.monsterSubType ? e.monsterSubType.split("_")[0] : ""} Dragon`
      : e.monsterType === "RIFTHERALD" ? "Rift Herald"
      : e.monsterType ?? "Monster";
    return (
      <div className={base}>
        <span className="text-[10px] text-muted-foreground tabular-nums w-12 shrink-0">{time}</span>
        <span className="text-amber-400 font-bold text-[10px] shrink-0">OBJ</span>
        <span className="text-foreground font-medium">
          {killer ? (killer.riotIdGameName ?? killer.summonerName) : "Team"} slew {monster}
        </span>
      </div>
    );
  }

  if (e.type === "BUILDING_KILL") {
    const isBlue = e.teamId === 100;
    const lane = e.laneType === "TOP_LANE" ? "Top" : e.laneType === "BOT_LANE" ? "Bot" : "Mid";
    return (
      <div className={base}>
        <span className="text-[10px] text-muted-foreground tabular-nums w-12 shrink-0">{time}</span>
        <span className={cn("font-bold text-[10px] shrink-0", isBlue ? "text-sky-400" : "text-rose-400")}>TWR</span>
        <span className="text-foreground font-medium">
          {lane} {isBlue ? "Blue" : "Red"} tower destroyed
        </span>
      </div>
    );
  }

  if (e.type === "WARD_PLACED" || e.type === "WARD_KILL") {
    const actor = e.creatorId
      ? getParticipant(e.creatorId)
      : e.killerId
      ? getParticipant(e.killerId)
      : undefined;
    return (
      <div className={base}>
        <span className="text-[10px] text-muted-foreground tabular-nums w-12 shrink-0">{time}</span>
        <span className="text-teal-400 font-bold text-[10px] shrink-0">WRD</span>
        <span className="text-foreground font-medium">
          {actor ? (actor.riotIdGameName ?? actor.summonerName) : "Unknown"}{" "}
          {e.type === "WARD_PLACED" ? "placed" : "cleared"} a {e.wardType?.toLowerCase().replace(/_/g, " ") ?? "ward"}
        </span>
      </div>
    );
  }

  return null;
}
