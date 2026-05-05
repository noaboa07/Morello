import { queueName } from "./queues";
import type { MatchDTO, MatchParticipant } from "./types";

export type QueueFilterKey =
  | "all"
  | "ranked-solo"
  | "ranked-flex"
  | "aram"
  | "normal";

export const QUEUE_FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "ranked-solo", label: "Ranked Solo/Duo" },
  { key: "ranked-flex", label: "Ranked Flex" },
  { key: "aram", label: "ARAM" },
  { key: "normal", label: "Normal" },
] as const satisfies Array<{ key: QueueFilterKey; label: string }>;

export interface ChampionPoolEntry {
  championName: string;
  games: number;
  wins: number;
  averageKda: number;
}

export interface SessionInsights {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  averageKda: number;
  averageCs: number;
  averageCsPerMinute: number;
  streakType: "win" | "loss" | null;
  streakCount: number;
  bestChampion: ChampionPoolEntry | null;
  championPool: ChampionPoolEntry[];
  statusLabel: string;
}

export interface MatchupInsight {
  championName: string;
  games: number;
  wins: number;
  winRate: number;
  averageKda: number;
}

export interface RoleInsight {
  role: string;
  games: number;
  wins: number;
  winRate: number;
  averageKda: number;
  averageCsPerMinute: number;
  topChampion: string | null;
}

export interface WinLossMetric {
  label: string;
  winValue: string;
  lossValue: string;
  emphasis?: string;
}

export interface WinLossComparison {
  metrics: WinLossMetric[];
}

export interface GameLengthBucket {
  key: "short" | "medium" | "long";
  label: string;
  games: number;
  winRate: number;
  averageKda: number;
  topChampion: string | null;
}

export interface ChampionTrend {
  championName: string;
  games: number;
  winRate: number;
  averageKda: number;
  direction: "up" | "down" | "flat";
  label: string;
}

export interface ProfileOverviewSummary {
  recentWinRate: number;
  averageKda: number;
  bestChampion: ChampionPoolEntry | null;
  strongestQueue: string | null;
  strongestRole: string | null;
  summaryLine: string;
}

export function getMyParticipant(match: MatchDTO, puuid: string): MatchParticipant | null {
  return match.info.participants.find((participant) => participant.puuid === puuid) ?? null;
}

export function matchesQueueFilter(match: MatchDTO, filter: QueueFilterKey) {
  if (filter === "all") return true;
  switch (filter) {
    case "ranked-solo":
      return match.info.queueId === 420;
    case "ranked-flex":
      return match.info.queueId === 440;
    case "aram":
      return match.info.queueId === 450 || match.info.gameMode === "ARAM";
    case "normal":
      return match.info.queueId === 400 || match.info.queueId === 430;
    default:
      return true;
  }
}

export function queueFilterSummary(filter: QueueFilterKey) {
  return QUEUE_FILTER_OPTIONS.find((option) => option.key === filter)?.label ?? queueName(0);
}

export function buildChampionPool(matches: MatchDTO[], puuid: string): ChampionPoolEntry[] {
  const championMap = new Map<
    string,
    { games: number; wins: number; kills: number; deaths: number; assists: number }
  >();

  for (const match of matches) {
    const me = getMyParticipant(match, puuid);
    if (!me) continue;
    const current = championMap.get(me.championName) ?? {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    };
    current.games += 1;
    current.wins += me.win ? 1 : 0;
    current.kills += me.kills;
    current.deaths += me.deaths;
    current.assists += me.assists;
    championMap.set(me.championName, current);
  }

  return Array.from(championMap.entries())
    .map(([championName, stats]) => ({
      championName,
      games: stats.games,
      wins: stats.wins,
      averageKda:
        stats.deaths === 0
          ? stats.kills + stats.assists
          : (stats.kills + stats.assists) / stats.deaths,
    }))
    .sort((a, b) => {
      if (b.games !== a.games) return b.games - a.games;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.averageKda - a.averageKda;
    });
}

