import { regionalFor } from "./regions";

export class RiotError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getApiKey(): string {
  const raw = process.env.RIOT_API_KEY;
  const key = raw?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (!key) {
    throw new RiotError(
      500,
      "RIOT_API_KEY is not configured on the server. Add it to web/.env.local and restart the dev server."
    );
  }
  return key;
}

function logRiot(level: "warn" | "error", message: string) {
  if (process.env.NODE_ENV === "production" && level === "warn") {
    console.warn(message);
    return;
  }

  if (level === "error") {
    console.error(message);
  } else if (process.env.NODE_ENV !== "production") {
    console.warn(message);
  }
}

async function riotFetch(url: string, revalidate = 60) {
  const key = getApiKey();
  const res = await fetch(url, {
    headers: { "X-Riot-Token": key },
    next: { revalidate },
  });

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "";
    }

    if (res.status >= 500 && body) {
      logRiot("warn", `[riot] upstream ${res.status} on ${new URL(url).pathname}`);
    }

    if (res.status === 404) throw new RiotError(404, "Summoner not found.");
    if (res.status === 429) {
      throw new RiotError(429, "Riot API rate limit hit. Try again in a moment.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new RiotError(res.status, "Invalid or expired Riot API key.");
    }
    throw new RiotError(res.status, `Riot API error (${res.status}).`);
  }

  try {
    return await res.json();
  } catch (error) {
    logRiot(
      "error",
      `[riot] invalid JSON response from ${new URL(url).pathname}: ${
        error instanceof Error ? error.message : "unknown parse error"
      }`
    );
    throw new RiotError(502, "Riot API returned malformed JSON.");
  }
}

export async function getAccountByRiotId(name: string, tag: string, platform: string) {
  const regional = regionalFor(platform);
  return riotFetch(
    `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
      name
    )}/${encodeURIComponent(tag)}`,
    300
  );
}

export async function getSummonerByPuuid(puuid: string, platform: string) {
  return riotFetch(
    `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    300
  );
}

export async function getRankedEntriesByPuuid(puuid: string, platform: string) {
  return riotFetch(
    `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
    120
  );
}

export async function getMatchIds(
  puuid: string,
  platform: string,
  count = 10,
  start = 0
) {
  const regional = regionalFor(platform);
  return riotFetch(
    `https://${regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`,
    60
  );
}

export async function getMatch(matchId: string, platform: string) {
  const regional = regionalFor(platform);
  return riotFetch(
    `https://${regional}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
    60 * 60 * 24
  );
}

export async function getActiveGame(encryptedSummonerId: string, platform: string) {
  if (!encryptedSummonerId) {
    logRiot("warn", "[riot] spectator skipped: missing encrypted summoner id");
    return null;
  }

  try {
    return await riotFetch(
      `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encryptedSummonerId}`,
      30
    );
  } catch (e) {
    if (e instanceof RiotError && [404, 502, 503, 504].includes(e.status)) {
      logRiot(
        "warn",
        `[riot] spectator unavailable for ${platform}: ${e.message}`
      );
      return null;
    }
    throw e;
  }
}
