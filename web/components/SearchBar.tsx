"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SUPPORTED_PLATFORMS, PLATFORM_LABELS } from "@/lib/regions";
import { useRecentSearches } from "@/store/useRecentSearches";

export function SearchBar({
  size = "lg",
  helperText,
}: {
  size?: "lg" | "sm";
  helperText?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("na1");
  const [error, setError] = useState<string | null>(null);
  const add = useRecentSearches((s) => s.add);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = query.trim();
    if (!trimmed.includes("#")) {
      setError("Use Riot ID format: GameName#TAG");
      return;
    }
    const [name, tag] = trimmed.split("#");
    if (!name || !tag) {
      setError("Use Riot ID format: GameName#TAG");
      return;
    }
    add({ platform, gameName: name, tagLine: tag });
    router.push(
      `/summoner/${platform}/${encodeURIComponent(name)}-${encodeURIComponent(tag)}`
    );
  };

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div
        className={`flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/80 p-2 backdrop-blur ${
          size === "lg" ? "shadow-xl shadow-black/30" : ""
        } sm:flex-row`}
      >
        <label htmlFor="lol-platform" className="sr-only">
          Region
        </label>
        <select
          id="lol-platform"
          name="platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="h-11 rounded-md bg-secondary/60 border border-border/60 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {SUPPORTED_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <label htmlFor="lol-riot-id" className="sr-only">
            Riot ID
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="lol-riot-id"
            name="riotId"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="GameName#TAG"
            className="pl-9"
          />
        </div>
        <Button type="submit" size="lg" className="px-6">
          Search
        </Button>
      </div>
      {helperText && !error && (
        <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>
      )}
      {error && <p className="mt-2 text-sm text-loss">{error}</p>}
    </form>
  );
}
