const DDRAGON = "https://ddragon.leagueoflegends.com";

let cachedVersion: { value: string; expires: number } | null = null;
const VERSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export async function getLatestVersion(): Promise<string> {
  if (cachedVersion && cachedVersion.expires > Date.now()) {
    return cachedVersion.value;
  }
  const res = await fetch(`${DDRAGON}/api/versions.json`, {
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!res.ok) return "14.19.1";
  const versions: string[] = await res.json();
  const value = versions[0] ?? "14.19.1";
  cachedVersion = { value, expires: Date.now() + VERSION_TTL_MS };
  return value;
}

let cachedItems: { map: Record<number, string>; expires: number } | null = null;
let cachedSpells: { map: Record<number, { name: string; key: string }>; expires: number } | null =
  null;
let cachedChampions: { map: Record<string, string>; expires: number } | null = null;

export async function getItemMap(): Promise<Record<number, string>> {
  if (cachedItems && cachedItems.expires > Date.now()) return cachedItems.map;
  const version = await getLatestVersion();
  const res = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/item.json`, {
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!res.ok) return {};
  const json = await res.json();
  const map: Record<number, string> = {};
  for (const [id, item] of Object.entries<any>(json.data)) {
    map[Number(id)] = item.name;
  }
  cachedItems = { map, expires: Date.now() + VERSION_TTL_MS };
  return map;
}

export async function getSpellMap(): Promise<Record<number, { name: string; key: string }>> {
  if (cachedSpells && cachedSpells.expires > Date.now()) return cachedSpells.map;
  const version = await getLatestVersion();
  const res = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/summoner.json`, {
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!res.ok) return {};
  const json = await res.json();
  const map: Record<number, { name: string; key: string }> = {};
  for (const spell of Object.values<any>(json.data)) {
    map[Number(spell.key)] = { name: spell.name, key: spell.id };
  }
  cachedSpells = { map, expires: Date.now() + VERSION_TTL_MS };
  return map;
}


export async function getChampionIdMap(): Promise<Record<string, string>> {
  if (cachedChampions && cachedChampions.expires > Date.now()) {
    return cachedChampions.map;
  }
  const version = await getLatestVersion();
  const res = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/champion.json`, {
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!res.ok) return {};
  const json = await res.json();
  const map: Record<string, string> = {};
  for (const champ of Object.values<any>(json.data)) {
    map[champ.key] = champ.id;
  }
  cachedChampions = { map, expires: Date.now() + VERSION_TTL_MS };
  return map;
}

export function championSquareUrl(championId: string, version: string) {
  return `${DDRAGON}/cdn/${version}/img/champion/${championId}.png`;
}

export function championSplashUrl(championId: string) {
  return `${DDRAGON}/cdn/img/champion/splash/${championId}_0.jpg`;
}

export function championLoadingUrl(championId: string) {
  return `${DDRAGON}/cdn/img/champion/loading/${championId}_0.jpg`;
}

export function itemIconUrl(itemId: number, version: string) {
  if (!itemId) return null;
  return `${DDRAGON}/cdn/${version}/img/item/${itemId}.png`;
}

export function summonerSpellIconUrl(spellId: number, version: string) {
  const map: Record<number, string> = {
    1: "SummonerBoost",
    3: "SummonerExhaust",
    4: "SummonerFlash",
    6: "SummonerHaste",
    7: "SummonerHeal",
    11: "SummonerSmite",
    12: "SummonerTeleport",
    13: "SummonerMana",
    14: "SummonerDot",
    21: "SummonerBarrier",
    32: "SummonerSnowball",
  };
  const id = map[spellId] ?? "SummonerFlash";
  return `${DDRAGON}/cdn/${version}/img/spell/${id}.png`;
}

export function profileIconUrl(iconId: number, version: string) {
  return `${DDRAGON}/cdn/${version}/img/profileicon/${iconId}.png`;
}

// Community Dragon for rank emblems (Riot doesn't host them on ddragon)
export function rankEmblemUrl(tier: string) {
  const t = tier.toLowerCase();
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${t}.svg`;
}