export function deriveSessionInsights(matches: MatchDTO[], puuid: string): SessionInsights {
  const participants = getVisibleParticipants(matches, puuid);
  if (participants.length === 0) {
    return {
      games: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageKda: 0,
      averageCs: 0,
      averageCsPerMinute: 0,
      streakType: null,
      streakCount: 0,
      bestChampion: null,
      championPool: [],
      statusLabel: "No recent games",
    };
  }

  const wins = participants.filter((participant) => participant.win).length;
  const losses = participants.length - wins;
  const totalKillsAssists = participants.reduce(
    (sum, participant) => sum + participant.kills + participant.assists,
    0
  );
  const totalDeaths = participants.reduce((sum, participant) => sum + participant.deaths, 0);
  const totalCs = matches.reduce((sum, match) => {
    const me = getMyParticipant(match, puuid);
    return me ? sum + totalCsForParticipant(me) : sum;
  }, 0);
  const totalMinutes = matches.reduce((sum, match) => sum + match.info.gameDuration / 60, 0);

  const firstOutcome = participants[0]?.win ?? null;
  let streakCount = 0;
  for (const participant of participants) {
    if (participant.win === firstOutcome) streakCount += 1;
    else break;
  }

  const championPool = buildChampionPool(matches, puuid);
  const averageKda =
    totalDeaths === 0 ? totalKillsAssists : totalKillsAssists / Math.max(totalDeaths, 1);

  return {
    games: participants.length,
    wins,
    losses,
    winRate: Math.round((wins / participants.length) * 100),
    averageKda,
    averageCs: totalCs / participants.length,
    averageCsPerMinute: totalMinutes > 0 ? totalCs / totalMinutes : 0,
    streakType: firstOutcome === null ? null : firstOutcome ? "win" : "loss",
    streakCount,
    bestChampion: championPool[0] ?? null,
    championPool,
    statusLabel: deriveStatusLabel({
      winRate: Math.round((wins / participants.length) * 100),
      averageKda,
      streakType: firstOutcome ? "win" : "loss",
      streakCount,
    }),
  };
}

export function deriveScoutingReport(matches: MatchDTO[], puuid: string) {
  const participants = getVisibleParticipants(matches, puuid);
  if (participants.length === 0) return [];

  const insights: string[] = [];
  const championPool = buildChampionPool(matches, puuid);
  const wins = matches.filter((match) => getMyParticipant(match, puuid)?.win);
  const losses = matches.filter((match) => !getMyParticipant(match, puuid)?.win);

  const comfortShare =
    championPool.slice(0, 3).reduce((sum, champion) => sum + champion.games, 0) /
    participants.length;
  const averageDamage =
    participants.reduce(
      (sum, participant) => sum + (participant.totalDamageDealtToChampions ?? 0),
      0
    ) / participants.length;
  const averageDeaths =
    participants.reduce((sum, participant) => sum + participant.deaths, 0) / participants.length;

  if (comfortShare >= 0.7) insights.push("Relies heavily on 2-3 comfort champions.");
  if (averageDamage >= 22000 && averageDeaths >= 6) {
    insights.push("High-damage, high-death playstyle.");
  } else if (averageDamage >= 22000) {
    insights.push("Consistently outputs high champion damage.");
  }

  const longGames = matches.filter((match) => match.info.gameDuration > 35 * 60);
  const shortGames = matches.filter((match) => match.info.gameDuration < 25 * 60);
  if (longGames.length >= 2 && shortGames.length >= 2) {
    const longWinRate = Math.round(
      (longGames.filter((match) => getMyParticipant(match, puuid)?.win).length / longGames.length) *
        100
    );
    const shortWinRate = Math.round(
      (shortGames.filter((match) => getMyParticipant(match, puuid)?.win).length /
        shortGames.length) *
        100
    );
    if (longWinRate - shortWinRate >= 15) insights.push("More successful in longer games.");
  }

  const queueStats = buildQueueStats(matches, puuid);
  if (queueStats[0]) insights.push(`Performs best in ${queueStats[0].label}.`);

  if (wins.length > 0 && losses.length > 0) {
    const winCs = averageOfMatches(wins, puuid, (participant) => totalCsForParticipant(participant));
    const lossCs = averageOfMatches(losses, puuid, (participant) => totalCsForParticipant(participant));
    const winVision = averageOfMatches(wins, puuid, (participant) => participant.visionScore ?? 0);
    const lossVision = averageOfMatches(losses, puuid, (participant) => participant.visionScore ?? 0);
    if (winCs - lossCs >= 20) insights.push("Strong farming shows up more clearly in wins.");
    if (winVision - lossVision >= 4) insights.push("Vision drops off noticeably in losses.");
  }

  const roleCounts = new Map<string, number>();
  for (const participant of participants) {
    const role = normalizeRole(participant.teamPosition);
    if (!role) continue;
    roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
  }
  const topRole = Array.from(roleCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topRole && topRole[1] >= Math.max(3, Math.floor(participants.length / 2))) {
    insights.push(`Most recent games are concentrated in ${topRole[0]}.`);
  }

  return insights.slice(0, 5);
}

