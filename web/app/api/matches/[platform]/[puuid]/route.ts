import { NextResponse } from "next/server";
import { getMatch, getMatchIds, RiotError } from "@/lib/riot";

export async function GET(
  req: Request,
  { params }: { params: { platform: string; puuid: string } }
) {
  try {
    const url = new URL(req.url);
    const start = Math.max(0, Number(url.searchParams.get("start") ?? 0));
    const count = Math.min(20, Number(url.searchParams.get("count") ?? 10));
    const platform = params.platform.toLowerCase();
    const ids: string[] = await getMatchIds(params.puuid, platform, count, start);
    const matches = await Promise.all(ids.map((id) => getMatch(id, platform)));
    return NextResponse.json({
      matches,
      start,
      count,
      nextStart: start + ids.length,
      hasMore: ids.length === count,
    });
  } catch (e) {
    if (e instanceof RiotError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
