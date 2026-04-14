"use client";

import Link from "next/link";
import { Clock, Pin, Scale, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRecentSearches } from "@/store/useRecentSearches";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS } from "@/lib/regions";

type SearchIdentity = { platform: string; gameName: string; tagLine: string };

export function RecentSearches({
  compareBasePath,
  currentProfile,
}: {
  compareBasePath?: string;
  currentProfile?: SearchIdentity;
}) {
  const recents = useRecentSearches((s) => s.recents);
  const favorites = useRecentSearches((s) => s.favorites);
  const remove = useRecentSearches((s) => s.remove);
  const toggleFavorite = useRecentSearches((s) => s.toggleFavorite);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || (recents.length === 0 && favorites.length === 0)) return null;

  const favoriteKeys = new Set(
    favorites.map(
      (favorite) =>
        `${favorite.platform}-${favorite.gameName.toLowerCase()}-${favorite.tagLine.toLowerCase()}`
    )
  );

  return (
    <div className="mt-6">
      {favorites.length > 0 && (
        <Section
          title="Favorites"
          icon={<Pin className="h-3.5 w-3.5" />}
          items={favorites}
          favoriteKeys={favoriteKeys}
          remove={remove}
          toggleFavorite={toggleFavorite}
          compareBasePath={compareBasePath}
          currentProfile={currentProfile}
        />
      )}
      {recents.length > 0 && (
        <Section
          title="Recent Searches"
          icon={<Clock className="h-3.5 w-3.5" />}
          items={recents}
          favoriteKeys={favoriteKeys}
          remove={remove}
          toggleFavorite={toggleFavorite}
          compareBasePath={compareBasePath}
          currentProfile={currentProfile}
        />
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  items,
  favoriteKeys,
  remove,
  toggleFavorite,
  compareBasePath,
  currentProfile,
}: {
  title: string;
  icon: React.ReactNode;
  items: SearchIdentity[];
  favoriteKeys: Set<string>;
  remove: (gameName: string, tagLine: string) => void;
  toggleFavorite: (s: SearchIdentity) => void;
  compareBasePath?: string;
  currentProfile?: SearchIdentity;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-3">
        {icon}
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((r) => {
          const key = `${r.platform}-${r.gameName.toLowerCase()}-${r.tagLine.toLowerCase()}`;
          const isFavorite = favoriteKeys.has(key);
          const canCompare =
            Boolean(compareBasePath) &&
            (!currentProfile ||
              currentProfile.platform.toLowerCase() !== r.platform.toLowerCase() ||
              currentProfile.gameName.toLowerCase() !== r.gameName.toLowerCase() ||
              currentProfile.tagLine.toLowerCase() !== r.tagLine.toLowerCase());

          return (
            <div
              key={`${r.platform}-${r.gameName}-${r.tagLine}`}
              className="group flex items-center gap-2 rounded-2xl border border-border/60 bg-card/70 pl-3 pr-1.5 py-1.5 text-sm shadow-[0_0_18px_-16px] shadow-black/80 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:bg-card"
            >
              <Link
                href={`/summoner/${r.platform}/${encodeURIComponent(r.gameName)}-${encodeURIComponent(r.tagLine)}`}
                className="flex items-center gap-2"
              >
                <span className="rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {PLATFORM_LABELS[r.platform] ?? r.platform.toUpperCase()}
                </span>
                <span className="font-medium">{r.gameName}</span>
                <span className="text-muted-foreground">#{r.tagLine}</span>
              </Link>
              {canCompare && compareBasePath && (
                <Link
                  href={`${compareBasePath}?comparePlatform=${encodeURIComponent(r.platform)}&compareRiotId=${encodeURIComponent(`${r.gameName}#${r.tagLine}`)}#compare`}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Compare ${r.gameName}#${r.tagLine}`}
                  title="Compare"
                >
                  <Scale className="h-3.5 w-3.5" />
                </Link>
              )}
              <button
                onClick={() => toggleFavorite(r)}
                className={cn(
                  "rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  isFavorite && "text-primary"
                )}
                aria-label={isFavorite ? "Unfavorite" : "Favorite"}
                title={isFavorite ? "Unfavorite" : "Favorite"}
              >
                <Pin className={`h-3 w-3 ${isFavorite ? "fill-current text-primary" : ""}`} />
              </button>
              <button
                onClick={() => remove(r.gameName, r.tagLine)}
                className="rounded-full p-1.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-secondary focus-visible:opacity-100"
                aria-label="Remove"
                title="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
