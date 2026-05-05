import { getChallengerLeague, getActiveGame, RiotError } from "@/lib/riot";
import type { ChallengerLiveGame } from "@/lib/types";

const PLATFORM = "na1";

interface LeagueEntry {
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
}

interface SpectatorParticipant {
  summonerId: string;
  championId: number;
  riotId?: string;
}

export async function fetchChallengerFeed(): Promise<ChallengerLiveGame[]> {
  try {
    const league = await getChallengerLeague("RANKED_SOLO_5x5", PLATFORM);

    // Log raw response shape for Vercel diagnostics
    const rawEntries: unknown[] = league.entries ?? league.data ?? [];
    const firstRaw = rawEntries[0];
    console.log(
      "[challenger] league top-level keys:", Object.keys(league as object),
      "| entries count:", rawEntries.length,
      "| first entry keys:", firstRaw ? Object.keys(firstRaw as object) : "none",
      "| first entry sample:", JSON.stringify(firstRaw).slice(0, 300)
    );

    // summonerId in LeagueItemDTO IS the encrypted summoner ID — try multiple field names
    // in case the API response uses a different key than expected.
    const entries: LeagueEntry[] = (rawEntries as Record<string, unknown>[]).map((e) => ({
      summonerId: (e.summonerId ?? e.encryptedSummonerId ?? "") as string,
      summonerName: (e.summonerName ?? e.riotIdGameName ?? "") as string,
      leaguePoints: (e.leaguePoints ?? 0) as number,
    }));

    const top50 = [...entries]
      .sort((a, b) => b.leaguePoints - a.leaguePoints)
      .slice(0, 50);
    const candidates = [...top50].sort(() => Math.random() - 0.5).slice(0, 5);

    const liveGames: ChallengerLiveGame[] = [];

    await Promise.all(
      candidates.map(async (entry) => {
        try {
          const game = await getActiveGame(entry.summonerId, PLATFORM);
          if (!game?.gameId) return;

          const me: SpectatorParticipant | undefined = game.participants?.find(
            (p: SpectatorParticipant) => p.summonerId === entry.summonerId
          );
          if (!me) return;

          liveGames.push({
            summonerName: entry.summonerName,
            championId: me.championId,
            lp: entry.leaguePoints,
            gameLength: game.gameLength ?? 0,
            gameMode: game.gameMode ?? "CLASSIC",
            platform: PLATFORM,
            gameName: me.riotId?.split("#")[0] ?? entry.summonerName,
            tagLine: me.riotId?.split("#")[1] ?? "NA1",
          });
        } catch (e) {
          if (e instanceof RiotError && e.status === 404) return;
        }
      })
    );

    return liveGames.slice(0, 3);
  } catch {
    return [];
  }
}