export function deriveWinLossComparison(matches: MatchDTO[], puuid: string): WinLossComparison {
  const wins = matches.filter((match) => getMyParticipant(match, puuid)?.win);
  const losses = matches.filter((match) => !getMyParticipant(match, puuid)?.win);
  if (wins.length === 0 || losses.length === 0) return { metrics: [] };

  const metrics: WinLossMetric[] = [];
  const addMetric = (label: string, winValue: string, lossValue: string, emphasis?: string) => {
    if (winValue === lossValue) return;
    metrics.push({ label, winValue, lossValue, emphasis });
  };

  const winKda = averageOfMatches(wins, puuid, (participant) =>
    ratio(participant.kills + participant.assists, participant.deaths)
  );
  const lossKda = averageOfMatches(losses, puuid, (participant) =>
    ratio(participant.kills + participant.assists, participant.deaths)
  );
  addMetric("KDA", winKda.toFixed(2), lossKda.toFixed(2), Math.abs(winKda - lossKda) >= 0.75 ? "One of the clearest separators." : undefined);

  const winDeaths = averageOfMatches(wins, puuid, (participant) => participant.deaths);
  const lossDeaths = averageOfMatches(losses, puuid, (participant) => participant.deaths);
  addMetric("Deaths", winDeaths.toFixed(1), lossDeaths.toFixed(1));

  const winCs = averageOfMatches(wins, puuid, (participant, match) => totalCsForParticipant(participant) / Math.max(match.info.gameDuration / 60, 1));
  const lossCs = averageOfMatches(losses, puuid, (participant, match) => totalCsForParticipant(participant) / Math.max(match.info.gameDuration / 60, 1));
  addMetric("CS/min", winCs.toFixed(1), lossCs.toFixed(1));

  const winKp = averageOfMatches(wins, puuid, (participant, match) => killParticipation(match, participant));
  const lossKp = averageOfMatches(losses, puuid, (participant, match) => killParticipation(match, participant));
  addMetric("Kill participation", `${Math.round(winKp * 100)}%`, `${Math.round(lossKp * 100)}%`);

  const winDamage = averageOfMatches(wins, puuid, (participant) => participant.totalDamageDealtToChampions ?? 0);
  const lossDamage = averageOfMatches(losses, puuid, (participant) => participant.totalDamageDealtToChampions ?? 0);
  addMetric("Damage dealt", `${Math.round(winDamage / 1000)}k`, `${Math.round(lossDamage / 1000)}k`);

  const winVision = averageOfMatches(wins, puuid, (participant) => participant.visionScore ?? 0);
  const lossVision = averageOfMatches(losses, puuid, (participant) => participant.visionScore ?? 0);
  addMetric("Vision score", winVision.toFixed(1), lossVision.toFixed(1));

  const winLength = averageMatchDuration(wins);
  const lossLength = averageMatchDuration(losses);
  addMetric("Game length", `${Math.round(winLength)}m`, `${Math.round(lossLength)}m`);

  const winObjective = averageOfMatches(
    wins,
    puuid,
    (participant) =>
      (participant.damageDealtToObjectives ?? 0) +
      (participant.turretKills ?? 0) * 1000 +
      (participant.inhibitorKills ?? 0) * 2000
  );
  const lossObjective = averageOfMatches(
    losses,
    puuid,
    (participant) =>
      (participant.damageDealtToObjectives ?? 0) +
      (participant.turretKills ?? 0) * 1000 +
      (participant.inhibitorKills ?? 0) * 2000
  );
  if (winObjective > 0 || lossObjective > 0) {
    addMetric("Objective contribution", `${Math.round(winObjective / 1000)}k`, `${Math.round(lossObjective / 1000)}k`);
  }

  return { metrics: metrics.slice(0, 6) };
}

