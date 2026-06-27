export type CocktailCategory =
  | "The unforgettables"
  | "Contemporary Classics"
  | "New Era";

export type Cocktail = {
  id: string;
  name: string;
  category: CocktailCategory;
  aliases?: string[];
  ingredients: string[];
  method: string[];
  garnish: string;
  sourceUrl: string;
};

export type GuessResult = {
  cocktailId: string;
  guess: string;
  correct: boolean;
};
