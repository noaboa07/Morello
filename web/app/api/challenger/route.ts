import { NextResponse } from "next/server";
import { fetchChallengerFeed } from "@/lib/challenger";

export async function GET(): Promise<NextResponse> {
  const liveGames = await fetchChallengerFeed();
  return NextResponse.json(liveGames, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
  });
}
