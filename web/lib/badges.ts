import type { MatchDTO, MatchParticipant } from "./types";

export type Badge = {
  label: string;
  className: string;
};

/** @deprecated Use MatchAnalysis / getMatchAnalysis instead */
export type MatchReason = {
  tone: "good" | "bad";
  text: string;
};

/**
 * Structured per-match coaching analysis.
 * All signals are derived from available data only — no inferred claims.
 */
export interface MatchAnalysis {
  /** Overall game rating */
  category: "strong" | "mixed" | "weak";
  /** What probably cost the game (1–3 items, honest about team vs individual) */
  hurt: string[];
  /** What held up even in a bad game, or what drove a good one (1–3 items) */
  solid: string[];
  /** Single most actionable coaching note */
  coaching: string;
}

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
      className: "bg-amber-400/15 text-amber-200 border-amber-400/40",
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
      label: "OBJ FOCUSED",
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
      label: "VISION",
      className: "bg-teal-500/15 text-teal-200 border-teal-400/40",
    });
  }

  return dedupeBadges(badges).slice(0, 3);
}

export function computeCarryScore(match: MatchDTO, p: MatchParticipant): number {
  const all = match.info.participants;
  const maxDamage = Math.max(...all.map((x) => x.totalDamageDealtToChampions ?? 0), 1);
  const maxGold = Math.max(...all.map((x) => x.goldEarned ?? 0), 1);
  const maxCs = Math.max(
    ...all.map((x) => x.totalMinionsKilled + (x.neutralMinionsKilled ?? 0)),
    1
  );
  const maxVision = Math.max(...all.map((x) => x.visionScore ?? 0), 1);
  const kdaOf = (x: MatchParticipant) =>
    x.deaths === 0 ? x.kills + x.assists : (x.kills + x.assists) / x.deaths;
  const maxKda = Math.max(...all.map(kdaOf), 1);

  const damage = ((p.totalDamageDealtToChampions ?? 0) / maxDamage) * 30;
  const gold = ((p.goldEarned ?? 0) / maxGold) * 20;
  const kda = (kdaOf(p) / maxKda) * 25;
  const cs = ((p.totalMinionsKilled + (p.neutralMinionsKilled ?? 0)) / maxCs) * 15;
  const vision = ((p.visionScore ?? 0) / maxVision) * 10;

  return Math.round(damage + gold + kda + cs + vision);
}

export function getGrade(
  score: number,
  isTopInGame: boolean
): "S" | "GM" | "M" | "C" | null {
  if (score >= 85 && isTopInGame) return "S";
  if (score >= 85) return "GM";
  if (score >= 70) return "M";
  if (score >= 50) return "C";
  return null;
}

export function damageShareForTeam(participants: MatchParticipant[]) {
  const max = Math.max(
    ...participants.map((p) => p.totalDamageDealtToChampions ?? 0),
    1
  );
  return (p: MatchParticipant) =>
    Math.round(((p.totalDamageDealtToChampions ?? 0) / max) * 100);
}

/**
 * Richer, structured match analysis.
 *
 * Design principles:
 * - Role-aware: CS benchmarks differ for carries vs support; vision expectations differ.
 * - Mode-aware: skip farm/position checks for ARAM.
 * - Honest about team vs individual: if individual stats are solid but the team lost, say so.
 * - Deterministic: every output is derived from measured stats, no invented claims.
 * - Conservative: when data is insufficient, stay silent rather than hallucinate patterns.
 */
