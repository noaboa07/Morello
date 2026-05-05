import Link from "next/link";
import { BarChart2, Search } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-foreground"
        >
          <span className="text-2xl font-bold tracking-tight">
            Morell<span className="text-primary">o</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </Link>
          <Link
            href="/tierlist"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Tier List
          </Link>
          <a
            href="https://developer.riotgames.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Riot API
          </a>
        </nav>
      </div>
    </header>
  );
}
