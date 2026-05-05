import { NextResponse } from "next/server";
import { getLatestVersion } from "@/lib/ddragon";
import type { RuneTree } from "@/lib/types";

export async function GET() {
  try {
    const version = await getLatestVersion();
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`,
      { next: { revalidate: 60 * 60 * 12 } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch rune data" }, { status: 502 });
    }
    const data: RuneTree[] = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
