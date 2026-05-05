import type { Metadata } from "next";
import { TierListClient } from "@/components/TierListClient";
import { fetchTierList } from "@/lib/tierlist";

export const metadata: Metadata = {
  title: "Champion Tier List",
  description:
    "Meta champion tier list ranked by win rate — see which champions are dominating each role this patch.",
};

export default async function TierListPage() {
  const result = await fetchTierList();

  if ("error" in result) {
    return (
      <div className="mx-auto max-w-4xl pt-10 text-center text-muted-foreground">
        <p className="text-sm">{result.error}</p>
      </div>
    );
  }

  return <TierListClient payload={result} />;
}
