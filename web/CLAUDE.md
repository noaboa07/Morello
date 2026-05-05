# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

All commands run from `web/`:

```bash
npm run dev        # dev server at localhost:3000
npm run build      # production build
npm run lint       # ESLint via next lint
npm run typecheck  # tsc --noEmit — run after every change, this is the correctness gate
```

No test suite. Type-check is the only automated verification.

---

## Project Scope

Morello is a **coaching-first** League of Legends platform. The goal is not a stat dump — every surface should produce an actionable answer: what went wrong, what held up, and what to fix. The coaching angle is the product differentiator; analytics cards should use coaching language, not spreadsheet language.

---

## Critical Invariants

### Riot ID encoding
User types `GameName#TAG`. URL slug is `GameName-TAG` (pound → hyphen). The summoner page reverses this with `decoded.lastIndexOf("-")` to split name from tag — `lastIndexOf` because game names can contain hyphens, tags never do.

### Platform vs regional routing
Riot has two distinct endpoint clusters — mixing them causes silent 404s:
- **Platform** (`na1`, `euw1`, `kr`, …) — summoner data, ranked entries, match details
- **Regional** (`americas`, `europe`, `asia`, `sea`) — account lookup by Riot ID, match IDs

`lib/regions.ts` exports `regionalFor(platform)`. All wrappers in `lib/riot.ts` use this internally. Any new Riot API wrapper must call the right cluster.

### No new API calls for analytics
All analytics derive from `MatchDTO[]` already fetched in SSR. Do not add Riot API calls to analytics paths — this would break the synchronous coaching signal requirement and add latency.

### Coaching strings must be deterministic
`getMatchAnalysis()` and `deriveScoutingReport()` produce coaching copy from stat thresholds. They must remain pure/synchronous — no LLM calls, no async, no probabilities. This keeps them usable in SSR and `useMemo`.

---

## Analytics API (`lib/match-insights.ts`)

All functions are pure: `(matches: MatchDTO[], puuid: string) → result`. They read from already-fetched data only.

### Exported types

```ts
QueueFilterKey = "all" | "ranked-solo" | "ranked-flex" | "aram" | "normal"
QUEUE_FILTER_OPTIONS  // { key: QueueFilterKey, label: string }[]

ChampionPoolEntry     // { championName, games, wins, averageKda }
SessionInsights       // { games, wins, losses, winRate, averageKda, averageCs,
                      //   averageCsPerMinute, streakType, streakCount,
                      //   bestChampion, championPool, statusLabel }
MatchupInsight        // { championName, games, wins, winRate, averageKda }
RoleInsight           // { role, games, wins, winRate, averageKda, averageCsPerMinute, topChampion }
WinLossMetric         // { label, winValue, lossValue, emphasis? }
WinLossComparison     // { metrics: WinLossMetric[] }
GameLengthBucket      // { key: "short"|"medium"|"long", label, games, winRate, averageKda, topChampion }
ChampionTrend         // { championName, games, winRate, averageKda, direction: "up"|"down"|"flat", label }
ProfileOverviewSummary // { recentWinRate, averageKda, bestChampion, strongestQueue, strongestRole, summaryLine }
```

### Exported functions

```ts
getMyParticipant(match, puuid)            → MatchParticipant | null
matchesQueueFilter(match, filter)         → boolean  (420=ranked-solo, 440=flex, 450=ARAM, 400/430=normal)
queueFilterSummary(filter)                → string
buildChampionPool(matches, puuid)         → ChampionPoolEntry[]  (sorted by games desc)

deriveSessionInsights(matches, puuid)     → SessionInsights
deriveScoutingReport(matches, puuid)      → string[]  (up to 5 coaching observations)
deriveWinLossComparison(matches, puuid)   → WinLossComparison  (KDA, deaths, CS/min, KP, damage, vision, game length, objectives)
deriveGameLengthBuckets(matches, puuid)   → GameLengthBucket[]  (<25m short, 25–35m medium, >35m long)
deriveChampionTrends(matches, puuid)      → ChampionTrend[]  (min 2 games per champ, top 4 by volume)
deriveMatchupInsights(matches, puuid)     → { best: MatchupInsight[], worst: MatchupInsight[], fallbackUsed: boolean }
deriveRoleInsights(matches, puuid)        → RoleInsight[]  (min 2 games per role, sorted by volume)
deriveCompareSummary(matches, puuid)      → { recentWinRate, averageKda, topChampions, recentQueues }
deriveProfileOverview(matches, puuid)     → ProfileOverviewSummary  (used in SSR for profile header)
```

`deriveMatchupInsights` uses `findRelevantOpponent()` internally: exact lane match → same normalized role → highest-damage enemy (fallback). `fallbackUsed: true` when the fallback fires.

