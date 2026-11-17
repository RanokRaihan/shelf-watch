import { addYears, format, isValid, parse, subMonths, subWeeks } from "date-fns";

// Pure date helpers, safe on the client and the server. Every date is a plain
// calendar day as "YYYY-MM-DD", so string comparison orders them correctly.

const DAY_FORMAT = "yyyy-MM-dd";
const MAX_YEARS_AHEAD = 5;

export const PULL_OFFSETS = [
  { value: "1w", label: "1 week", subtract: (date: Date) => subWeeks(date, 1), leadDays: [7] },
  { value: "2w", label: "2 weeks", subtract: (date: Date) => subWeeks(date, 2), leadDays: [14] },
  { value: "1m", label: "1 month", subtract: (date: Date) => subMonths(date, 1), leadDays: [30, 31] },
  { value: "2m", label: "2 months", subtract: (date: Date) => subMonths(date, 2), leadDays: [60, 61] },
] as const;

export type PullOffset = (typeof PULL_OFFSETS)[number]["value"];

export function toDay(date: Date): string {
  return format(date, DAY_FORMAT);
}

export function parseDay(day: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const date = parse(day, DAY_FORMAT, new Date());
  return isValid(date) ? date : null;
}

export function isDay(value: string): boolean {
  return parseDay(value) !== null;
}

// en-CA formats as YYYY-MM-DD.
export function todayIn(timezone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function latestAllowedDay(today: string): string {
  const date = parseDay(today);
  return date ? toDay(addYears(date, MAX_YEARS_AHEAD)) : today;
}

export type OffsetPullDay = { pullDate: string; clampedToToday: boolean };

/** Expiry minus the offset, but never before today. */
export function pullDayForOffset(
  expiryDay: string,
  offset: PullOffset,
  today: string,
): OffsetPullDay | null {
  const expiry = parseDay(expiryDay);
  const option = PULL_OFFSETS.find((candidate) => candidate.value === offset);
  if (!expiry || !option) return null;
  const pullDate = toDay(option.subtract(expiry));
  return pullDate < today
    ? { pullDate: today, clampedToToday: true }
    : { pullDate, clampedToToday: false };
}

export function offsetForLeadDays(leadDays: number): PullOffset | null {
  const match = PULL_OFFSETS.find((option) =>
    (option.leadDays as readonly number[]).includes(leadDays),
  );
  return match?.value ?? null;
}

// `@db.Date` columns round-trip as UTC midnight.
export function dayToDbDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export function dbDateToDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
