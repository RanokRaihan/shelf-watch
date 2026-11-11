const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Short "how long ago" text: "just now", "5 min ago", "3 hr ago", "2 days
 * ago", then a date like "Nov 2". Safe on client and server.
 */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - date.getTime());
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} hr ago`;
  const days = Math.floor(diff / DAY);
  if (days < 7) return days === 1 ? "yesterday" : `${days} days ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}