---

## Performance Signals (`lib/badges.ts`)

Two distinct systems — don't conflate them:

**`getMatchBadges(match, me) → Badge[]`**
Visual labels with Tailwind classes: PENTAKILL, QUADRAKILL, TRIPLE KILL, MVP, CARRY, DOMINANT, SNOWBALL, TEAM ANCHOR, SURVIVOR, CLUTCH, VISION LEADER, OBJECTIVE THREAT. Thresholds are relative to the player's team (damage share, KP, CS share, vision rank).

**`getMatchAnalysis(match, me) → MatchAnalysis`**
```ts
interface MatchAnalysis {
  category: "strong" | "mixed" | "weak"
  hurt: string[]      // 1–3 items — what probably cost performance
  solid: string[]     // 1–3 items — what held up
  coaching: string    // single most actionable note
}
```
Category logic: `"weak"` if `hurt.length >= 2` OR `(hurt.length >= 1 AND deaths >= 7)`. `"strong"` if `hurt.length === 0 AND solid.length >= 1`. Otherwise `"mixed"`.

`MatchReason` type is `@deprecated` — use `MatchAnalysis` / `getMatchAnalysis` instead.

---

## SSR Data Loading (`app/summoner/[platform]/[riotId]/page.tsx`)

```
1. Promise.all([loadProfile(platform, riotId), getLatestVersion()])
   loadProfile:
     → getAccountByRiotId(name, tag, platform)   [regional endpoint]
     → Promise.all([getSummonerByPuuid(), getRankedEntriesByPuuid()])

2. On profile success:
   Promise.all([getMatchIds(puuid, platform, 20), getSpellMap(), getItemMap(), loadLiveGameSummary()])

3. Promise.all(matchIds.map(id => getMatch(id, platform)))   [20 parallel fetches]

4. deriveProfileOverview(matches, puuid)   [synchronous, SSR]
```

Error handling: 404 → `notFound()`, 429 → rate-limit message, 500+ → unavailable message, all via `RiotError` from `lib/riot.ts`.

---

## `MatchHistory` Component (`app/summoner/[platform]/[riotId]/MatchHistory.tsx`)

Client component ("use client"). Owns all filter state and analytics derivations.

**State:**
```ts
selectedChampion: string | null    // champion name filter
queueFilter: QueueFilterKey        // "all" | "ranked-solo" | ...
loadedMatches: MatchDTO[]          // grows on pagination (starts at SSR 20)
nextStart: number                  // pagination cursor
hasMore: boolean
loadingMore: boolean
loadError: string | null
deferredMatches = useDeferredValue(loadedMatches)   // decouples analytics from filter lag
```

**`visibleMatches`** = `deferredMatches` filtered by `puuid ∈ participants`, `selectedChampion`, and `queueFilter`.

**Analytics `useMemo` calls** (all on `visibleMatches`):
`deriveSessionInsights`, `deriveMatchupInsights`, `deriveRoleInsights`, `deriveScoutingReport`, `deriveWinLossComparison`, `deriveGameLengthBuckets`, `deriveChampionTrends`

**Layout:**
```
FormStrip           ← session aggregate (W/L, KDA, CS/min, streak, statusLabel)
FilterRow           ← queue tabs + active filter chips
  [match list col]    KdaSparkline → MatchCard list → Load More
  [sidebar col]       ChampionStats → RolePerformanceCard → GameLengthPerformanceCard
[Analysis section]  WinLossAnalysisCard, ChampionMatchupInsightsCard,
                    ChampionMasteryTrendCard, RecentChampionPoolCard, ScoutingReportCard
[Tools section]     CompareSummonersCard, ShareProfileSnapshotCard
```

Pagination: `GET /api/matches/[platform]/[puuid]?start=N&count=20` — deduplicates by `matchId` before appending. `ChampionStats` sidebar receives `loadedMatches` (all loaded, not just visible) filtered by queue, so champion pick counts don't shrink when filtering by champion.

---

## `MatchCard` Component (`components/MatchCard.tsx`)

`MatchCard` is a self-contained client component with a single `open: boolean` state. The expand/collapse animation uses CSS grid rows (`grid-rows-[0fr]` → `grid-rows-[1fr]`) — not conditional rendering — so the expanded content is always in the DOM.

**Props:** `{ match: MatchDTO, puuid, version, spellMap, itemMap }`

**Summary row** (always visible): game metadata + badges, champion portrait + summoner spells, KDA/CS/damage stats, items grid (item0–item5) + trinket (item6 — rendered as a circle, not square), expand chevron.

