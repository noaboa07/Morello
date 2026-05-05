import type { Metadata } from "next";
import { getChampionIdMap, getLatestVersion } from "@/lib/ddragon";
import { TierListClient } from "@/components/TierListClient";
import type { ChampionTierEntry, TierLabel, TierListPayload } from "@/lib/types";

export const metadata: Metadata = {
  title: "Champion Tier List",
  description:
    "Meta champion tier list ranked by pick rate — see which champions are dominating each role this patch.",
};

const MERAKI_URL =
  "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/championrates.json";

const ROLE_MAP: Record<string, string> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MIDDLE: "MID",
  BOTTOM: "BOT",
  UTILITY: "SUPPORT",
};

function assignTier(pickRate: number): TierLabel {
  if (pickRate >= 4) return "S";
  if (pickRate >= 2) return "A";
  if (pickRate >= 1) return "B";
  if (pickRate >= 0.4) return "C";
  return "D";
}

interface MerakiResponse {
  patch: string;
  data: Record<string, Record<string, { playRate: number }>>;
}

async function loadTierList(): Promise<TierListPayload | { error: string }> {
  try {
    const [merakiRes, championIdMap, version] = await Promise.all([
      fetch(MERAKI_URL, { next: { revalidate: 3600 } }),
      getChampionIdMap(),
      getLatestVersion(),
    ]);

    if (!merakiRes.ok) {
      return { error: `Failed to fetch tier data (${merakiRes.status})` };
    }

    const meraki: MerakiResponse = await merakiRes.json();

    if (!meraki.data || typeof meraki.data !== "object") {
      return { error: "Unexpected format from data source" };
    }

    const entries: ChampionTierEntry[] = [];

    for (const [champKey, roleMap] of Object.entries(meraki.data)) {
      const championId = championIdMap[champKey];
      if (!championId) continue;

      for (const [merakiRole, stats] of Object.entries(roleMap)) {
        const role = ROLE_MAP[merakiRole];
        if (!role) continue;

        const pickRate = stats.playRate ?? 0;
        if (pickRate <= 0) continue;

        entries.push({
          championId,
          role,
          tier: assignTier(pickRate),
          winRate: 0,
          pickRate,
          banRate: 0,
          games: 0,
        });
      }
    }

    return { patch: meraki.patch ?? "Latest", entries, version, source: "meraki" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

export default async function TierListPage() {
  const result = await loadTierList();

  if ("error" in result) {
    return (
      <div className="mx-auto max-w-4xl pt-10 text-center text-muted-foreground">
        <p className="text-sm">{result.error}</p>
      </div>
    );
  }

  return <TierListClient payload={result} />;
}
