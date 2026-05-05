import Link from "next/link";
import type { Metadata } from "next";
import { RecentSearches } from "@/components/RecentSearches";
import { SearchBar } from "@/components/SearchBar";
import { fetchChallengerFeed } from "@/lib/challenger";
import { formatDuration } from "@/lib/utils";
import type { ChallengerLiveGame } from "@/lib/types";

const EXAMPLE_SEARCHES = [
  { label: "Hide on bush", value: "Hide on bush#KR1", platform: "kr" },
  { label: "Caedrel",      value: "Caedrel#EUW",      platform: "euw1" },
  { label: "CoreJJ",       value: "CoreJJ#NA1",        platform: "na1" },
];

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search any Riot ID to explore live games, recent match insights, ranked performance, and League of Legends scouting tools.",
};

export default async function HomePage() {
  const liveGames = await fetchChallengerFeed();

  return (
    <div className="mx-auto max-w-2xl space-y-14 pt-12 sm:pt-20">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="eyebrow">League of Legends · Coaching & Improvement</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Understand your losses. Fix your mistakes. Climb faster.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Get a coaching breakdown of every game you play — see what went wrong,
            what held up, and exactly what to work on next.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <SearchBar helperText="Search your Riot ID to get a personalized coaching breakdown of your recent games." />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="eyebrow">Learn from the pros</span>
            {EXAMPLE_SEARCHES.map((ex) => (
              <Link
                key={ex.value}
                href={`/summoner/${ex.platform}/${encodeURIComponent(
                  ex.value.split("#")[0]
                )}-${encodeURIComponent(ex.value.split("#")[1])}`}
                className="rounded-md border border-border/60 px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                {ex.value}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent profiles ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="eyebrow">Recent profiles</div>
        <RecentSearches />
        <p className="text-xs text-muted-foreground">
          Favorites and recents show up here once you search a Riot ID.
        </p>
      </section>

      {/* ── Live Challenger Games ────────────────────────────────────────── */}
      {liveGames.length > 0 && (
        <section className="space-y-3">
          <div className="eyebrow">Live Challenger Games</div>
          <div className="space-y-2">
            {liveGames.map((game, i) => (
              <ChallengerGameCard key={i} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* ── What the app surfaces ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="eyebrow">What you'll learn</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="text-sm font-semibold">{f.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground leading-snug">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ChallengerGameCard({ game }: { game: ChallengerLiveGame }) {
  const href = `/summoner/${game.platform}/${encodeURIComponent(game.gameName ?? game.summonerName)}-${encodeURIComponent(game.tagLine ?? "NA1")}`;
  const elapsed = formatDuration(game.gameLength);
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 hover:bg-secondary/20 transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${game.championId}.png`}
        alt="champion"
        className="h-10 w-10 rounded-full border border-border/40 object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{game.gameName ?? game.summonerName}</div>
        <div className="text-xs text-muted-foreground">{elapsed} elapsed</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-mono font-semibold text-yellow-300/80">{game.lp.toLocaleString()} LP</div>
        <div className="text-[10px] text-muted-foreground uppercase">{game.gameMode}</div>
      </div>
    </Link>
  );
}

const FEATURES = [
  {
    title: "Ranked overview",
    desc: "Your rank, LP trend, and win rate — everything you need to measure real progress.",
  },
  {
    title: "Match history",
    desc: "Per-game coaching breakdown: what hurt your performance, what held up, and what to fix next game.",
  },
  {
    title: "Champion & role analysis",
    desc: "Your champion pool, preferred roles, and matchup tendencies — find where you're leaking LP.",
  },
  {
    title: "Live game detection",
    desc: "Know when you're in a live game — mode, champion, and time elapsed, auto-refreshed every 30 seconds.",
  },
  {
    title: "Win vs loss comparison",
    desc: "Side-by-side KDA, CS, vision, and objectives — see the exact gap between your wins and losses.",
  },
  {
    title: "Compare mode",
    desc: "Stack your profile against any other summoner to benchmark rank, champion pool, and recent form.",
  },
];