**Expanded panel** (`.border-t bg-[hsl(var(--surface))]`):
1. `CoachingPanel` — renders `getMatchAnalysis()` result: "What hurt" list (`analysis.hurt`), "What held up" list (`analysis.solid`), single "Focus:" coaching note (`analysis.coaching`). Hidden if both lists are empty.
2. Two `TeamPanel`s side-by-side — each team's 5 players with champion icon, spells, name, damage bar, KDA, CS. Damage bar width is from `damageShareForTeam()` (exported from `lib/badges.ts`), which returns a scale function `(participant) → number` representing relative damage % within the full lobby.

The current player (`puuid` match) is highlighted with `bg-primary/10 ring-1 ring-primary/30` in `TeamPanel`.

**For Tab 3 (Item Build):** items are the `item0`–`item5` array on `MatchParticipant`. No timeline data is available without a separate Riot endpoint call — Sprint 2 uses the final items only.

**For Tab 5 (Metrics):** fields available on `MatchParticipant` without extra fetches: `totalDamageDealtToChampions`, `totalDamageTaken`, `totalHeal`, `totalDamageShieldedOnTeammates`, `timeCCingOthers`, `turretKills`, `visionScore`, `wardsKilled`, `wardsPlaced`, `damageDealtToObjectives`.

---

## `ChampionMatchupInsightsCard` (`components/ChampionMatchupInsightsCard.tsx`)

Receives `{ best: MatchupInsight[], worst: MatchupInsight[], fallbackUsed: boolean }` directly from `deriveMatchupInsights`. Renders two columns: "Best into" and "Watch outs".

**Known dedup issue (Sprint 2 Task 4):** `best` and `worst` arrays can share the same champion. The fix belongs in `deriveMatchupInsights` in `lib/match-insights.ts` — after sorting, remove any champion from the weaker-signal list if it appears in both. Signal strength = `|winRate - 50|` (distance from 50%). The component itself needs no changes.

---

## Tier List (`app/tierlist/`)

Route added in Sprint 1. Data source: Meraki Analytics CDN (no API key).

**Important:** `https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/championrates.json` only returns `playRate` per role — no win rate or ban rate. Tier buckets are pick-rate based (≥4% = S, ≥2% = A, ≥1% = B, ≥0.4% = C, <0.4% = D). Meraki role names map: `MIDDLE→MID`, `UTILITY→SUPPORT`, `BOTTOM→BOT`.

Champion keys in Meraki data are **numeric strings** matching ddragon's `champ.key` field (not `champ.id`). `getChampionIdMap()` from `lib/ddragon.ts` maps `champKey → championId` (the string used in DDragon asset URLs).

`app/api/tierlist/route.ts` — `next: { revalidate: 3600 }`, returns `TierListPayload` from `lib/types.ts`.
`components/TierListClient.tsx` — role filter pills + champion search + S/A/B/C/D tier sections.

---

## DDragon

`lib/ddragon.ts` has in-process module-level cache (12h TTL) layered on top of `next: { revalidate }`. Call `getLatestVersion()` once per request and pass `version` as a prop — never inside loops or per-component.

Asset URL builders are pure functions: `championSquareUrl(championId, version)`, `championSplashUrl(championId)`, `itemIconUrl(itemId, version)`, `summonerSpellIconUrl(spellId, version)`, `profileIconUrl(iconId, version)`, `rankEmblemUrl(tier)` (Community Dragon).

`next.config.js` `remotePatterns` whitelists: `ddragon.leagueoflegends.com`, `raw.communitydragon.org`, `static.bigbrain.gg`. Adding a new image host requires adding it here.

---

## Client State (`store/useRecentSearches.ts`)

Zustand store with `persist` middleware → localStorage key `"morello-recents"`.

```ts
interface RecentSearch { platform, gameName, tagLine, searchedAt }

recents: RecentSearch[]     // last 8, FIFO, deduped by name+tag (case-insensitive)
favorites: RecentSearch[]   // up to 8, toggled
add(s)                      // bumps to front if exists, trims to 8
remove(gameName, tagLine)
toggleFavorite(s)
clear()
```

---

## Design Tokens

CSS variables in `globals.css` drive all color. Never use hardcoded hex — always use Tailwind classes backed by these tokens:

```
--primary          magenta/pink accent
--win              green (victories)
--loss             red (defeats)
--surface          nested card bg (darker than --card)
--muted-foreground mid-gray labels
--border           subtle dividers
```

Utility classes: `.eyebrow` (section labels — `text-[10px] font-semibold uppercase tracking-[0.18em]`), `.surface` (inset area bg), `.skeleton` (shimmer animation).

Win/loss coloring pattern: `text-win`, `text-loss`, `border-win/30`, `bg-loss/10` — the `/opacity` modifier is used heavily for subtle tints.
