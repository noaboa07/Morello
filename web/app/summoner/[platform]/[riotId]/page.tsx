import { notFound } from "next/navigation";
import { FavoriteSummonerButton } from "@/components/FavoriteSummonerButton";
import { ProfileOverviewHeroCard } from "@/components/ProfileOverviewHeroCard";
import { ProfileHeader } from "@/components/ProfileHeader";
import { RankCard } from "@/components/RankCard";
import { CompareSummonersCard } from "@/components/CompareSummonersCard";
import { LiveGameBanner } from "@/components/LiveGameBanner";
import { RecentSearches } from "@/components/RecentSearches";
import { SearchBar } from "@/components/SearchBar";
import { ShareProfileSnapshotCard } from "@/components/ShareProfileSnapshotCard";
import { MatchHistory } from "./MatchHistory";
import {
  getChampionIdMap,
  getItemMap,
  getLatestVersion,
  getSpellMap,
} from "@/lib/ddragon";
import {
  getAccountByRiotId,
  getActiveGame,
  getMatch,
  getMatchIds,
  getRankedEntriesByPuuid,
  getSummonerByPuuid,
  RiotError,
} from "@/lib/riot";
import { deriveProfileOverview } from "@/lib/match-insights";
import type {
  LiveGameSummary,
  MatchDTO,
  ProfilePayload,
  RankedEntry,
} from "@/lib/types";

interface PageProps {
  params: { platform: string; riotId: string };
}

const QUEUE_DESCRIPTIONS: Record<number, string> = {
  400: "Normal Draft",
  420: "Ranked Solo",
  430: "Normal Blind",
  440: "Ranked Flex",
  450: "ARAM",
  700: "Clash",
  1700: "Arena",
};

async function loadProfile(
  platform: string,
  riotId: string
): Promise<ProfilePayload | { error: string; status: number }> {
  const decoded = decodeURIComponent(riotId);
  const sep = decoded.lastIndexOf("-");
  if (sep === -1) return { error: "Invalid Riot ID", status: 400 };

  const name = decoded.slice(0, sep);
  const tag = decoded.slice(sep + 1);

  try {
    const account = await getAccountByRiotId(name, tag, platform);
    const [summoner, ranked] = await Promise.all([
      getSummonerByPuuid(account.puuid, platform),
      getRankedEntriesByPuuid(account.puuid, platform) as Promise<RankedEntry[]>,
    ]);

    return { account, summoner, ranked, platform };
  } catch (e) {
    if (e instanceof RiotError) return { error: e.message, status: e.status };
    return { error: "Unexpected error", status: 500 };
  }
}

async function loadLiveGameSummary(
  platform: string,
  puuid: string,
  encryptedSummonerId?: string
): Promise<LiveGameSummary | null> {
  if (!encryptedSummonerId) {
    console.warn(
      `[summoner-page] spectator skipped for ${platform}/${puuid}: missing summoner.id`
    );
    return null;
  }

  const game = await getActiveGame(encryptedSummonerId, platform);
  if (!game) return null;

  const championMap = await getChampionIdMap();
  const me = game.participants?.find(
    (participant: { puuid: string; championId: number }) => participant.puuid === puuid
  );
  const gameStartTime = game.gameStartTime ?? Date.now();
  const gameLength =
    game.gameLength && game.gameLength > 0
      ? game.gameLength
      : Math.max(0, Math.floor((Date.now() - gameStartTime) / 1000));

  return {
    gameMode:
      QUEUE_DESCRIPTIONS[game.gameQueueConfigId] ?? game.gameMode ?? "Custom",
    gameLength,
    championName: me ? championMap[String(me.championId)] ?? null : null,
    gameStartTime,
  };
}

export default async function SummonerPage({ params }: PageProps) {
  const platform = params.platform.toLowerCase();
  const [result, version] = await Promise.all([
    loadProfile(platform, params.riotId),
    getLatestVersion(),
  ]);

  if ("error" in result) {
    if (result.status === 404) notFound();
    const friendlyMessage =
      result.status === 429
        ? "Riot is rate limiting requests right now. Try again in a moment."
        : result.status >= 500
          ? "Riot profile data is temporarily unavailable."
          : result.error;
    return (
      <div className="max-w-2xl mx-auto">
        <SearchBar />
        <div className="mt-8 rounded-xl border border-loss/30 bg-loss/10 p-6 text-center">
          <div className="text-loss font-semibold">Couldn't load profile</div>
          <div className="text-sm text-muted-foreground mt-1">{friendlyMessage}</div>
        </div>
      </div>
    );
  }

  const solo = result.ranked.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
  const flex = result.ranked.find((entry) => entry.queueType === "RANKED_FLEX_SR");
  const puuid = result.account.puuid;

  const [matchIds, spellMap, itemMap, liveGame] = await Promise.all([
    getMatchIds(puuid, platform, 20),
    getSpellMap(),
    getItemMap(),
    loadLiveGameSummary(platform, puuid, result.summoner.id),
  ]);

  const matches = (await Promise.all(
    matchIds.map((matchId: string) => getMatch(matchId, platform))
  )) as MatchDTO[];
  const overview = deriveProfileOverview(matches, puuid);

  return (
    <div className="space-y-6">
      <SearchBar size="sm" />
      <RecentSearches
        compareBasePath={`/summoner/${platform}/${params.riotId}`}
        currentProfile={{
          platform,
          gameName: result.account.gameName,
          tagLine: result.account.tagLine,
        }}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <ProfileHeader profile={result} version={version} />
        </div>
        <FavoriteSummonerButton
          platform={platform}
          gameName={result.account.gameName}
          tagLine={result.account.tagLine}
        />
      </div>

      <ProfileOverviewHeroCard summary={overview} solo={solo} />

      <LiveGameBanner
        initialGame={liveGame}
        platform={platform}
        puuid={puuid}
        version={version}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col sm:flex-row gap-4">
          <RankCard queue="RANKED_SOLO_5x5" entry={solo} />
          <RankCard queue="RANKED_FLEX_SR" entry={flex} />
        </div>
      </div>

      <div id="compare" className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <CompareSummonersCard
          currentProfile={result}
          currentMatches={matches}
          version={version}
        />
        <ShareProfileSnapshotCard profile={result} summary={overview} />
      </div>

      <MatchHistory
        matches={matches}
        puuid={puuid}
        version={version}
        spellMap={spellMap}
        itemMap={itemMap}
        platform={platform}
      />
    </div>
  );
}