export function deriveGameLengthBuckets(matches: MatchDTO[], puuid: string): GameLengthBucket[] {
  const bucketConfig = [
    { key: "short" as const, label: "Short Games", test: (duration: number) => duration < 25 * 60 },
    {
      key: "medium" as const,
      label: "Medium Games",
      test: (duration: number) => duration >= 25 * 60 && duration <= 35 * 60,
    },
    { key: "long" as const, label: "Long Games", test: (duration: number) => duration > 35 * 60 },
  ];

  const results = bucketConfig.map((bucket): GameLengthBucket | null => {
      const bucketMatches = matches.filter((match) => bucket.test(match.info.gameDuration));
      if (bucketMatches.length === 0) return null;
      const championPool = buildChampionPool(bucketMatches, puuid);
      return {
        key: bucket.key,
        label: bucket.label,
        games: bucketMatches.length,
        winRate: Math.round(
          (bucketMatches.filter((match) => getMyParticipant(match, puuid)?.win).length / bucketMatches.length) *
            100
        ),
        averageKda: averageOfMatches(bucketMatches, puuid, (participant) =>
          ratio(participant.kills + participant.assists, participant.deaths)
        ),
        topChampion: championPool[0]?.championName ?? null,
      };
    });

  return results.filter((bucket): bucket is GameLengthBucket => bucket !== null);
}

export function deriveChampionTrends(matches: MatchDTO[], puuid: string): ChampionTrend[] {
  const championGroups = new Map<string, MatchDTO[]>();
  for (const match of matches) {
    const me = getMyParticipant(match, puuid);
    if (!me) continue;
    championGroups.set(me.championName, [...(championGroups.get(me.championName) ?? []), match]);
  }

  return Array.from(championGroups.entries())
    .filter(([, championMatches]) => championMatches.length >= 2)
    .map(([championName, championMatches]) => {
      const recent = championMatches.slice(0, Math.min(3, championMatches.length));
      const earlier = championMatches.slice(Math.min(3, championMatches.length));
      const recentScore = averageOfMatches(recent, puuid, (participant) =>
        ratio(participant.kills + participant.assists, participant.deaths)
      );
      const earlierScore =
        earlier.length > 0
          ? averageOfMatches(earlier, puuid, (participant) =>
              ratio(participant.kills + participant.assists, participant.deaths)
            )
          : recentScore;
      const delta = recentScore - earlierScore;
      const direction: ChampionTrend["direction"] =
        delta > 0.5 ? "up" : delta < -0.5 ? "down" : "flat";

      return {
        championName,
        games: championMatches.length,
        winRate: Math.round(
          (championMatches.filter((match) => getMyParticipant(match, puuid)?.win).length / championMatches.length) *
            100
        ),
        averageKda: averageOfMatches(championMatches, puuid, (participant) =>
          ratio(participant.kills + participant.assists, participant.deaths)
        ),
        direction,
        label: delta > 0.5 ? "Improving" : delta < -0.5 ? "Cooling off" : "Stable",
      };
    })
    .sort((a, b) => b.games - a.games)
    .slice(0, 4);
}

