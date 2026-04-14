export const QUEUE_NAMES: Record<number, string> = {
  400: "Normal Draft",
  420: "Ranked Solo",
  430: "Normal Blind",
  440: "Ranked Flex",
  450: "ARAM",
  700: "Clash",
  900: "URF",
  1020: "One for All",
  1300: "Nexus Blitz",
  1400: "Ultimate Spellbook",
  1700: "Arena",
  1900: "URF",
};

export function queueName(id: number) {
  return QUEUE_NAMES[id] ?? "Custom";
}

export function isNormalQueue(id: number) {
  return id === 400 || id === 430;
}
