export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface SummonerDTO {
  id?: string;
  accountId?: string;
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface RankedEntry {
  queueType: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR" | string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
}

export interface ProfilePayload {
  account: RiotAccount;
  summoner: SummonerDTO;
  ranked: RankedEntry[];
  platform: string;
}

export interface LiveGameSummary {
  gameMode: string;
  gameLength: number;
  championName: string | null;
  gameStartTime?: number;
}

export interface MatchParticipant {
  puuid: string;
  riotIdGameName?: string;
  summonerName: string;
  championName: string;
  championId: number;
  teamId: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  goldEarned: number;
  champLevel: number;
  summoner1Id: number;
  summoner2Id: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken?: number;
  totalHeal?: number;
  totalDamageShieldedOnTeammates?: number;
  timeCCingOthers?: number;
  damageDealtToObjectives?: number;
  turretKills?: number;
  inhibitorKills?: number;
  wardsPlaced?: number;
  wardsKilled?: number;
  firstBloodKill?: boolean;
  firstBloodAssist?: boolean;
  teamPosition: string;
  largestMultiKill: number;
}

export type TierLabel = "S" | "A" | "B" | "C" | "D";

export interface ChampionTierEntry {
  championId: string;
  role: string;
  tier: TierLabel;
  winRate: number;
  pickRate: number;
  banRate: number;
  games: number;
}

export interface TierListPayload {
  patch: string;
  version: string;
  entries: ChampionTierEntry[];
}

export interface MatchDTO {
  metadata: { matchId: string; participants: string[] };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    queueId: number;
    participants: MatchParticipant[];
  };
}
