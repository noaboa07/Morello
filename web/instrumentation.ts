export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const raw = process.env.RIOT_API_KEY;
  const key = raw?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (!key) {
    console.warn(
      "[lol-tracker] ⚠ RIOT_API_KEY is NOT set. Add it to web/.env.local and restart the dev server."
    );
    return;
  }
  const looksValid = /^RGAPI-[a-f0-9-]{36}$/i.test(key);
  console.log(
    `[lol-tracker] ✓ RIOT_API_KEY loaded (length=${key.length}, prefix=${key.slice(
      0,
      14
    )}…, format=${looksValid ? "ok" : "unexpected"})`
  );
}