export function deriveMatchupInsights(matches: MatchDTO[], puuid: string) {
  const matchupMap = new Map<string, { games: number; wins: number; kills: number; deaths: number; assists: number }>();
  for (const match of matches) {
    const me = getMyParticipant(match, puuid);
    if (!me) continue;
    const enemy = findRelevantOpponent(match, me);
    if (!enemy) continue;
    const current = matchupMap.get(enemy.championName) ?? {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    };
    current.games += 1;
    current.wins += me.win ? 1 : 0;
    current.kills += me.kills;
    current.deaths += me.deaths;
    current.assists += me.assists;
    matchupMap.set(enemy.championName, current);
  }

  const repeatedEntries = Array.from(matchupMap.entries())
    .map(([championName, stats]) => ({
      championName,
      games: stats.games,
      wins: stats.wins,
      winRate: Math.round((stats.wins / stats.games) * 100),
      averageKda:
        stats.deaths === 0
          ? stats.kills + stats.assists
          : (stats.kills + stats.assists) / stats.deaths,
    }))
    .filter((entry) => entry.games >= 2);

  const best = repeatedEntries
    .slice()
    .sort((a, b) => (b.winRate !== a.winRate ? b.winRate - a.winRate : b.averageKda - a.averageKda))
    .slice(0, 3);
  const worst = repeatedEntries
    .slice()
    .sort((a, b) => (a.winRate !== b.winRate ? a.winRate - b.winRate : a.averageKda - b.averageKda))
    .slice(0, 3);

  // For any champion appearing in both lists, keep it only in the list
  // with the stronger signal (distance from 50% win rate). Ties go to best.
  const signal = (e: MatchupInsight) => Math.abs(e.winRate - 50);
  const sharedChamps = new Set(
    best
      .filter((b) => worst.some((w) => w.championName === b.championName))
      .map((b) => b.championName)
  );
  const bestDeduped = best.filter((b) => {
    if (!sharedChamps.has(b.championName)) return true;
    const inWorst = worst.find((w) => w.championName === b.championName)!;
    return signal(b) >= signal(inWorst);
  });
  const worstDeduped = worst.filter((w) => {
    if (!sharedChamps.has(w.championName)) return true;
    const inBest = best.find((b) => b.championName === w.championName)!;
    return signal(w) > signal(inBest);
  });

  return {
    best: bestDeduped,
    worst: worstDeduped,
    fallbackUsed: matches.some((match) => {
      const me = getMyParticipant(match, puuid);
      return me ? !hasReliableLaneOpponent(match, me) : false;
    }),
  };
}

