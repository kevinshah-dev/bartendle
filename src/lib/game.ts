import type { Cocktail } from "@/lib/types";

export function normalizeGuess(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/\bn\b/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function answerOptions(cocktail: Cocktail): string[] {
  return [cocktail.name, ...(cocktail.aliases ?? [])];
}

export function isCorrectGuess(guess: string, cocktail: Cocktail): boolean {
  const normalizedGuess = normalizeGuess(guess);

  return answerOptions(cocktail).some(
    (option) => normalizeGuess(option) === normalizedGuess,
  );
}

export function getCocktailSuggestions(
  query: string,
  cocktails: Cocktail[],
  limit = 6,
): Cocktail[] {
  const normalizedQuery = normalizeGuess(query);

  if (!normalizedQuery) {
    return [];
  }

  return cocktails
    .map((cocktail) => {
      const candidates = answerOptions(cocktail).map(normalizeGuess);
      const bestScore = candidates.reduce((score, candidate) => {
        if (candidate === normalizedQuery) return Math.min(score, 0);
        if (candidate.startsWith(normalizedQuery)) return Math.min(score, 1);
        if (candidate.includes(normalizedQuery)) return Math.min(score, 2);
        return score;
      }, 9);

      return { cocktail, score: bestScore };
    })
    .filter((entry) => entry.score < 9)
    .sort((a, b) => a.score - b.score || a.cocktail.name.localeCompare(b.cocktail.name))
    .slice(0, limit)
    .map((entry) => entry.cocktail);
}
