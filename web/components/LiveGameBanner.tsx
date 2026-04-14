"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Radio } from "lucide-react";
import { championSquareUrl } from "@/lib/ddragon";
import { formatDuration, cn } from "@/lib/utils";
import type { LiveGameSummary } from "@/lib/types";

export function LiveGameBanner({
  initialGame,
  platform,
  puuid,
  version,
}: {
  initialGame: LiveGameSummary | null;
  platform: string;
  puuid: string;
  version: string;
}) {
  const [game, setGame] = useState<LiveGameSummary | null>(initialGame);
  const [visible, setVisible] = useState(Boolean(initialGame));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setGame(initialGame);
    setVisible(Boolean(initialGame));
  }, [initialGame]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/live/${platform}/${puuid}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { game: LiveGameSummary | null };
        if (cancelled) return;

        if (data.game) {
          setGame(data.game);
          setVisible(true);
        } else {
          setVisible(false);
          window.setTimeout(() => {
            if (!cancelled) setGame(null);
          }, 250);
        }
      } catch {
        // Ignore transient polling failures and keep the last known state.
      }
    };

    const interval = window.setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [platform, puuid]);

  const displayDuration = useMemo(() => {
    if (!game) return 0;
    if (!game.gameStartTime) return game.gameLength;
    return Math.max(game.gameLength, Math.floor((now - game.gameStartTime) / 1000));
  }, [game, now]);

  if (!game) return null;

  const { gameMode, championName } = game;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-loss/50 bg-gradient-to-r from-loss/15 via-loss/10 to-transparent p-4 transition-all duration-300",
        visible ? "animate-fade-in opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="absolute inset-0 -z-10 bg-loss/10 animate-pulse" />
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-loss/40 animate-ping" />
          <span className="relative flex h-3 w-3 rounded-full bg-loss" />
        </div>
        <div className="flex items-center gap-2 text-loss font-bold uppercase tracking-wider text-sm">
          <Radio className="h-4 w-4" />
          Live - In Game
        </div>
        {championName && (
          <div className="flex items-center gap-2 ml-2">
            <Image
              src={championSquareUrl(championName, version)}
              alt={championName}
              width={36}
              height={36}
              unoptimized
              className="rounded-md ring-2 ring-loss/40"
            />
            <span className="font-semibold">{championName}</span>
          </div>
        )}
        <div className="ml-auto text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            {gameMode}
          </div>
          <div className="text-lg font-bold tabular-nums text-foreground">
            {formatDuration(displayDuration)}
          </div>
        </div>
      </div>
    </div>
  );
}
