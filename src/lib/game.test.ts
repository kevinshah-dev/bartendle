import { describe, expect, it } from "vitest";
import { cocktails } from "@/data/cocktails";
import {
  ARCHIVE_START_KEY,
  DAILY_COCKTAIL_COUNT,
  getDailyCocktails,
  resolveArchiveDate,
  shiftArchiveDate,
} from "@/lib/daily";
import { getCocktailSuggestions, isCorrectGuess, normalizeGuess } from "@/lib/game";

describe("Bartendle game helpers", () => {
  it("normalizes punctuation, case, and diacritics", () => {
    expect(normalizeGuess("Dark 'n' Stormy")).toBe("dark and stormy");
    expect(normalizeGuess("Crème de Mûre")).toBe("creme de mure");
  });

  it("accepts cocktail aliases", () => {
    const darkAndStormy = cocktails.find((cocktail) => cocktail.id === "dark-n-stormy");

    expect(darkAndStormy).toBeDefined();
    expect(isCorrectGuess("dark and stormy", darkAndStormy!)).toBe(true);
  });

  it("selects the same three cocktails for a date", () => {
    const first = getDailyCocktails(cocktails, "2026-06-27");
    const second = getDailyCocktails(cocktails, "2026-06-27");

    expect(first).toHaveLength(DAILY_COCKTAIL_COUNT);
    expect(first.map((cocktail) => cocktail.id)).toEqual(
      second.map((cocktail) => cocktail.id),
    );
  });

  it("clamps archive dates from June 1 through today", () => {
    expect(ARCHIVE_START_KEY).toBe("2026-06-01");
    expect(resolveArchiveDate("2026-05-31", "2026-06-27")).toBe("2026-06-01");
    expect(resolveArchiveDate("2026-06-12", "2026-06-27")).toBe("2026-06-12");
    expect(resolveArchiveDate("2026-06-30", "2026-06-27")).toBe("2026-06-27");
    expect(resolveArchiveDate("not-a-date", "2026-06-27")).toBe("2026-06-27");
  });

  it("steps archive dates without leaving the archive range", () => {
    expect(shiftArchiveDate("2026-06-01", -1, "2026-06-27")).toBe("2026-06-01");
    expect(shiftArchiveDate("2026-06-12", -1, "2026-06-27")).toBe("2026-06-11");
    expect(shiftArchiveDate("2026-06-27", 1, "2026-06-27")).toBe("2026-06-27");
  });

  it("finds suggestions by prefix", () => {
    expect(getCocktailSuggestions("marg", cocktails)[0]?.name).toBe("Margarita");
  });

  it("keeps the recipe pool sourced and playable", () => {
    expect(cocktails.length).toBeGreaterThanOrEqual(DAILY_COCKTAIL_COUNT * 10);

    for (const cocktail of cocktails) {
      expect(cocktail.sourceUrl).toMatch(/^https:\/\/iba-world\.com\/iba-cocktail\//);
      expect(cocktail.ingredients.length).toBeGreaterThan(1);
      expect(cocktail.method.length).toBeGreaterThan(0);
    }
  });
});
