// Pure helpers for the pull list greeting, safe on the client and the server.

const LINES = [
  "Fresh shelves start here.",
  "Let's keep the shelves honest.",
  "One scan at a time.",
  "Nothing past its date on your watch.",
  "Small checks, happy customers.",
  "Clean shelves, clear conscience.",
  "Every date counts.",
  "Let's catch them before they expire.",
  "A tidy shelf is a good shelf.",
  "You've got this.",
] as const;

export function hourIn(timezone: string, now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hourCycle: "h23",
  }).format(now);
  return Number(hour);
}

export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

export function randomLine(): string {
  return LINES[Math.floor(Math.random() * LINES.length)];
}
