import Link from "next/link";
import { Search, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-16 sm:py-24">
      <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/60 p-8 text-center shadow-[0_0_40px_-28px] shadow-primary/40 sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/12 text-primary">
          <Swords className="h-8 w-8" />
        </div>
        <div className="mt-6 text-xs uppercase tracking-[0.24em] text-muted-foreground">
          404
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Summoner not found</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Double-check the Riot ID and region, or try one of your saved profiles from the home page.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">
              <Search className="h-4 w-4" />
              Back to search
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a
              href="https://developer.riotgames.com/apis#account-v1/GET_getByRiotId"
              target="_blank"
              rel="noreferrer"
            >
              Riot ID help
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
