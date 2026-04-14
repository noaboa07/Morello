"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentSearch {
  platform: string;
  gameName: string;
  tagLine: string;
  searchedAt: number;
}

interface State {
  recents: RecentSearch[];
  favorites: RecentSearch[];
  add: (s: Omit<RecentSearch, "searchedAt">) => void;
  remove: (gameName: string, tagLine: string) => void;
  toggleFavorite: (s: Omit<RecentSearch, "searchedAt">) => void;
  clear: () => void;
}

export const useRecentSearches = create<State>()(
  persist(
    (set) => ({
      recents: [],
      favorites: [],
      add: (s) =>
        set((state) => {
          const filtered = state.recents.filter(
            (r) =>
              r.gameName.toLowerCase() !== s.gameName.toLowerCase() ||
              r.tagLine.toLowerCase() !== s.tagLine.toLowerCase()
          );
          return {
            recents: [{ ...s, searchedAt: Date.now() }, ...filtered].slice(0, 8),
          };
        }),
      remove: (gameName, tagLine) =>
        set((state) => ({
          recents: state.recents.filter(
            (r) =>
              r.gameName.toLowerCase() !== gameName.toLowerCase() ||
              r.tagLine.toLowerCase() !== tagLine.toLowerCase()
          ),
        })),
      toggleFavorite: (s) =>
        set((state) => {
          const existing = state.favorites.find(
            (favorite) =>
              favorite.platform.toLowerCase() === s.platform.toLowerCase() &&
              favorite.gameName.toLowerCase() === s.gameName.toLowerCase() &&
              favorite.tagLine.toLowerCase() === s.tagLine.toLowerCase()
          );
          if (existing) {
            return {
              favorites: state.favorites.filter((favorite) => favorite !== existing),
            };
          }

          const filtered = state.favorites.filter(
            (favorite) =>
              favorite.platform.toLowerCase() !== s.platform.toLowerCase() ||
              favorite.gameName.toLowerCase() !== s.gameName.toLowerCase() ||
              favorite.tagLine.toLowerCase() !== s.tagLine.toLowerCase()
          );

          return {
            favorites: [{ ...s, searchedAt: Date.now() }, ...filtered].slice(0, 8),
          };
        }),
      clear: () => set({ recents: [], favorites: [] }),
    }),
    { name: "lol-tracker-recents" }
  )
);
