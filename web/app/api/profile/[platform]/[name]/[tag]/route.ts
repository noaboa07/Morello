import { NextResponse } from "next/server";
import {
  getAccountByRiotId,
  getRankedEntriesByPuuid,
  getSummonerByPuuid,
  RiotError,
} from "@/lib/riot";

export async function GET(
  _req: Request,
  { params }: { params: { platform: string; name: string; tag: string } }
) {
  try {
    const platform = params.platform.toLowerCase();
    const account = await getAccountByRiotId(
      decodeURIComponent(params.name),
      decodeURIComponent(params.tag),
      platform
    );
    const [summoner, ranked] = await Promise.all([
      getSummonerByPuuid(account.puuid, platform),
      getRankedEntriesByPuuid(account.puuid, platform),
    ]);
    return NextResponse.json({ account, summoner, ranked, platform });
  } catch (e) {
    if (e instanceof RiotError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
