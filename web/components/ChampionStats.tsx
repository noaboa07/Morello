"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { championSquareUrl } from "@/lib/ddragon";
import { kdaRatio, cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { MatchDTO } from "@/lib/types";

interface Stat {
  championName: string;
  games: number;
  wins: number;
  k: number;
  d: number;
  a: number;
}

export function ChampionStats({
  matches,
  puuid,
  version,
  selected,
  onSelect,
}: {
  matches: MatchDTO[];
  puuid: string;
  version: string;
  selected: string | null;
  onSelect: (champion: string | null) => void;
}) {
  const map = new Map<string, Stat>();
  for (const m of matches) {
    const me = m.info.participants.find((p) => p.puuid === puuid);
    if (!me) continue;
    const cur =
      map.get(me.championName) ?? {
        championName: me.championName,
        games: 0,
        wins: 0,
        k: 0,
        d: 0,
        a: 0,
      };
    cur.games += 1;
    cur.wins += me.win ? 1 : 0;
    cur.k += me.kills;
    cur.d += me.deaths;
    cur.a += me.assists;
    map.set(me.championName, cur);
  }

  const stats = Array.from(map.values())
    .sort((a, b) => b.games - a.games)
    .slice(0, 7);

  if (stats.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Champion Stats</CardTitle>
        {selected && (
          <button
            onClick={() => onSelect(null)}
            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear filter
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {stats.map((s) => {
          const wr = Math.round((s.wins / s.games) * 100);
          const isActive = selected === s.championName;
          return (
            <button
              key={s.championName}
              onClick={() => onSelect(isActive ? null : s.championName)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg p-2 transition-all text-left",
                isActive
                  ? "bg-primary/15 ring-1 ring-primary/40"
                  : "hover:bg-secondary/50"
              )}
            >
              <Image
                src={championSquareUrl(s.championName, version)}
                alt={s.championName}
                width={40}
                height={40}
                unoptimized
                className="rounded-md"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-sm">
                  {s.championName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {kdaRatio(s.k / s.games, s.d / s.games, s.a / s.games)} KDA
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    "text-sm font-semibold",
                    wr >= 50 ? "text-win" : "text-loss"
                  )}
                >
                  {wr}%
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {s.games}g
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