export function deriveRoleInsights(matches: MatchDTO[], puuid: string): RoleInsight[] {
  const roleMap = new Map<
    string,
    {
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
      cs: number;
      minutes: number;
      champions: Map<string, number>;
    }
  >();

  for (const match of matches) {
    const me = getMyParticipant(match, puuid);
    if (!me) continue;
    const role = normalizeRole(me.teamPosition);
    if (!role) continue;
    const current = roleMap.get(role) ?? {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      cs: 0,
      minutes: 0,
      champions: new Map<string, number>(),
    };
    current.games += 1;
    current.wins += me.win ? 1 : 0;
    current.kills += me.kills;
    current.deaths += me.deaths;
    current.assists += me.assists;
    current.cs += totalCsForParticipant(me);
    current.minutes += match.info.gameDuration / 60;
    current.champions.set(me.championName, (current.champions.get(me.championName) ?? 0) + 1);
    roleMap.set(role, current);
  }

  return Array.from(roleMap.entries())
    .map(([role, stats]) => ({
      role,
      games: stats.games,
      wins: stats.wins,
      winRate: Math.round((stats.wins / stats.games) * 100),
      averageKda:
        stats.deaths === 0
          ? stats.kills + stats.assists
          : (stats.kills + stats.assists) / stats.deaths,
      averageCsPerMinute: stats.minutes > 0 ? stats.cs / stats.minutes : 0,
      topChampion:
        Array.from(stats.champions.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    }))
    .filter((entry) => entry.games >= 2)
    .sort((a, b) => b.games - a.games);
}

export function deriveCompareSummary(matches: MatchDTO[], puuid: string) {
  const insights = deriveSessionInsights(matches, puuid);
  return {
    recentWinRate: insights.winRate,
    averageKda: insights.averageKda,
    topChampions: insights.championPool.slice(0, 3),
    recentQueues: buildQueueStats(matches, puuid).slice(0, 3).map((queue) => queue.label),
  };
}

export function deriveProfileOverview(
  matches: MatchDTO[],
  puuid: string
): ProfileOverviewSummary {
  const session = deriveSessionInsights(matches, puuid);
  const queueStats = buildQueueStats(matches, puuid);
  const roleStats = deriveRoleInsights(matches, puuid);

  const strongestQueue = queueStats[0]?.label ?? null;
  const strongestRole = roleStats[0]?.role ?? null;
  const bestChampion = session.bestChampion;

  let summaryLine = "Recent sample is still taking shape.";
  if (bestChampion && session.winRate >= 55) {
    summaryLine = `Consistent recent form with strong results on ${bestChampion.championName}.`;
  } else if (strongestQueue && session.games >= 8) {
    summaryLine = `High-volume recent grind with the best results in ${strongestQueue}.`;
  } else if (strongestRole && session.averageKda >= 3.5) {
    summaryLine = `Best recent performances are coming through ${strongestRole}.`;
  } else if (session.averageKda >= 4) {
    summaryLine = "Recent games show efficient teamfight impact and strong uptime.";
  }

  return {
    recentWinRate: session.winRate,
    averageKda: session.averageKda,
    bestChampion,
    strongestQueue,
    strongestRole,
    summaryLine,
  };
}

// ── High-elo coaching analytics ───────────────────────────────────────────────

export interface DeathReviewSummary {
  totalDeaths: number;
  avgDeathsPerGame: number;
  peakPhase: "early" | "mid" | "late";
  peakPhaseLabel: string;
  patternLine: string;
}

export interface ConsistencyScore {
  score: number;
  interpretation: string;
  kdaVariance: number;
  csVariance: number;
  visionVariance: number;
}

export interface WinCondition {
  condition: string;
  winPct: number;
  sampleSize: number;
}

export interface WinConditionFingerprint {
  conditions: WinCondition[];
}

export function deriveDeathReview(matches: MatchDTO[], puuid: string): DeathReviewSummary | null {
  const participants = getVisibleParticipants(matches, puuid);
  if (participants.length === 0) return null;

  const totalDeaths = participants.reduce((s, p) => s + p.deaths, 0);
  const avgDeathsPerGame = totalDeaths / participants.length;

  // Infer peak death phase by comparing deaths-per-game across game-length buckets.
  // Short games (<25 min) skew toward early-phase deaths; long games (>35 min) toward late.
  const short = matches.filter((m) => m.info.gameDuration < 25 * 60);
  const medium = matches.filter(
    (m) => m.info.gameDuration >= 25 * 60 && m.info.gameDuration <= 35 * 60
  );
  const long = matches.filter((m) => m.info.gameDuration > 35 * 60);

  const dpg = (bucket: MatchDTO[]) => {
    if (bucket.length === 0) return 0;
    const d = bucket.reduce((s, m) => {
      const p = getMyParticipant(m, puuid);
      return s + (p?.deaths ?? 0);
    }, 0);
    return d / bucket.length;
  };

  const allPhases: Array<{ key: "early" | "mid" | "late"; label: string; dpg: number }> = [
    { key: "early" as const, label: "early game (<25 min)", dpg: dpg(short) },
    { key: "mid" as const, label: "mid game (25–35 min)", dpg: dpg(medium) },
    { key: "late" as const, label: "late game (>35 min)", dpg: dpg(long) },
  ];
  const phases = allPhases.filter((p) => p.dpg > 0);

  const peak = phases.length > 0
    ? phases.reduce((a, b) => (b.dpg > a.dpg ? b : a))
    : { key: "mid" as const, label: "mid game" };

  let patternLine = `Average ${avgDeathsPerGame.toFixed(1)} deaths per game`;
  if (avgDeathsPerGame > 5) {
    patternLine += ` — prioritise safer positioning in ${peak.label}.`;
  } else if (avgDeathsPerGame > 3) {
    patternLine += ` — death count is manageable; focus on ${peak.label} decision-making.`;
  } else {
    patternLine += ` — strong death avoidance; maintain discipline in ${peak.label}.`;
  }

  return { totalDeaths, avgDeathsPerGame, peakPhase: peak.key, peakPhaseLabel: peak.label, patternLine };
}

export function deriveConsistencyScore(matches: MatchDTO[], puuid: string): ConsistencyScore | null {
  if (matches.length < 5) return null;

  const values = matches
    .map((m) => {
      const p = getMyParticipant(m, puuid);
      if (!p) return null;
      const gameMins = m.info.gameDuration / 60;
      const cs = totalCsForParticipant(p);
      return {
        kda: ratio(p.kills + p.assists, p.deaths),
        csPerMin: gameMins > 0 ? cs / gameMins : 0,
        vision: p.visionScore,
      };
    })
    .filter((v): v is { kda: number; csPerMin: number; vision: number } => v !== null);

  if (values.length < 3) return null;

  const cv = (arr: number[]) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    if (mean === 0) return 0;
    const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance) / mean;
  };

  const kdaCV = cv(values.map((v) => v.kda));
  const csCV = cv(values.map((v) => v.csPerMin));
  const visionCV = cv(values.map((v) => v.vision));
  const avgCV = (kdaCV + csCV + visionCV) / 3;
  const score = Math.max(0, Math.min(100, Math.round(100 - avgCV * 100)));

  let interpretation: string;
  if (score >= 70) {
    interpretation = "Consistent foundation — game-to-game variance is low. Focus on raising your ceiling.";
  } else if (score >= 45) {
    interpretation = "Moderate consistency — some variance across games. Stabilising one metric could unlock a higher floor.";
  } else {
    interpretation = "Streaky player — big highs and big lows. Narrowing variance will improve your average result.";
  }

  return { score, interpretation, kdaVariance: kdaCV, csVariance: csCV, visionVariance: visionCV };
}

