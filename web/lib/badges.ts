import type { MatchDTO, MatchParticipant } from "./types";

export type Badge = {
  label: string;
  className: string;
};

export type MatchReason = {
  tone: "good" | "bad";
  text: string;
};

export function getMatchBadges(match: MatchDTO, me: MatchParticipant): Badge[] {
  const badges: Badge[] = [];

  if (me.largestMultiKill >= 5) {
    badges.push({
      label: "PENTAKILL",
      className:
        "bg-gradient-to-r from-fuchsia-500 to-amber-400 text-black border-amber-300/60",
    });
  } else if (me.largestMultiKill === 4) {
    badges.push({
      label: "QUADRAKILL",
      className:
        "bg-gradient-to-r from-fuchsia-500/90 to-purple-500/90 text-white border-fuchsia-300/40",
    });
  } else if (me.largestMultiKill === 3) {
    badges.push({
      label: "TRIPLE KILL",
      className: "bg-purple-500/20 text-purple-200 border-purple-400/40",
    });
  }

  const team = match.info.participants.filter((p) => p.teamId === me.teamId);
  const teamDamage = team.reduce(
    (sum, p) => sum + (p.totalDamageDealtToChampions ?? 0),
    0
  );
  const teamKills = team.reduce((sum, p) => sum + p.kills, 0);
  const teamCs = team.reduce(
    (sum, p) => sum + p.totalMinionsKilled + (p.neutralMinionsKilled ?? 0),
    0
  );
  const maxVision = Math.max(...team.map((p) => p.visionScore ?? 0), 1);
  const maxObjectives = Math.max(
    ...team.map(
      (p) =>
        (p.damageDealtToObjectives ?? 0) +
        (p.turretKills ?? 0) * 1500 +
        (p.inhibitorKills ?? 0) * 2500
    ),
    1
  );
  const damageShare = teamDamage > 0 ? me.totalDamageDealtToChampions / teamDamage : 0;
  const kp = teamKills > 0 ? (me.kills + me.assists) / teamKills : 0;
  const kda = me.deaths === 0 ? me.kills + me.assists : (me.kills + me.assists) / me.deaths;
  const csShare =
    teamCs > 0
      ? (me.totalMinionsKilled + (me.neutralMinionsKilled ?? 0)) / teamCs
      : 0;
  const objectiveScore =
    (me.damageDealtToObjectives ?? 0) +
    (me.turretKills ?? 0) * 1500 +
    (me.inhibitorKills ?? 0) * 2500;

  const topDamage =
    team
      .slice()
      .sort(
        (a, b) =>
          (b.totalDamageDealtToChampions ?? 0) - (a.totalDamageDealtToChampions ?? 0)
      )[0]?.puuid === me.puuid;

  if (me.win && topDamage && kda >= 4) {
    badges.push({
      label: "MVP",
      className:
        "bg-amber-400/20 text-amber-200 border-amber-300/50 shadow-[0_0_12px_-2px] shadow-amber-300/40",
    });
  }

  if (damageShare >= 0.32 && kda >= 3) {
    badges.push({
      label: "CARRY",
      className: "bg-orange-500/15 text-orange-200 border-orange-400/40",
    });
  }

  if (kp >= 0.72 && me.kills >= 8) {
    badges.push({
      label: "DOMINANT",
      className: "bg-red-500/15 text-red-200 border-red-400/40",
    });
  }

  if (me.kills >= 10 && kda >= 3.5) {
    badges.push({
      label: "SNOWBALL",
      className: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/40",
    });
  }

  if (kp >= 0.65 && me.assists >= me.kills) {
    badges.push({
      label: "TEAM ANCHOR",
      className: "bg-cyan-500/15 text-cyan-200 border-cyan-400/40",
    });
  }

  if (me.deaths <= 2 && (me.kills + me.assists) >= 8) {
    badges.push({
      label: "SURVIVOR",
      className: "bg-emerald-500/15 text-emerald-200 border-emerald-400/40",
    });
  }

  if (kda >= 4 && me.deaths <= 3 && damageShare >= 0.22) {
    badges.push({
      label: "EFFICIENT",
      className: "bg-sky-500/15 text-sky-200 border-sky-400/40",
    });
  }

  if (objectiveScore >= maxObjectives * 0.75 && objectiveScore > 0) {
    badges.push({
      label: "OBJECTIVE FOCUSED",
      className: "bg-indigo-500/15 text-indigo-200 border-indigo-400/40",
    });
  }

  if (csShare >= 0.27 && me.deaths <= 4) {
    badges.push({
      label: "FARMED UP",
      className: "bg-yellow-500/15 text-yellow-200 border-yellow-400/40",
    });
  }

  if (me.visionScore >= maxVision * 0.85 && me.visionScore >= 20) {
    badges.push({
      label: "VISION EDGE",
      className: "bg-teal-500/15 text-teal-200 border-teal-400/40",
    });
  }

  return dedupeBadges(badges).slice(0, 3);
}

