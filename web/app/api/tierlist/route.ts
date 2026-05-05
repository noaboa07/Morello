import { NextResponse } from "next/server";
import { getChampionIdMap, getLatestVersion } from "@/lib/ddragon";
import type { ChampionTierEntry, TierLabel, TierListPayload } from "@/lib/types";

// ── Lolalytics CDN ────────────────────────────────────────────────────────────
// Aggregates win/pick/ban rates from millions of Plat+ games per patch.
// Fallback: if Lolalytics is unreachable or returns unexpected shape, the route
// falls back to Meraki (pick-rate only, win/ban rates will be 0).
//
// If Lolalytics continues to be unreachable, next options to try:
//   - u.gg CDN:    https://stats2.u.gg/lol/1.5/<patch>/ranked_solo_5x5/<tier>/1.json
//   - CDragon:     https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champion-statistics/
const LOLALYTICS_URL =
  "https://axe.lolalytics.com/tierlist/1/?lane=default&tier=plat_plus&patch=current&region=all";

const MERAKI_URL =
  "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/championrates.json";

// Lolalytics lane IDs → display role names
const LOLALYTICS_LANE_MAP: Record<number, string> = {
  1: "TOP",
  2: "JUNGLE",
  3: "MID",
  4: "BOT",
  5: "SUPPORT",
};

// Meraki role keys → display role names
const MERAKI_ROLE_MAP: Record<string, string> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MIDDLE: "MID",
  BOTTOM: "BOT",
  UTILITY: "SUPPORT",
};

function assignTierByWinRate(wr: number): TierLabel {
  if (wr > 52) return "S";
  if (wr >= 50) return "A";
  if (wr >= 48) return "B";
  if (wr >= 46) return "C";
  return "D";
}

function assignTierByPickRate(pickRate: number): TierLabel {
  if (pickRate >= 4) return "S";
  if (pickRate >= 2) return "A";
  if (pickRate >= 1) return "B";
  if (pickRate >= 0.4) return "C";
  return "D";
}

// ── Lolalytics response shape ─────────────────────────────────────────────────
// Each champion key maps to either a single stat object or an array (one per role).
// Fields: n=games, wr=win rate %, pr=pick rate %, br=ban rate %, lane=role ID.
interface LolalyticsEntry {
  n: number;
  wr: number;
  pr: number;
  br: number;
  lane?: number;
}

function isLolalyticsEntry(v: unknown): v is LolalyticsEntry {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.n === "number" &&
    typeof o.wr === "number" &&
    typeof o.pr === "number" &&
    typeof o.br === "number"
  );
}

async function fetchLolalyticsEntries(
  championIdMap: Record<string, string>
): Promise<{ entries: ChampionTierEntry[]; patch: string } | null> {
  try {
    const res = await fetch(LOLALYTICS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://lolalytics.com/",
        "Accept": "application/json",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[tierlist] Lolalytics fetch failed:", res.status, LOLALYTICS_URL);
      }
      return null;
    }

    const data: unknown = await res.json();
    if (typeof data !== "object" || data === null) return null;

    const raw = data as Record<string, unknown>;
    const cid = raw.cid;
    if (typeof cid !== "object" || cid === null) return null;

    const patch = typeof raw.patch === "string" ? raw.patch : "Latest";
    const entries: ChampionTierEntry[] = [];

    for (const [champKey, champData] of Object.entries(
      cid as Record<string, unknown>
    )) {
      const championId = championIdMap[champKey];
      if (!championId) continue;

      const roleEntries: LolalyticsEntry[] = Array.isArray(champData)
        ? champData.filter(isLolalyticsEntry)
        : isLolalyticsEntry(champData)
          ? [champData]
          : [];

      for (const entry of roleEntries) {
        if (entry.n < 100) continue; // skip low-sample noise
        const role = entry.lane != null ? LOLALYTICS_LANE_MAP[entry.lane] : null;
        if (!role) continue;

        entries.push({
          championId,
          role,
          tier: assignTierByWinRate(entry.wr),
          winRate: Math.round(entry.wr * 100) / 100,
          pickRate: Math.round(entry.pr * 100) / 100,
          banRate: Math.round(entry.br * 100) / 100,
          games: entry.n,
        });
      }
    }

    return entries.length > 0 ? { entries, patch } : null;
  } catch {
    return null;
  }
}

// ── Meraki fallback (pick-rate only, no win/ban rate) ─────────────────────────
interface MerakiRoleStats {
  playRate: number;
}

interface MerakiData {
  patch: string;
  data: Record<string, Record<string, MerakiRoleStats>>;
}

async function fetchMerakiEntries(
  championIdMap: Record<string, string>
): Promise<{ entries: ChampionTierEntry[]; patch: string } | null> {
  try {
    const res = await fetch(MERAKI_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const meraki: MerakiData = await res.json();
    if (!meraki.data || typeof meraki.data !== "object") return null;

    const entries: ChampionTierEntry[] = [];

    for (const [champKey, roleMap] of Object.entries(meraki.data)) {
      const championId = championIdMap[champKey];
      if (!championId) continue;

      for (const [merakiRole, stats] of Object.entries(roleMap)) {
        const role = MERAKI_ROLE_MAP[merakiRole];
        if (!role) continue;
        const pickRate = stats.playRate ?? 0;
        if (pickRate <= 0) continue;

        entries.push({
          championId,
          role,
          tier: assignTierByPickRate(pickRate),
          winRate: 0,
          pickRate,
          banRate: 0,
          games: 0,
        });
      }
    }

    return entries.length > 0 ? { entries, patch: meraki.patch ?? "Latest" } : null;
  } catch {
    return null;
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const [championIdMap, version] = await Promise.all([
      getChampionIdMap(),
      getLatestVersion(),
    ]);

    const lolalytics = await fetchLolalyticsEntries(championIdMap);

    if (lolalytics) {
      const payload: TierListPayload = {
        patch: lolalytics.patch,
        version,
        entries: lolalytics.entries,
        source: "lolalytics",
      };
      return NextResponse.json(payload);
    }

    // Lolalytics unavailable — fall back to Meraki (pick-rate tiers only)
    const meraki = await fetchMerakiEntries(championIdMap);
    if (meraki) {
      const payload: TierListPayload = {
        patch: meraki.patch,
        version,
        entries: meraki.entries,
        source: "meraki",
      };
      return NextResponse.json(payload);
    }

    return NextResponse.json(
      { error: "Both Lolalytics and Meraki upstream sources are unavailable." },
      { status: 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
