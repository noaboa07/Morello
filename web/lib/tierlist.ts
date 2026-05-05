import { getChampionIdMap, getLatestVersion } from "@/lib/ddragon";
import type { ChampionTierEntry, TierLabel, TierListPayload } from "@/lib/types";

// U.GG role IDs → display role names
const UGG_ROLE_MAP: Record<string, string> = {
  "1": "JUNGLE",
  "2": "MID",
  "3": "BOT",
  "4": "SUPPORT",
  "5": "TOP",
};

function assignTierByWinRate(wr: number): TierLabel {
  if (wr > 52) return "S";
  if (wr >= 50) return "A";
  if (wr >= 48) return "B";
  if (wr >= 46) return "C";
  return "D";
}

// "14.13.1" → "14_13"
function patchToUggFormat(version: string): string {
  const parts = version.split(".");
  return `${parts[0]}_${parts[1]}`;
}

function parseUggData(
  data: unknown,
  championIdMap: Record<string, string>
): ChampionTierEntry[] {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return [];

  const entries: ChampionTierEntry[] = [];
  const raw = data as Record<string, unknown>;

  for (const [champKey, roleData] of Object.entries(raw)) {
    const championId = championIdMap[champKey];
    if (!championId) continue;

    if (typeof roleData !== "object" || roleData === null || Array.isArray(roleData)) continue;

    for (const [roleKey, stats] of Object.entries(roleData as Record<string, unknown>)) {
      const role = UGG_ROLE_MAP[roleKey];
      if (!role) continue;

      // stats may be [statsArray] or [[statsArray]] depending on U.GG version
      let arr: number[] = [];
      if (Array.isArray(stats)) {
        const inner = Array.isArray(stats[0]) ? stats[0] : stats;
        arr = (inner as unknown[]).filter((v): v is number => typeof v === "number");
      }
      if (arr.length < 2) continue;

      // Detect format by magnitude of first value:
      //   > 100  → raw counts: [totalGames, wins, ...]
      //   0–100  → percentages: [winRate%, pickRate%, banRate%, ...]
      //   0–1    → decimals: [winRate, pickRate, banRate, ...]
      let winRate: number, pickRate: number, banRate: number, games: number;

      if (arr[0] > 100) {
        games = arr[0];
        const wins = arr[1] ?? 0;
        winRate = games > 0 ? (wins / games) * 100 : 0;
        pickRate = (arr[2] ?? 0) <= 100 ? (arr[2] ?? 0) : 0;
        banRate = (arr[3] ?? 0) <= 100 ? (arr[3] ?? 0) : 0;
      } else if (arr[0] <= 1) {
        winRate = arr[0] * 100;
        pickRate = (arr[1] ?? 0) * 100;
        banRate = (arr[2] ?? 0) * 100;
        games = arr[3] ?? 1000;
      } else {
        winRate = arr[0];
        pickRate = arr[1] ?? 0;
        banRate = arr[2] ?? 0;
        games = arr[3] ?? 1000;
      }

      if (games < 100) continue;
      if (winRate <= 0 || winRate > 100) continue;

      entries.push({
        championId,
        role,
        tier: assignTierByWinRate(winRate),
        winRate: Math.round(winRate * 100) / 100,
        pickRate: Math.round(pickRate * 100) / 100,
        banRate: Math.round(banRate * 100) / 100,
        games,
      });
    }
  }

  return entries;
}

export async function fetchTierList(): Promise<TierListPayload | { error: string }> {
  try {
    const [championIdMap, version] = await Promise.all([
      getChampionIdMap(),
      getLatestVersion(),
    ]);

    const uggPatch = patchToUggFormat(version);
    const url = `https://stats2.u.gg/lol/1.5/table/champions/${uggPatch}/ranked_solo_5x5/platinum_plus/1.5.0.json`;

    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      console.error(`[tierlist] U.GG fetch failed: ${res.status} — patch ${uggPatch} — ${url}`);
      return { error: `Tier data unavailable (${res.status}). Try again later.` };
    }

    const data: unknown = await res.json();

    // Log full shape for Vercel diagnostics
    const isArr = Array.isArray(data);
    console.log("[tierlist] U.GG response type:", typeof data, isArr ? "(array)" : "(object)");
    if (!isArr && typeof data === "object" && data !== null) {
      const keys = Object.keys(data as object);
      console.log("[tierlist] U.GG top-level keys (first 5):", keys.slice(0, 5));
      const firstKey = keys[0];
      if (firstKey) {
        const firstEntry = (data as Record<string, unknown>)[firstKey];
        console.log(`[tierlist] U.GG first entry [${firstKey}]:`, JSON.stringify(firstEntry).slice(0, 500));
      }
    } else if (isArr) {
      console.log("[tierlist] U.GG first array element:", JSON.stringify((data as unknown[])[0]).slice(0, 500));
    }

    const entries = parseUggData(data, championIdMap);

    if (entries.length === 0) {
      console.error("[tierlist] U.GG: 0 entries parsed — shape mismatch. Full first entry logged above.");
      return { error: "Could not parse tier data. Shape mismatch — check server logs." };
    }

    console.log(`[tierlist] U.GG: parsed ${entries.length} entries for patch ${uggPatch}`);
    return {
      patch: version,
      version,
      entries,
      source: "ugg",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[tierlist] U.GG exception:", message);
    return { error: message };
  }
}
