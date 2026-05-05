"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { championSquareUrl } from "@/lib/ddragon";
import { Input } from "@/components/ui/input";
import type { ChampionTierEntry, TierLabel, TierListPayload } from "@/lib/types";

const ROLES = ["ALL", "TOP", "JUNGLE", "MID", "BOT", "SUPPORT"] as const;
type RoleFilter = (typeof ROLES)[number];

const TIER_STYLES: Record<TierLabel, { label: string; row: string; badge: string }> = {
  S: {
    label: "S",
    row: "border-yellow-400/20 bg-yellow-400/5",
    badge: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  },
  A: {
    label: "A",
    row: "border-blue-400/20 bg-blue-400/5",
    badge: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  },
  B: {
    label: "B",
    row: "border-green-400/20 bg-green-400/5",
    badge: "text-green-400 border-green-400/40 bg-green-400/10",
  },
  C: {
    label: "C",
    row: "border-orange-400/20 bg-orange-400/5",
    badge: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  },
  D: {
    label: "D",
    row: "border-red-400/20 bg-red-400/5",
    badge: "text-red-400 border-red-400/40 bg-red-400/10",
  },
};

const TIER_ORDER: TierLabel[] = ["S", "A", "B", "C", "D"];

interface Props {
  payload: TierListPayload;
}

export function TierListClient({ payload }: Props) {
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payload.entries.filter((e) => {
      if (role !== "ALL" && e.role !== role) return false;
      if (q && !e.championId.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [payload.entries, role, search]);

  const byTier = useMemo(() => {
    const map = new Map<TierLabel, ChampionTierEntry[]>();
    for (const tier of TIER_ORDER) map.set(tier, []);
    for (const entry of filtered) {
      map.get(entry.tier)?.push(entry);
    }
    // Sort by win rate desc; fall back to pick rate when win rate is unavailable (Meraki fallback)
    for (const [, entries] of map) {
      entries.sort((a, b) =>
        b.winRate !== a.winRate ? b.winRate - a.winRate : b.pickRate - a.pickRate
      );
    }
    return map;
  }, [filtered]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pt-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Champion Tier List</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Meta Snapshot · Pick Rate</p>
        </div>
        <span className="rounded-md border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground">
          Patch {payload.patch}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={[
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              role === r
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground",
            ].join(" ")}
          >
            {r}
          </button>
        ))}
        <Input
          className="ml-auto h-8 max-w-48 text-xs"
          placeholder="Search champion…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tier sections */}
      {TIER_ORDER.map((tier) => {
        const entries = byTier.get(tier) ?? [];
        if (entries.length === 0) return null;
        const styles = TIER_STYLES[tier];

        return (
          <div key={tier} className="space-y-2">
            <div
              className={[
                "inline-flex h-7 w-7 items-center justify-center rounded border text-sm font-bold",
                styles.badge,
              ].join(" ")}
            >
              {tier}
            </div>
            <div className={["rounded-lg border", styles.row].join(" ")}>
              {entries.map((entry) => (
                <div
                  key={`${entry.championId}-${entry.role}`}
                  className="flex items-center gap-3 border-b border-border/30 px-4 py-2.5 last:border-0"
                >
                  <Image
                    src={championSquareUrl(entry.championId, payload.version)}
                    alt={entry.championId}
                    width={24}
                    height={24}
                    className="rounded-sm"
                    unoptimized
                  />
                  <span className="min-w-[120px] text-sm font-medium">{entry.championId}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {entry.role}
                  </span>
                  <div className="ml-auto flex items-center gap-3 font-mono text-xs text-muted-foreground">
                    {entry.winRate > 0 && (
                      <span>{entry.winRate.toFixed(2)}% wr</span>
                    )}
                    <span>{entry.pickRate.toFixed(2)}% pick</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No champions match your filters.
        </p>
      )}
    </div>
  );
}
