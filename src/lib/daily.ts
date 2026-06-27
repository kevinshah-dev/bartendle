import type { Cocktail } from "@/lib/types";

export const DAILY_COCKTAIL_COUNT = 3;
export const ARCHIVE_START_KEY = "2026-06-01";

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatUtcDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function latestArchiveKey(todayKey: string): string {
  return parseDateKey(todayKey) && todayKey >= ARCHIVE_START_KEY
    ? todayKey
    : ARCHIVE_START_KEY;
}

export function resolveArchiveDate(
  requestedDateKey?: string,
  todayKey = getLocalDateKey(),
): string {
  const latestKey = latestArchiveKey(todayKey);
  const requestedKey =
    requestedDateKey && parseDateKey(requestedDateKey)
      ? requestedDateKey
      : latestKey;

  if (requestedKey < ARCHIVE_START_KEY) {
    return ARCHIVE_START_KEY;
  }

  if (requestedKey > latestKey) {
    return latestKey;
  }

  return requestedKey;
}

export function shiftArchiveDate(
  dateKey: string,
  offsetDays: number,
  todayKey = getLocalDateKey(),
): string {
  const resolvedKey = resolveArchiveDate(dateKey, todayKey);
  const resolvedDate = parseDateKey(resolvedKey);

  if (!resolvedDate) {
    return resolveArchiveDate(undefined, todayKey);
  }

  resolvedDate.setUTCDate(resolvedDate.getUTCDate() + offsetDays);

  return resolveArchiveDate(formatUtcDateKey(resolvedDate), todayKey);
}

function xmur3(value: string) {
  let hash = 1779033703 ^ value.length;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailyCocktails(
  cocktails: Cocktail[],
  dateKey: string,
  count = DAILY_COCKTAIL_COUNT,
): Cocktail[] {
  const seeded = mulberry32(xmur3(`bartendle:${dateKey}`)());
  const shuffled = [...cocktails];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(seeded() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, count);
}
