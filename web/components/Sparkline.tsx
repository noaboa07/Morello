"use client";

import type { MatchDTO } from "@/lib/types";

export function KdaSparkline({
  matches,
  puuid,
}: {
  matches: MatchDTO[];
  puuid: string;
}) {
  const points = matches
    .slice()
    .reverse()
    .map((m) => {
      const me = m.info.participants.find((p) => p.puuid === puuid);
      if (!me) return { kda: 0, win: false };
      const kda =
        me.deaths === 0 ? me.kills + me.assists : (me.kills + me.assists) / me.deaths;
      return { kda, win: me.win };
    });

  if (points.length === 0) return null;

  const max = Math.max(...points.map((p) => p.kda), 3);
  const min = 0;
  const w = 320;
  const h = 64;
  const padX = 8;
  const padY = 8;
  const stepX = points.length > 1 ? (w - padX * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = padX + i * stepX;
    const y = padY + (h - padY * 2) * (1 - (p.kda - min) / (max - min || 1));
    return { x, y, ...p };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${path} L${coords[coords.length - 1].x},${h - padY} L${coords[0].x},${h - padY} Z`;

  const avgKda = points.reduce((s, p) => s + p.kda, 0) / points.length;
  const wins = points.filter((p) => p.win).length;
  const wr = Math.round((wins / points.length) * 100);

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 flex items-center gap-4 animate-fade-in">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          KDA Trend · last {points.length} games
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="text-2xl font-bold tabular-nums">{avgKda.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">avg KDA</span>
          <span
            className={`text-sm font-semibold ${wr >= 50 ? "text-win" : "text-loss"}`}
          >
            {wins}W {points.length - wins}L · {wr}%
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-16 w-[260px] sm:w-[320px] shrink-0"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="kda-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#kda-fill)" />
        <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={3}
            fill={c.win ? "hsl(var(--win))" : "hsl(var(--loss))"}
            stroke="hsl(var(--background))"
            strokeWidth={1.5}
          />
        ))}
      </svg>
    </div>
  );
}
