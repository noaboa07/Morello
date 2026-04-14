import { NextResponse } from "next/server";
import { getActiveGame, getSummonerByPuuid, RiotError } from "@/lib/riot";
import { getChampionIdMap } from "@/lib/ddragon";

const QUEUE_DESCRIPTIONS: Record<number, string> = {
  400: "Normal Draft",
  420: "Ranked Solo",
  430: "Normal Blind",
  440: "Ranked Flex",
  450: "ARAM",
  700: "Clash",
  1700: "Arena",
};

export async function GET(
  _req: Request,
  { params }: { params: { platform: string; puuid: string } }
) {
  try {
    const platform = params.platform.toLowerCase();
    const summoner = await getSummonerByPuuid(params.puuid, platform);
    const game = await getActiveGame(summoner.id ?? "", platform);
    if (!game) return NextResponse.json({ game: null });

    const champMap = await getChampionIdMap();
    const me = game.participants?.find((p: any) => p.puuid === params.puuid);
    const myChampion = me ? champMap[String(me.championId)] ?? null : null;

    const startedAt = game.gameStartTime ?? Date.now();
    const lengthSec =
      game.gameLength && game.gameLength > 0
        ? game.gameLength
        : Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

    return NextResponse.json({
      game: {
        gameMode: QUEUE_DESCRIPTIONS[game.gameQueueConfigId] ?? game.gameMode ?? "Custom",
        gameLength: lengthSec,
        championName: myChampion,
        gameStartTime: startedAt,
      },
    });
  } catch (e) {
    if (e instanceof RiotError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