export function deriveWinConditionFingerprint(
  matches: MatchDTO[],
  puuid: string
): WinConditionFingerprint | null {
  if (matches.length < 5) return null;

  type Condition = { label: string; test: (p: MatchParticipant, m: MatchDTO) => boolean };
  const gameMins = (m: MatchDTO) => m.info.gameDuration / 60;

  const candidates: Condition[] = [
    { label: "KDA > 3.0", test: (p) => ratio(p.kills + p.assists, p.deaths) > 3 },
    { label: "KDA > 2.0", test: (p) => ratio(p.kills + p.assists, p.deaths) > 2 },
    { label: "Fewer than 3 deaths", test: (p) => p.deaths < 3 },
    { label: "Fewer than 5 deaths", test: (p) => p.deaths < 5 },
    {
      label: "CS/min above 6",
      test: (p, m) => gameMins(m) > 0 && totalCsForParticipant(p) / gameMins(m) > 6,
    },
    {
      label: "CS/min above 7",
      test: (p, m) => gameMins(m) > 0 && totalCsForParticipant(p) / gameMins(m) > 7,
    },
    {
      label: "Kill participation above 60%",
      test: (p, m) => killParticipation(m, p) > 0.6,
    },
    {
      label: "Vision score above 20",
      test: (p) => p.visionScore > 20,
    },
  ];

  const conditions: WinCondition[] = candidates
    .map(({ label, test }) => {
      const subset = matches.filter((m) => {
        const p = getMyParticipant(m, puuid);
        return p ? test(p, m) : false;
      });
      if (subset.length < 3) return null;
      const wins = subset.filter((m) => getMyParticipant(m, puuid)?.win).length;
      const winPct = Math.round((wins / subset.length) * 100);
      if (Math.abs(winPct - 50) < 15) return null;
      return { condition: label, winPct, sampleSize: subset.length };
    })
    .filter((c): c is WinCondition => c !== null)
    .sort((a, b) => Math.abs(b.winPct - 50) - Math.abs(a.winPct - 50))
    .slice(0, 3);

  return conditions.length > 0 ? { conditions } : null;
}

function getVisibleParticipants(matches: MatchDTO[], puuid: string) {
  return matches
    .map((match) => getMyParticipant(match, puuid))
    .filter((participant): participant is MatchParticipant => Boolean(participant));
}

