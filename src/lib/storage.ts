import type { GuessResult } from "@/lib/types";

export type SavedDailyState = {
  dateKey: string;
  activeIndex: number;
  guesses: GuessResult[];
};

export function getStorageKey(dateKey: string): string {
  return `bartendle:${dateKey}`;
}

export function readSavedDailyState(dateKey: string): SavedDailyState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(getStorageKey(dateKey));

    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved) as SavedDailyState;

    return parsed.dateKey === dateKey ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSavedDailyState(state: SavedDailyState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(state.dateKey), JSON.stringify(state));
}

export function clearSavedDailyState(dateKey: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getStorageKey(dateKey));
}
