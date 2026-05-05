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
  perks?: Perks;
  teamPosition: string;
  largestMultiKill: number;
}

export interface PerkSelection {
  perk: number;
  var1: number;
  var2: number;
  var3: number;
}

export interface PerkStyle {
  description: "primaryStyle" | "subStyle" | string;
  selections: PerkSelection[];
  style: number;
}

export interface Perks {
  statPerks: { defense: number; flex: number; offense: number };
  styles: PerkStyle[];
}

export interface RuneEntry {
  id: number;
  key: string;
  icon: string;
  name: string;
  shortDesc: string;
}

export interface RuneSlot {
  runes: RuneEntry[];
}

export interface RuneTree {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: RuneSlot[];
}

export interface TimelinePosition {
  x: number;
  y: number;
}

export interface TimelineEvent {
  timestamp: number;
  type: string;
  killerId?: number;
  victimId?: number;
  assistingParticipantIds?: number[];
  position?: TimelinePosition;
  teamId?: number;
  monsterType?: string;
  monsterSubType?: string;
  buildingType?: string;
  laneType?: string;
  wardType?: string;
  creatorId?: number;
  afterId?: number;
  itemId?: number;
}

export interface TimelineParticipantFrame {
  participantId: number;
  totalGold: number;
  level: number;
  xp: number;
  minionsKilled: number;
  jungleMinionsKilled: number;
  currentGold: number;
  position?: TimelinePosition;
  damageStats?: {
    totalDamageDone: number;
    totalDamageTaken: number;
    magicDamageDone: number;
    physicalDamageDone: number;
    trueDamageDone: number;
  };
}

export interface TimelineFrame {
  timestamp: number;
  participantFrames: Record<string, TimelineParticipantFrame>;
  events: TimelineEvent[];
}

export interface MatchTimeline {
  metadata: { matchId: string };
  info: { frameInterval: number; frames: TimelineFrame[] };
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
  source: "lolalytics" | "meraki";
}

export interface ChallengerLiveGame {
  summonerName: string;
  championId: number;
  lp: number;
  gameLength: number;
  gameMode: string;
  platform: string;
  gameName?: string;
  tagLine?: string;
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
