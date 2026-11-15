import { format } from "date-fns";

import { parseDay } from "@/lib/pulls/pull-dates";

/** "2026-11-20" -> "Fri, Nov 20, 2026". */
export function formatDay(day: string): string {
  const date = parseDay(day);
  return date ? format(date, "EEE, MMM d, yyyy") : day;
}
