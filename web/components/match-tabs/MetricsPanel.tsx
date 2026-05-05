"use client";

import { useState } from "react";
import Image from "next/image";
import {
  LineChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { championSquareUrl } from "@/lib/ddragon";
import { cn } from "@/lib/utils";
import type { MatchDTO, MatchParticipant, MatchTimeline } from "@/lib/types";

interface MetricsPanelProps {
  timeline: MatchTimeline | "loading" | "unavailable";
  match: MatchDTO;
  puuid: string;
  version: string;
}

type SubTab = "gold" | "xp" | "cs" | "damage" | "team-gold";

const BLUE = ["#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8"] as const;
const RED  = ["#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c"] as const;

function fmtY(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

type ChartPoint = { time: number } & Record<string, number>;

export function MetricsPanel({ timeline, match, puuid, version }: MetricsPanelProps) {
  const [activeTab, setActiveTab] = useState<SubTab>("gold");
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  const participants = match.info.participants;
  const myIdx = participants.findIndex((p) => p.puuid === puuid); // 0-indexed

  function toggleLine(key: string) {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Fallback: flat stats table when timeline unavailable
  if (timeline === "loading" || timeline === "unavailable") {
    const me = participants[myIdx];
    if (!me) return null;
    return <FlatStatsTable match={match} me={me} isLoading={timeline === "loading"} />;
  }

  // Check if damageStats are present
  const hasDamage = timeline.info.frames.some((f) =>
    Object.values(f.participantFrames).some((pf) => pf.damageStats != null)
  );

  const availableTabs: SubTab[] = [
    "gold", "xp", "cs",
    ...(hasDamage ? (["damage"] as SubTab[]) : []),
    "team-gold",
  ];

  // Team gold diff data (blue total - red total per frame)
  type TeamGoldPoint = { time: number; posDiff: number; negDiff: number };
  const teamGoldData: TeamGoldPoint[] = timeline.info.frames.map((frame) => {
    let blueGold = 0, redGold = 0;
    for (let i = 1; i <= 10; i++) {
      const pf = frame.participantFrames[String(i)];
      if (!pf) continue;
      const p = participants[i - 1];
      if (p?.teamId === 100) blueGold += pf.totalGold;
      else redGold += pf.totalGold;
    }
    const diff = blueGold - redGold;
    return { time: Math.round(frame.timestamp / 60000), posDiff: Math.max(diff, 0), negDiff: Math.min(diff, 0) };
  });

  // Build per-player chart data
  const chartData: ChartPoint[] = timeline.info.frames.map((frame) => {
    const point: ChartPoint = { time: Math.round(frame.timestamp / 60000) };
    for (let i = 1; i <= 10; i++) {
      const pf = frame.participantFrames[String(i)];
      if (!pf) continue;
      if (activeTab === "gold")   point[`p${i}`] = pf.totalGold;
      if (activeTab === "xp")     point[`p${i}`] = pf.xp;
      if (activeTab === "cs")     point[`p${i}`] = pf.minionsKilled + pf.jungleMinionsKilled;
      if (activeTab === "damage") point[`p${i}`] = pf.damageStats?.totalDamageDone ?? 0;
    }
    return point;
  });

  // Blue team = participants[0..4] (teamId 100), Red = participants[5..9] (teamId 200)
  const blueParticipants = participants.filter((p) => p.teamId === 100);
  const redParticipants  = participants.filter((p) => p.teamId === 200);

  function participantIndex(p: MatchParticipant): number {
    return participants.indexOf(p) + 1; // 1-indexed, matching participantFrames key
  }

  function lineColor(p: MatchParticipant): string {
    if (p.teamId === 100) {
      const i = blueParticipants.indexOf(p);
      return BLUE[i] ?? BLUE[0];
    } else {
      const i = redParticipants.indexOf(p);
      return RED[i] ?? RED[0];
    }
  }

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-2">
        {availableTabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "rounded-md border px-3 py-1 text-xs font-medium capitalize transition-colors",
              activeTab === t
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "xp" ? "XP" : t === "team-gold" ? "Team Gold" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Champion icon legend / toggles — hidden for aggregate sub-tabs */}
      <div className={cn("flex flex-wrap gap-1.5", activeTab === "team-gold" && "hidden")}>
        {participants.map((p) => {
          const key = `p${participantIndex(p)}`;
          const hidden = hiddenLines.has(key);
          return (
            <button
              key={p.puuid}
              onClick={() => toggleLine(key)}
              title={p.riotIdGameName ?? p.summonerName}
              className={cn(
                "rounded-sm overflow-hidden transition-opacity ring-1",
                hidden ? "opacity-30" : "opacity-100",
                p.puuid === puuid ? "ring-white/60" : "ring-transparent"
              )}
            >
              <Image
                src={championSquareUrl(p.championName, version)}
                alt={p.championName}
                width={24}
                height={24}
                unoptimized
              />
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        {activeTab === "team-gold" ? (
          <AreaChart data={teamGoldData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              label={{ value: "min", position: "insideBottomRight", offset: -4, fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickFormatter={fmtY}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="4 2" />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "11px",
                padding: "6px 10px",
              }}
              labelFormatter={(v) => `${v}m`}
              formatter={(val) => {
                const n = Number(val ?? 0);
                return [`${fmtY(Math.abs(n))} gold`, n >= 0 ? "Blue lead" : "Red lead"];
              }}
            />
            <Area type="monotone" dataKey="posDiff" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} dot={false} />
            <Area type="monotone" dataKey="negDiff" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} dot={false} />
          </AreaChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              label={{ value: "min", position: "insideBottomRight", offset: -4, fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickFormatter={fmtY}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "11px",
                padding: "6px 10px",
              }}
              labelFormatter={(v) => `${v}m`}
              formatter={(value, name) => {
                const numValue = typeof value === "number" ? value : Number(value ?? 0);
                const nameStr = String(name);
                const idx = parseInt(nameStr.slice(1), 10) - 1;
                const p = participants[idx];
                const label = p ? (p.riotIdGameName ?? p.summonerName) : nameStr;
                return [fmtY(numValue), label];
              }}
            />
            {participants.map((p) => {
              const key = `p${participantIndex(p)}`;
              const isMe = p.puuid === puuid;
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={isMe ? "#ffffff" : lineColor(p)}
                  strokeWidth={isMe ? 2.5 : 1.5}
                  dot={false}
                  hide={hiddenLines.has(key)}
                  activeDot={{ r: isMe ? 5 : 3 }}
                />
              );
            })}
          </LineChart>
        )}
      </ResponsiveContainer>

      {/* Team Gold legend */}
      {activeTab === "team-gold" && (
        <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            Blue team ahead
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
            Red team ahead
          </span>
        </div>
      )}
    </div>
  );
}

function FlatStatsTable({
  match,
  me,
  isLoading,
}: {
  match: MatchDTO;
  me: MatchParticipant;
  isLoading: boolean;
}) {
  const myTeam = match.info.participants.filter((p) => p.teamId === me.teamId);
  const teamSize = myTeam.length || 1;
  const teamAvg = (sel: (p: MatchParticipant) => number) =>
    myTeam.reduce((s, p) => s + sel(p), 0) / teamSize;

  const rows = [
    { label: "Damage dealt",  player: me.totalDamageDealtToChampions.toLocaleString(), avg: Math.round(teamAvg((p) => p.totalDamageDealtToChampions)).toLocaleString() },
    { label: "Damage taken",  player: (me.totalDamageTaken ?? 0).toLocaleString(),     avg: Math.round(teamAvg((p) => p.totalDamageTaken ?? 0)).toLocaleString() },
    { label: "Healing done",  player: (me.totalHeal ?? 0).toLocaleString(),             avg: Math.round(teamAvg((p) => p.totalHeal ?? 0)).toLocaleString() },
    { label: "Shielding",     player: (me.totalDamageShieldedOnTeammates ?? 0).toLocaleString(), avg: Math.round(teamAvg((p) => p.totalDamageShieldedOnTeammates ?? 0)).toLocaleString() },
    { label: "CC time (s)",   player: String(me.timeCCingOthers ?? 0),                  avg: teamAvg((p) => p.timeCCingOthers ?? 0).toFixed(0) },
    { label: "Turret damage", player: (me.damageDealtToObjectives ?? 0).toLocaleString(), avg: Math.round(teamAvg((p) => p.damageDealtToObjectives ?? 0)).toLocaleString() },
    { label: "Vision score",  player: String(me.visionScore),                           avg: teamAvg((p) => p.visionScore).toFixed(1) },
    { label: "Wards placed",  player: String(me.wardsPlaced ?? 0),                     avg: teamAvg((p) => p.wardsPlaced ?? 0).toFixed(1) },
    { label: "Wards killed",  player: String(me.wardsKilled ?? 0),                     avg: teamAvg((p) => p.wardsKilled ?? 0).toFixed(1) },
  ];

  return (
    <div className="space-y-3">
      {isLoading && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Loading time-series data…
        </p>
      )}
      {!isLoading && (
        <p className="text-xs text-muted-foreground italic">
          Time-series unavailable — showing final match stats.
        </p>
      )}
      <div className="rounded-lg border border-border/70 bg-card overflow-hidden">
        <div className="grid grid-cols-3 border-b border-border/60 bg-secondary/30 px-4 py-2">
          <div className="eyebrow text-muted-foreground">Stat</div>
          <div className="eyebrow text-primary/70 text-right">You</div>
          <div className="eyebrow text-muted-foreground text-right">Team avg</div>
        </div>
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-3 px-4 py-2.5 text-sm border-b border-border/30 last:border-0 hover:bg-secondary/20">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-right font-mono font-semibold tabular-nums text-foreground">{row.player}</span>
            <span className="text-right font-mono tabular-nums text-muted-foreground">{row.avg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
