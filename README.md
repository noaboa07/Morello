# LoL.tracker

A full-stack League of Legends stats and scouting app built with Next.js 14, TypeScript, and the Riot Games API.

LoL.tracker started as a stats viewer, but I kept pushing it until it felt more like an actual product. It goes beyond just showing match data by adding live game detection, explainable performance insights, role and matchup analysis, summoner comparison, and a polished UI that is easy to demo.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?logo=tailwindcss)
![React Query](https://img.shields.io/badge/TanStack_Query-5-FF4154)
![Riot API](https://img.shields.io/badge/Riot_API-v5-D32936)

## Overview

This project was built to solve a simple problem: most League stat sites are either overloaded with clutter or just dump raw numbers on the page without much context.

I wanted to build something that still had depth, but felt cleaner, smarter, and more interactive. The result is a summoner dashboard that lets you search players, explore recent match history, filter by champion and queue, compare players, and get higher-level insights about how someone has actually been performing.

## What it does

- search Riot IDs across supported League of Legends platforms
- show summoner profile info, ranked data, LP, and live game status
- display filterable match history by champion and queue
- show a KDA trend sparkline and session insights from visible matches
- expand match cards into a full 10-player breakdown
- explain why a game went well or poorly using deterministic stat-based reasons
- generate performance badges like MVP, Carry, and more
- surface matchup insights, role/lane performance, win/loss splits, and game-length trends
- track recent champion pool and champion mastery trends
- compare two summoners side by side
- support paginated match loading for deeper recent-history analysis
- save recent searches and favorite profiles locally
- provide a clean share/export-style profile snapshot panel
- fail gracefully when live spectator data or Riot API requests are unavailable

## Why this project is interesting

This was a fun project because it was not just about wiring an API to a UI. A big part of the work was turning inconsistent third-party data into something useful and readable.

A few things I focused on:
- building around real Riot API constraints like rate limits and partial failures
- making optional live-game data fail soft instead of breaking the page
- deriving multiple analytics cards from the same visible match set so filters stay consistent
- making the experience feel polished enough for a portfolio demo, not just technically functional

## Screenshots

### Landing page
![Landing page](docs/landing.png)
*Landing page with guided Riot ID search, example lookups, and recent profile discovery.*

### Summoner overview
![Summoner overview](docs/summoner-overview.png)
*Summoner overview with rank data, recent-form hero card, compare entry, and shareable profile snapshot.*

### Compare mode
![Compare mode](docs/compare-mode.png)

*Side-by-side compare mode for recent win rate, KDA, champion pool, and queue tendencies.*

### Match history and analytics
![Match history](docs/match-history.png)
*Filterable recent match history with KDA trend, champion stats, role performance, and game-length analysis.*

### Expanded match details
![Expanded match card](docs/match-card-expanded.png)

*Expanded match view with explainable performance reasons, 10-player breakdown, and visual team comparison.*

## Live Demo

[View the app on Vercel](https://lol-tracker-pink.vercel.app/)

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 App Router |
| Language | TypeScript with strict checking |
| Styling | Tailwind CSS |
| UI primitives | shadcn/ui + Radix UI |
| Client caching | TanStack Query |
| Client persistence | Zustand + persist |
| Icons | lucide-react |
| External data | Riot API + Data Dragon |

## Architecture Overview

### App structure

```text
web/
  app/
    page.tsx                         # landing page
    layout.tsx                       # app shell + metadata
    api/                             # lightweight server routes
    summoner/[platform]/[riotId]/    # summoner experience
  components/                        # reusable UI and product surfaces
  lib/                               # Riot, Data Dragon, analytics, utilities
  store/                             # persisted recent searches / favorites
  providers/                         # React Query provider
```

### Data flow

1. The landing page captures a Riot ID in the form `GameName#TAG`.
2. The summoner route loads account, summoner, ranked, live game summary, and initial matches.
3. The match history client component handles local filters, visible-match analytics, and pagination.
4. Optional live game polling refreshes client-side without breaking the rest of the page when spectator data fails.
5. Shared analytics utilities derive the profile overview, session insights, scouting report, matchup analysis, role performance, and compare summaries from the same visible match set.

## How It Works

### Server-side

- `lib/riot.ts` wraps Riot API calls with typed errors and graceful handling for optional spectator data.
- route handlers under `web/app/api` keep client requests small and consistent.
- Data Dragon helpers resolve the latest version and static asset URLs for champions, items, and spells.

### Client-side

- `MatchHistory.tsx` is the main orchestration layer for filters, visible-match derivations, and incremental match loading.
- `RecentSearches` and favorites are stored locally for quick profile revisit.
- `CompareSummonersCard` reuses the same summary derivations for side-by-side analysis.

## Setup

### 1. Install dependencies

```bash
cd web
npm install
```

### 2. Configure environment variables

Create `web/.env.local`:

```bash
RIOT_API_KEY=your_riot_api_key_here
```

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `RIOT_API_KEY` | Yes | Riot developer API key used for account, summoner, ranked, match, and spectator requests |

## Deployment Notes

- The app assumes `RIOT_API_KEY` is available on the server at runtime.
- Spectator data is treated as optional and fails soft.
- Data quality depends on Riot API availability and rate limits.
- For production deployment, use a host that supports Next.js 14 App Router well, such as Vercel.

## Known Limitations

- Some role and matchup inference is approximate because the app does not currently use timeline data.
- Live game polling depends on spectator availability and Riot API health.
- Favorites and recent searches are browser-local, not account-synced.
- Historical insights are only as broad as the currently loaded match set.

## Future Improvements

- timeline-aware lane and objective analysis
- image-based export snapshots
- authenticated cloud-synced favorites
- patch-aware historical context and champion metadata caching

## License

MIT. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. This project is not endorsed by Riot Games.

## Contact

Noah Russell  
[LinkedIn](https://www.linkedin.com/in/noah-russell-cs/)  
[Email](mailto:noahrussell2004@gmail.com)
