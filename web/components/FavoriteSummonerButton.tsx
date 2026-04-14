"use client";

import { Pin } from "lucide-react";
import { useMemo } from "react";
import { useRecentSearches } from "@/store/useRecentSearches";
import { cn } from "@/lib/utils";

export function FavoriteSummonerButton({
  platform,
  gameName,
  tagLine,
}: {
  platform: string;
  gameName: string;
  tagLine: string;
}) {
  const favorites = useRecentSearches((state) => state.favorites);
  const toggleFavorite = useRecentSearches((state) => state.toggleFavorite);

  const isFavorite = useMemo(
    () =>
      favorites.some(
        (favorite) =>
          favorite.platform.toLowerCase() === platform.toLowerCase() &&
          favorite.gameName.toLowerCase() === gameName.toLowerCase() &&
          favorite.tagLine.toLowerCase() === tagLine.toLowerCase()
      ),
    [favorites, gameName, platform, tagLine]
  );

  return (
    <button
      onClick={() => toggleFavorite({ platform, gameName, tagLine })}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isFavorite
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
      )}
      aria-label={isFavorite ? "Unpin summoner" : "Pin summoner"}
    >
      <Pin className={cn("h-4 w-4", isFavorite && "fill-current")} />
      {isFavorite ? "Pinned" : "Pin"}
    </button>
  );
}
