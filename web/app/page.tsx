import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Radio, SearchCheck, Sparkles, Swords, TrendingUp } from "lucide-react";
import { RecentSearches } from "@/components/RecentSearches";
import { SearchBar } from "@/components/SearchBar";

const EXAMPLE_SEARCHES = [
  { label: "Faker", value: "Faker#KR1", platform: "kr" },
  { label: "Doublelift", value: "Doublelift#NA1", platform: "na1" },
  { label: "Caps", value: "Caps#EUW", platform: "euw1" },
];

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search any Riot ID to explore live games, recent match insights, ranked performance, and polished League of Legends scouting tools.",
};

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 pt-6 sm:pt-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/60 px-5 py-8 shadow-[0_0_40px_-24px] shadow-primary/50 sm:px-8 sm:py-10 lg:px-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.08),_transparent_45%)]" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Portfolio-ready League analytics
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Search a summoner. Tell a story with the data.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                LoL.tracker turns Riot match data into a polished scouting experience with
                live game detection, explainable match cards, champion trends, and
                recruiter-friendly presentation.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/35 p-3 sm:p-4">
              <SearchBar helperText="Enter a Riot ID in the format GameName#TAG and choose the player region." />
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-[0.18em] text-foreground/80">
                  Try:
                </span>
                {EXAMPLE_SEARCHES.map((example) => (
                  <Link
                    key={example.value}
                    href={`/summoner/${example.platform}/${encodeURIComponent(example.value.split("#")[0])}-${encodeURIComponent(example.value.split("#")[1])}`}
                    className="rounded-full border border-border/60 bg-card/70 px-3 py-1.5 transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {example.value}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Feature
              icon={<SearchCheck className="h-5 w-5" />}
              title="Search-first UX"
              desc="Jump from Riot ID to a polished profile with favorites, recents, and quick compare entry points."
            />
            <Feature
              icon={<TrendingUp className="h-5 w-5" />}
              title="Explainable insights"
              desc="Recent form, champion pool, role splits, matchup tendencies, and per-game reasons all stay readable at a glance."
            />
            <Feature
              icon={<Radio className="h-5 w-5" />}
              title="Live-ready demos"
              desc="Live game polling, graceful fallbacks, and screenshot-friendly summary cards make the app easy to present."
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[1.5rem] border border-border/60 bg-card/50 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Swords className="h-4 w-4 text-primary" />
            What you can show in a demo
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Highlight
              title="Summoner overview"
              desc="Rank, recent win rate, average KDA, strongest queue, and best champion in one screenshot-worthy hero card."
            />
            <Highlight
              title="Deep match review"
              desc="Expanded match cards explain what went well or badly with team breakdowns, badges, and visual damage context."
            />
            <Highlight
              title="Scouting layers"
              desc="Session insights, matchup analysis, role performance, champion mastery trends, and win/loss comparisons."
            />
            <Highlight
              title="Comparison flow"
              desc="Side-by-side compare mode for rank, recent form, top champions, and queue tendencies."
            />
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border/60 bg-card/50 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Recent profiles</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Favorites and recents stay one click away so the first-use and repeat-use flow both feel smooth.
              </div>
            </div>
            <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </div>
          <div className="mt-5">
            <RecentSearches />
            <EmptyDiscoveryHint />
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/35 p-5 transition-colors hover:border-primary/40">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <div className="mt-3 text-base font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}

function Highlight({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}

function EmptyDiscoveryHint() {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-background/20 p-4 text-sm text-muted-foreground">
      Search a Riot ID like <span className="font-medium text-foreground">GameName#TAG</span> to
      start building recent searches and favorite profiles here.
    </div>
  );
}
