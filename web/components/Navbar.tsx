import Link from "next/link";
import { Search, Swords } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-full px-1 py-1 transition-colors hover:text-foreground"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan-300 text-primary-foreground shadow-[0_0_24px_-12px] shadow-primary/80">
            <Swords className="h-5 w-5" />
          </span>
          <span>
            LoL<span className="text-primary">.tracker</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-3 md:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Search className="h-4 w-4" />
            Search
          </Link>
          <a
            href="https://developer.riotgames.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card/50 hover:text-foreground"
          >
            Riot API
          </a>
        </nav>
      </div>
    </header>
  );
}