function averageOfMatches(
  matches: MatchDTO[],
  puuid: string,
  selector: (participant: MatchParticipant, match: MatchDTO) => number
) {
  const values = matches
    .map((match) => {
      const participant = getMyParticipant(match, puuid);
      return participant ? selector(participant, match) : null;
    })
    .filter((value): value is number => value !== null && Number.isFinite(value));
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageMatchDuration(matches: MatchDTO[]) {
  if (matches.length === 0) return 0;
  return matches.reduce((sum, match) => sum + match.info.gameDuration / 60, 0) / matches.length;
}

function totalCsForParticipant(participant: MatchParticipant) {
  return participant.totalMinionsKilled + (participant.neutralMinionsKilled ?? 0);
}

function ratio(numerator: number, denominator: number) {
  return denominator === 0 ? numerator : numerator / denominator;
}

function killParticipation(match: MatchDTO, participant: MatchParticipant) {
  const team = match.info.participants.filter((teammate) => teammate.teamId === participant.teamId);
  const teamKills = team.reduce((sum, teammate) => sum + teammate.kills, 0);
  if (teamKills === 0) return 0;
  return (participant.kills + participant.assists) / teamKills;
}

function buildQueueStats(matches: MatchDTO[], puuid: string) {
  const queueMap = new Map<string, { label: string; games: number; wins: number }>();
  for (const match of matches) {
    const participant = getMyParticipant(match, puuid);
    if (!participant) continue;
    const label = queueName(match.info.queueId);
    const current = queueMap.get(label) ?? { label, games: 0, wins: 0 };
    current.games += 1;
    current.wins += participant.win ? 1 : 0;
    queueMap.set(label, current);
  }
  return Array.from(queueMap.values())
    .filter((entry) => entry.games >= 2)
    .map((entry) => ({ ...entry, winRate: Math.round((entry.wins / entry.games) * 100) }))
    .sort((a, b) => (b.winRate !== a.winRate ? b.winRate - a.winRate : b.games - a.games));
}

function findRelevantOpponent(match: MatchDTO, me: MatchParticipant) {
  const enemies = match.info.participants.filter((participant) => participant.teamId !== me.teamId);
  if (enemies.length === 0) return null;
  const exactLane = enemies.find(
    (participant) =>
      participant.teamPosition &&
      me.teamPosition &&
      participant.teamPosition === me.teamPosition &&
      participant.teamPosition !== "UTILITY"
  );
  if (exactLane) return exactLane;

  const sameRole = enemies.find(
    (participant) =>
      normalizeRole(participant.teamPosition) &&
      normalizeRole(participant.teamPosition) === normalizeRole(me.teamPosition)
  );
  if (sameRole) return sameRole;

  return enemies.sort(
    (a, b) => (b.totalDamageDealtToChampions ?? 0) - (a.totalDamageDealtToChampions ?? 0)
  )[0];
}

function hasReliableLaneOpponent(match: MatchDTO, me: MatchParticipant) {
  const enemies = match.info.participants.filter((participant) => participant.teamId !== me.teamId);
  return enemies.some(
    (participant) =>
      participant.teamPosition &&
      me.teamPosition &&
      participant.teamPosition === me.teamPosition &&
      participant.teamPosition !== "UTILITY"
  );
}

function normalizeRole(role?: string | null) {
  if (!role || role === "Invalid" || role === "") return null;
  const map: Record<string, string> = {
    TOP: "Top",
    JUNGLE: "Jungle",
    MIDDLE: "Mid",
    MID: "Mid",
    BOTTOM: "Bot",
    ADC: "Bot",
    UTILITY: "Support",
    SUPPORT: "Support",
  };
  return map[role.toUpperCase()] ?? null;
}

function deriveStatusLabel({
  winRate,
  averageKda,
  streakType,
  streakCount,
}: {
  winRate: number;
  averageKda: number;
  streakType: "win" | "loss";
  streakCount: number;
}) {
  if (streakType === "win" && streakCount >= 3 && winRate >= 60) return "Hot streak";
  if (averageKda >= 4.5 && winRate >= 55) return "Consistent carry";
  if (streakType === "loss" && streakCount >= 3 && winRate < 45) return "Rough patch";
  if (winRate >= 55 || averageKda >= 3.5) return "Strong recent form";
  return "Finding rhythm";
}