export function damageShareForTeam(participants: MatchParticipant[]) {
  const max = Math.max(
    ...participants.map((p) => p.totalDamageDealtToChampions ?? 0),
    1
  );
  return (p: MatchParticipant) =>
    Math.round(((p.totalDamageDealtToChampions ?? 0) / max) * 100);
}

export function getMatchPerformanceReasons(
  match: MatchDTO,
  me: MatchParticipant
): MatchReason[] {
  const team = match.info.participants.filter((participant) => participant.teamId === me.teamId);
  const teamKills = team.reduce((sum, participant) => sum + participant.kills, 0);
  const teamDamage = team.reduce(
    (sum, participant) => sum + (participant.totalDamageDealtToChampions ?? 0),
    0
  );
  const teamVision = team.reduce((sum, participant) => sum + (participant.visionScore ?? 0), 0);
  const csPerMinute =
    (me.totalMinionsKilled + (me.neutralMinionsKilled ?? 0)) /
    Math.max(match.info.gameDuration / 60, 1);
  const killParticipation =
    teamKills > 0 ? (me.kills + me.assists) / teamKills : 0;
  const damageShare =
    teamDamage > 0 ? me.totalDamageDealtToChampions / teamDamage : 0;
  const visionShare = teamVision > 0 ? (me.visionScore ?? 0) / teamVision : 0;
  const objectiveScore =
    (me.damageDealtToObjectives ?? 0) +
    (me.turretKills ?? 0) * 1000 +
    (me.inhibitorKills ?? 0) * 2000;
  const kda =
    me.deaths === 0 ? me.kills + me.assists : (me.kills + me.assists) / me.deaths;

  const reasons: MatchReason[] = [];

  if (damageShare >= 0.3 && kda >= 3) {
    reasons.push({ tone: "good", text: "High damage share and strong KDA." });
  }
  if (killParticipation >= 0.65) {
    reasons.push({ tone: "good", text: "High kill participation kept you in the action." });
  }
  if (me.deaths <= 3 && (me.kills + me.assists) >= 8) {
    reasons.push({ tone: "good", text: "Low deaths helped preserve tempo." });
  }
  if (objectiveScore >= 4000) {
    reasons.push({ tone: "good", text: "Strong objective pressure added map value." });
  }
  if (csPerMinute >= 7.5) {
    reasons.push({ tone: "good", text: "Strong farming for game length." });
  }
  if (visionShare >= 0.24 && me.visionScore >= 18) {
    reasons.push({ tone: "good", text: "Solid vision contribution supported the team." });
  }

  if (me.deaths >= 7) {
    reasons.push({ tone: "bad", text: "High deaths made it harder to hold tempo." });
  }
  if (csPerMinute <= 5 && match.info.gameDuration >= 22 * 60) {
    reasons.push({ tone: "bad", text: "Low CS for game length limited scaling." });
  }
  if (killParticipation <= 0.4 && teamKills >= 10) {
    reasons.push({ tone: "bad", text: "Low kill participation reduced teamfight impact." });
  }
  if (visionShare <= 0.12 && me.visionScore <= 12) {
    reasons.push({ tone: "bad", text: "Weak vision contribution left less map control." });
  }
  if (match.info.gameDuration >= 35 * 60 && !me.win && kda < 2.5) {
    reasons.push({ tone: "bad", text: "Fell behind in a long game." });
  }

  const preferredTone: MatchReason["tone"] = me.win ? "good" : "bad";
  const filtered = reasons
    .sort((a, b) => Number(a.tone !== preferredTone) - Number(b.tone !== preferredTone))
    .filter((reason, index, list) => list.findIndex((candidate) => candidate.text === reason.text) === index);

  return filtered.slice(0, 4);
}

function dedupeBadges(badges: Badge[]) {
  const seen = new Set<string>();
  return badges.filter((badge) => {
    if (seen.has(badge.label)) return false;
    seen.add(badge.label);
    return true;
  });
}
