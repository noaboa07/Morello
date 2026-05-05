import { NextRequest, NextResponse } from "next/server";
import { getMatchTimeline, RiotError } from "@/lib/riot";

function platformFromMatchId(matchId: string): string {
  return matchId.split("_")[0].toLowerCase();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const matchId = decodeURIComponent(params.platform);
  const platform =
    request.nextUrl.searchParams.get("platform") ?? platformFromMatchId(matchId);

  try {
    const timeline = await getMatchTimeline(matchId, platform);
    return NextResponse.json(timeline);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[timeline] fetch failed:", matchId, platform, e instanceof Error ? e.message : String(e));
    }
    return NextResponse.json({ available: false });
  }
}
