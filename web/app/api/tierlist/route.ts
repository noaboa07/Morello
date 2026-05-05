import { NextResponse } from "next/server";
import { fetchTierList } from "@/lib/tierlist";

export async function GET(): Promise<NextResponse> {
  const result = await fetchTierList();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json(result);
}
