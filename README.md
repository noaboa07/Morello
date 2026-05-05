# Morello

> Understand your losses. Fix your mistakes. Climb faster.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?logo=tailwindcss)
![React Query](https://img.shields.io/badge/TanStack_Query-5-FF4154)
![Riot API](https://img.shields.io/badge/Riot_API-v5-D32936)

### Landing page
![Landing page](docs/landing.png)

### Summoner overview
![Summoner overview](docs/summoner-overview.png)

---

## Overview

Morello is a coaching-first League of Legends platform built with Next.js 14 and the Riot Games API. Search your Riot ID and get a per-game breakdown of what hurt your performance, what held up, and exactly what to work on next.

Most stat sites bury you in numbers. Morello is opinionated about what matters: not just *what* happened in a game, but *why*, and *what to do about it*. Every surface — match cards, session insights, champion analysis, win/loss comparisons — is designed to produce an actionable answer, not a spreadsheet.

---

## Features

### Landing Page
- **Live Challenger Games** — polls NA Challenger ladder on each page load, surfaces up to 3 players currently in-game with champion icon (CDragon), LP, and elapsed time; clicking navigates to their summoner profile

### Summoner Profiles
- **Search any Riot ID** across all supported League of Legends platforms (NA, EUW, KR, and more)
- **Ranked overview** — Solo/Duo and Flex rank, LP, win rate, and recent form at a glance
- **Live game detection** — surfaces mode, champion, and elapsed time when the summoner is in-game
- **Recent searches & favorites** — locally persisted profile shortcuts for fast revisit
- **Profile snapshot** — shareable, export-style summary panel
- **Compare mode** — search a second summoner and compare recent form, rank, and champion pool side by side

### Match History
- **Filterable by champion and queue** — visible match set stays consistent across every analytics card
- **KDA trend sparkline** — rolling KDA trend across the most recent matches
- **Session insights** — aggregate W/L, KDA, CS/min, streaks, and status label over the loaded match window
- **Paginated loading** — load deeper match history beyond the initial batch

### Match Cards (tabbed detail view)
Each match card expands into five lazy-loaded tabs:

| Tab | Content |
|-----|---------|
| **Post Game** | Coaching analysis + 10-player u.gg-style table: carry score, grade badge (S/GM/M/C), role pill, damage bars scaled to game max, gold, CS/min, wards, items |
| **Performance** | All 10 players in a sortable table (click any column header). Columns: kills, KDA, damage, gold, wards, CS/min. Laning Phase section shows gold and CS differential vs lane opponent at 10 and 15 minutes. Coaching callout pinned above based on player averages. |
| **Item Build** | Rune page (primary tree with all slots + selected runes, secondary tree with 2 selected runes, stat shards) fetched from DDragon on first click, followed by final build items |
| **Timeline** | Kill feed + objective/vision event log with filter pills (Kills · Objectives · Vision), plus a minimap with colour-coded event dots plotted from Riot coordinates |
| **Metrics** | Time-series line charts (Gold · XP · CS · Damage) for all 10 players via recharts; champion icon toggles show/hide individual lines; Team Gold AreaChart (5th sub-tab) shows blue/red gold lead over time; falls back to flat stat table when timeline unavailable |

### Analytics
- **Win vs loss breakdown** — side-by-side stat comparison showing how KDA, CS, vision, and objective control shift between outcomes
- **Champion matchup win rates** — deduplication enforced: a champion appears in at most one column (Best Into or Watch Outs), kept in whichever has the stronger signal (`|winRate − 50|`)
- **Role performance** — win rate, KDA, and CS/min per role (minimum 2 games)
- **Game-length buckets** — performance split across short (<25 min), medium (25–35 min), and long (>35 min) games
- **Champion mastery trends** — KDA direction (improving / cooling off / stable) per champion over visible matches
- **Champion Win Rate Trend** — per-champion stats table (top 5 by games played, min 2): games, WR%, KDA, CS/min, vision score
- **Scouting report** — deterministic coaching observations derived from match patterns
- **Performance badges** — MVP, Carry, Vision Leader, Objective Threat, and more, derived from match data relative to the full lobby

### High-Elo Coaching Widgets (≥5 matches)
- **Death Review** — phase breakdown bars (Early <20m / Mid 20–30m / Late >30m) showing percentage of deaths by game phase; peak phase and deterministic coaching callout
- **Consistency Score** — 0–100 score derived from KDA, CS/min, and vision score variance (coefficient of variation); bars show stability per metric; interpreted as consistent, moderate, or streaky
- **Win Condition Fingerprint** — identifies which stat thresholds (KDA > 3.0, deaths < 3, CS/min > 6, kill participation > 60%, etc.) correlate most strongly with wins and losses across the visible match window

### Champion Tier List
- Sourced from **Meraki Analytics CDN** — pick rate per role aggregated from recent patches; no API key required
- Tiered by pick rate: S (≥4%), A (≥2%), B (≥1%), C (≥0.4%), D (<0.4%)
- Filterable by role; champion search; sorted pick rate descending within each tier; cached 1 hour

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 14 App Router | SSR, API routes, file-based routing |
| Language | TypeScript (strict) | Strict mode throughout; `npm run typecheck` is the correctness gate |
| Styling | Tailwind CSS 3 + shadcn/ui | CSS variable–based design tokens |
| UI primitives | Radix UI | Tabs, slots — unstyled, accessible |
| Client caching | TanStack Query v5 | Query deduplication, background refresh |
| State / persistence | Zustand + persist | Recent searches and favorites in localStorage |
| Icons | lucide-react | Consistent icon set |
| Typeface | Inter (next/font/google) | Zero layout shift, variable font |
| Charts | recharts | Time-series line charts in the Metrics tab |
| Match & ranked data | Riot Games API v5 | Account lookup, summoner, ranked, match history, spectator, match timeline |
| Static assets | Data Dragon + Community Dragon | Champion icons, item icons, spell icons, rank emblems, rune icons, minimap |
| Tier list | Meraki Analytics CDN | Pick-rate per role, no API key required, 1-hour cache |

---

## Architecture

```
web/
  app/
    page.tsx                          # landing — search, examples, live challenger feed, feature overview
    layout.tsx                        # app shell, metadata, Inter font, Navbar
    globals.css                       # design tokens (CSS variables), utility classes
    api/
      profile/[platform]/[name]/[tag] # account + summoner + ranked entries
      matches/[platform]/[puuid]      # match IDs and full match detail (paginated)
      matches/[platform]/timeline      # Riot timeline endpoint proxy (per-frame gold/XP/CS/damage)
      challenger/                      # Challenger ladder live-game polling → ChallengerLiveGame[]
      live/[platform]/[puuid]         # spectator polling route
      ddragon/version/                # Data Dragon latest version resolution
      ddragon/runes/                  # runesReforged.json proxy → RuneTree[]
      tierlist/                       # Meraki Analytics → ChampionTierEntry[]
    tierlist/
      page.tsx                        # tier list SSR entry point
      loading.tsx                     # streaming skeleton
    summoner/[platform]/[riotId]/
      page.tsx                        # summoner profile (SSR entry point)
      loading.tsx                     # streaming skeleton
      not-found.tsx                   # 404 handling
      MatchHistory.tsx                # client component — filters, analytics, pagination
  components/                         # 35 product surfaces and UI primitives
  lib/
    riot.ts                           # Riot API wrapper (RiotError, platform/regional routing)
    challenger.ts                     # server-only helper — challenger ladder + live-game polling
    ddragon.ts                        # Data Dragon asset URL builders, 12-hour module cache
    match-insights.ts                 # all analytics derivations (pure functions, no async)
    badges.ts                         # getMatchBadges, getMatchAnalysis, damageShareForTeam
    types.ts                          # shared TypeScript interfaces
    regions.ts / queues.ts            # platform routing and queue ID config maps
    utils.ts                          # formatDuration, timeAgo, kdaRatio, cn
  store/
    useRecentSearches.ts              # Zustand — recent searches and favorites
  providers/
    QueryProvider.tsx                 # TanStack Query client wrapper
```

### Data flow

1. The landing page captures a Riot ID (`GameName#TAG`), resolves the platform, and navigates to the summoner route.
2. The summoner page server-renders account data, ranked stats, live game summary, and the first 20 matches in parallel. `deriveProfileOverview()` runs synchronously in SSR.
3. `MatchHistory.tsx` owns all client state — queue/champion filters, pagination, and the full `useMemo` analytics layer. All derivations run on the same `visibleMatches` slice so every card stays consistent when filters change.
4. Live game polling refreshes independently on the client and fails soft when spectator data is unavailable.
5. Match card tabs are lazy: tab content is only mounted on first click and stays in the DOM thereafter.

### Analytics API (`lib/match-insights.ts`)

All functions are pure: `(matches: MatchDTO[], puuid: string) → result`. No async, no side-effects, SSR-safe.

| Function | Returns |
|----------|---------|
| `deriveSessionInsights` | W/L, KDA, CS/min, streaks, best champion, status label |
| `deriveMatchupInsights` | Best/worst champion matchups (deduped by signal strength) |
| `deriveRoleInsights` | Per-role W/L, KDA, CS/min |
| `deriveScoutingReport` | Up to 5 coaching observations as strings |
| `deriveWinLossComparison` | Side-by-side metric diff across wins and losses |
| `deriveGameLengthBuckets` | Performance split across short / medium / long games |
| `deriveChampionTrends` | KDA direction per champion over visible matches |
| `deriveDeathReview` | Peak-death phase + per-phase % breakdown (Early/Mid/Late) + coaching callout |
| `deriveChampionDetailedPool` | Top 5 champions by games: WR%, KDA, CS/min, vision score |
| `deriveConsistencyScore` | 0–100 score from KDA / CS / vision coefficient of variation |
| `deriveWinConditionFingerprint` | Stat thresholds that correlate with wins/losses |
| `deriveProfileOverview` | SSR summary line for the profile header |

### Critical invariants

- **Platform vs regional routing** — account lookup and match IDs use the regional cluster (`americas`, `europe`, `asia`, `sea`); summoner data and match details use the platform cluster (`na1`, `euw1`, etc.). `lib/regions.ts` exports `regionalFor(platform)`. Mixing them causes silent 404s.
- **No new API calls for analytics** — all derivations are pure functions over already-fetched `MatchDTO[]`. Adding Riot calls to the analytics path would break SSR and add latency.
- **Coaching strings are deterministic** — `getMatchAnalysis()` and all `derive*` functions are synchronous and threshold-based. No LLM calls, no randomness, no async.
- **Riot ID encoding** — URL slug uses a hyphen as the name/tag separator (`GameName-TAG`). The summoner page splits on `lastIndexOf("-")` because game names can contain hyphens; tags cannot.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Riot Games developer API key](https://developer.riotgames.com/) (development keys reset every 24 hours)

### Installation

```bash
cd web
npm install
```

### Environment variables

Create `web/.env.local`:

```bash
RIOT_API_KEY=your_riot_api_key_here
```

### Running locally

```bash
npm run dev       # localhost:3000
```

Try the example summoners on the landing page — `Hide on bush#KR1` (KR), `Caedrel#EUW` (EUW), `CoreJJ#NA1` (NA) — to verify the full pipeline is working.

### Commands

```bash
npm run dev          # development server
npm run build        # production build
npm run start        # production server
npm run typecheck    # tsc --noEmit — run after every change
npm run lint         # ESLint via next lint
```

### Production deployment

Deploy to any platform with Next.js 14 App Router support. [Vercel](https://vercel.com) is the simplest option — set `RIOT_API_KEY` in project environment variables.

---

## Known Limitations

- **Item purchase order** — the timeline endpoint is integrated but the Riot API does not expose per-item timestamps at the match level; the Item Build tab shows final build only.
- **Live game polling** — depends on Riot's spectator API availability and account-level access; fails soft when unavailable.
- **Analytics scope** — all insights are scoped to the loaded match window, not a player's full history.
- **Riot API key** — development keys from Riot expire every 24 hours and have strict rate limits; production use requires a production key application.
- **Recent searches** — browser-local only, not synced across devices.

---

## Roadmap

- Patch-aware context — flag performance changes that coincide with balance patches
- Image-based profile export snapshots
- Cloud-synced favorites with optional account authentication

---

## License

MIT. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. Morello is not endorsed by or affiliated with Riot Games.

---

## Contact

Noah Russell  
[LinkedIn](https://www.linkedin.com/in/noah-russell-cs/)  
[Email](mailto:noahrusselldev@gmail.com)