export function getMatchAnalysis(match: MatchDTO, me: MatchParticipant): MatchAnalysis {
  const team = match.info.participants.filter((p) => p.teamId === me.teamId);
  const gameMins = Math.max(match.info.gameDuration / 60, 1);

  const teamKills = team.reduce((s, p) => s + p.kills, 0);
  const teamDamage = team.reduce((s, p) => s + (p.totalDamageDealtToChampions ?? 0), 0);
  const teamVision = team.reduce((s, p) => s + (p.visionScore ?? 0), 0);

  const cs = me.totalMinionsKilled + (me.neutralMinionsKilled ?? 0);
  const cspm = cs / gameMins;
  const kp = teamKills > 0 ? (me.kills + me.assists) / teamKills : 0;
  const dmgShare = teamDamage > 0 ? (me.totalDamageDealtToChampions ?? 0) / teamDamage : 0;
  const visionShare = teamVision > 0 ? (me.visionScore ?? 0) / teamVision : 0;
  const objScore =
    (me.damageDealtToObjectives ?? 0) +
    (me.turretKills ?? 0) * 1000 +
    (me.inhibitorKills ?? 0) * 2000;
  const kda =
    me.deaths === 0 ? me.kills + me.assists : (me.kills + me.assists) / me.deaths;

  const isAram = match.info.queueId === 450 || match.info.gameMode === "ARAM";
  const pos = (me.teamPosition ?? "").toUpperCase();
  const isCarry = ["BOTTOM", "MIDDLE", "TOP"].includes(pos);
  const isJungle = pos === "JUNGLE";
  const isSupport = pos === "UTILITY";
  const isShortGame = gameMins < 20;

  const hurt: string[] = [];
  const solid: string[] = [];

  // ── HURT signals ─────────────────────────────────────────────────────────

  // Deaths — most impactful signal; tier by severity
  if (me.deaths >= 10) {
    hurt.push(
      `${me.deaths} deaths — that many feeding opportunities rarely go unpunished`
    );
  } else if (me.deaths >= 8) {
    hurt.push(`${me.deaths} deaths disrupted your team's ability to hold any lead`);
  } else if (me.deaths >= 6) {
    hurt.push(`${me.deaths} deaths made it harder to hold momentum mid-game`);
  } else if (me.deaths >= 5 && kda < 1.5) {
    hurt.push(
      `${me.deaths} deaths at ${kda.toFixed(1)} KDA — dying without converting kept you behind`
    );
  }

  // CS / farm (skip ARAM, skip very short games)
  if (!isAram && !isShortGame) {
    if (isCarry && cspm < 5.0 && gameMins >= 22) {
      hurt.push(
        `${cspm.toFixed(1)} CS/min is below the carry-role minimum — gold income was limited`
      );
    } else if (!isSupport && cspm < 3.8 && gameMins >= 24) {
      hurt.push(`${cspm.toFixed(1)} CS/min limited your gold lead this game`);
    }
  }

  // Kill participation — only call it out when the team was active and you weren't
  if (kp < 0.30 && teamKills >= 10) {
    hurt.push(
      `${Math.round(kp * 100)}% kill participation in a ${teamKills}-kill game — you were often away from key fights`
    );
  } else if (kp < 0.40 && teamKills >= 15) {
    hurt.push(
      `${Math.round(kp * 100)}% kill participation in a high-kill game — fights were happening without you`
    );
  }

  // Vision — contextual thresholds by role
  if (!isAram && !isShortGame) {
    if (isSupport && (me.visionScore ?? 0) < 14 && gameMins >= 22) {
      hurt.push(
        `${me.visionScore} vision score as Support is low — ward coverage likely fell short`
      );
    } else if (!isSupport && (me.visionScore ?? 0) < 7 && visionShare < 0.10) {
      hurt.push(
        `Vision score of ${me.visionScore} — your team had minimal map info from you`
      );
    }
  }

  // Damage (carries only, and only when it's clearly weak, not just average)
  if (!isAram && isCarry && dmgShare < 0.14 && teamKills >= 6 && !me.win) {
    hurt.push(
      `${Math.round(dmgShare * 100)}% of team damage from a carry position is very low — damage output needs to improve`
    );
  }

  // ── SOLID signals ─────────────────────────────────────────────────────────

  // Strong survival / KDA
  if (me.deaths <= 1 && (me.kills + me.assists) >= 5) {
    solid.push(
      `Excellent survival — ${me.kills}/${me.deaths}/${me.assists} with near-zero deaths`
    );
  } else if (kda >= 4 && me.deaths <= 3) {
    solid.push(
      `Very clean ${kda.toFixed(1)} KDA — high impact with controlled deaths`
    );
  } else if (kda >= 2.5 && me.deaths <= 4 && (me.kills + me.assists) >= 8) {
    solid.push(`Solid ${kda.toFixed(1)} KDA with good kill involvement`);
  }

  // Damage output
  if (dmgShare >= 0.30) {
    solid.push(
      `Led team damage at ${Math.round(dmgShare * 100)}% of total — carried the output`
    );
  } else if (dmgShare >= 0.24 && isCarry) {
    solid.push(
      `${Math.round(dmgShare * 100)}% damage share is strong for a carry role`
    );
  }

  // Farm
  if (!isAram) {
    if (cspm >= 8.0) {
      solid.push(`Excellent farming — ${cspm.toFixed(1)} CS/min`);
    } else if (cspm >= 6.5 && isCarry) {
      solid.push(`Consistent farm rate — ${cspm.toFixed(1)} CS/min for a carry`);
    }
  }

  // Kill participation
  if (kp >= 0.72) {
    solid.push(
      `${Math.round(kp * 100)}% kill participation — you were present for nearly every fight`
    );
  } else if (kp >= 0.55 && (isSupport || isJungle)) {
    solid.push(
      `Strong kill participation (${Math.round(kp * 100)}%) — good map engagement`
    );
  }

  // Vision
  if (!isAram) {
    if ((me.visionScore ?? 0) >= 28) {
      solid.push(`High vision score (${me.visionScore}) — strong map control`);
    } else if (isSupport && (me.visionScore ?? 0) >= 22) {
      solid.push(`Good ward coverage (${me.visionScore} vision score) as Support`);
    }
  }

  // Objectives
  if (objScore >= 6000) {
    solid.push(
      "Strong objective pressure — turret and major objective contribution added real map value"
    );
  }

  // Individually fine in a team loss
  const individuallyFine =
    hurt.length === 0 && !me.win && (kda >= 2 || dmgShare >= 0.20 || kp >= 0.50);

  if (individuallyFine && solid.length === 0) {
    solid.push("Individual stats were reasonable — the loss came from team-side factors");
  }

  // ── COACHING note ────────────────────────────────────────────────────────
  // One sentence. Most actionable fix based on the primary weakness.

  let coaching = "";

  if (me.deaths >= 9) {
    coaching = isJungle
      ? "Track the enemy jungler before entering their half — reducing deaths here has the highest leverage."
      : "Safe positioning mid-game is the biggest lever. Two fewer deaths per game compounds into a noticeably better win rate.";
  } else if (me.deaths >= 6 && !me.win) {
    coaching = "You died at a pace that's hard to overcome — identify one recurring death pattern (dive, over-extension, poor recall timing) and cut it.";
  } else if (!isAram && isCarry && cspm < 5.0 && gameMins >= 22) {
    coaching = "Farm discipline between fights is the clearest skill gap — aim for 6+ CS/min by prioritizing wave state over early roams.";
  } else if (kp < 0.35 && teamKills >= 12) {
    coaching = "You were often off the map when fights broke out — track your jungler or follow up after lane trades to stay in the action.";
  } else if (!isAram && (me.visionScore ?? 0) < 8 && gameMins >= 24) {
    coaching = "Add one control ward per back and ward before objectives — the vision deficit likely created the bad situations this game.";
  } else if (!isAram && isSupport && (me.visionScore ?? 0) < 14) {
    coaching = "Vision as Support is foundational — ward on every recall and keep river/objective vision up before the timer hits.";
  } else if (individuallyFine) {
    coaching = "Individual performance looked solid. The bigger lever is converting leads into objective control earlier — prioritize Dragon and Rift timers.";
  } else if (me.win && hurt.length === 0 && solid.length >= 2) {
    coaching = "Clean game — maintain this discipline on deaths, farm, and damage output.";
  } else if (me.win && hurt.length > 0) {
    coaching = "The win is good, but there are gaps to close. Address the weak points above to play from ahead more reliably.";
  } else {
    coaching = "Limit unnecessary deaths and keep farm consistent in the mid-game — these two habits have the highest leverage.";
  }

  // ── Category ─────────────────────────────────────────────────────────────
  const category: MatchAnalysis["category"] =
    hurt.length >= 2 || (hurt.length >= 1 && me.deaths >= 7)
      ? "weak"
      : hurt.length === 0 && solid.length >= 1
        ? "strong"
        : "mixed";

  return {
    category,
    hurt: hurt.slice(0, 3),
    solid: solid.slice(0, 3),
    coaching,
  };
}

/**
 * @deprecated Use getMatchAnalysis for structured feedback.
 * Kept for any callers that haven't migrated.
 */
export function getMatchPerformanceReasons(
  match: MatchDTO,
  me: MatchParticipant
): MatchReason[] {
  const analysis = getMatchAnalysis(match, me);
  const reasons: MatchReason[] = [
    ...analysis.solid.map((text) => ({ tone: "good" as const, text })),
    ...analysis.hurt.map((text) => ({ tone: "bad" as const, text })),
  ];
  return reasons.slice(0, 4);
}

function dedupeBadges(badges: Badge[]) {
  const seen = new Set<string>();
  return badges.filter((badge) => {
    if (seen.has(badge.label)) return false;
    seen.add(badge.label);
    return true;
  });
}
