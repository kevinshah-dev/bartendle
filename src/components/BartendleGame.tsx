"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cocktails } from "@/data/cocktails";
import {
  ARCHIVE_START_KEY,
  DAILY_COCKTAIL_COUNT,
  getDailyCocktails,
  getLocalDateKey,
  resolveArchiveDate,
  shiftArchiveDate,
} from "@/lib/daily";
import { getCocktailSuggestions, isCorrectGuess } from "@/lib/game";
import {
  clearSavedDailyState,
  readSavedDailyState,
  writeSavedDailyState,
} from "@/lib/storage";
import { useScoreSubmission } from "@/lib/statsRecorder";
import type { Cocktail, GuessResult } from "@/lib/types";
import type { FormEvent } from "react";
import { ClerkAuthControls } from "./ClerkAuthControls";

function resultFor(cocktail: Cocktail, guesses: GuessResult[]) {
  return guesses.find((guess) => guess.cocktailId === cocktail.id);
}

function ingredientAmount(ingredient: string): string {
  const match = ingredient.match(/^([0-9.]+(?:\/[0-9.]+)?(?:\s?ml)?|A splash|Top with|Few|1|2|4|6\/8)/i);
  return match?.[0] ?? "";
}

function ingredientName(ingredient: string): string {
  const amount = ingredientAmount(ingredient);
  return amount ? ingredient.slice(amount.length).trim() : ingredient;
}

function scoreLabel(score: number) {
  if (score === DAILY_COCKTAIL_COUNT) return "clean pour";
  if (score === 2) return "solid round";
  if (score === 1) return "one for the rail";
  return "rough service";
}

function archiveHref(dateKey: string, todayKey: string): string {
  const resolvedDateKey = resolveArchiveDate(dateKey, todayKey);

  return resolvedDateKey === todayKey ? "/" : `/?date=${resolvedDateKey}`;
}

function requestedArchiveDateKey(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return new URLSearchParams(window.location.search).get("date") ?? undefined;
}

export function BartendleGame() {
  const todayKey = useMemo(() => getLocalDateKey(), []);
  const [dateKey, setDateKey] = useState(() => todayKey);
  const [activeIndex, setActiveIndex] = useState(0);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [draft, setDraft] = useState("");
  const [loadedSavedState, setLoadedSavedState] = useState(false);
  const isToday = dateKey === todayKey;
  const previousDateKey = shiftArchiveDate(dateKey, -1, todayKey);
  const nextDateKey = shiftArchiveDate(dateKey, 1, todayKey);
  const canGoPrevious = dateKey > ARCHIVE_START_KEY;
  const canGoNext = dateKey < todayKey;

  const dailyCocktails = useMemo(
    () => getDailyCocktails(cocktails, dateKey),
    [dateKey],
  );
  const activeCocktail = dailyCocktails[activeIndex] ?? dailyCocktails[0];
  const activeResult = activeCocktail ? resultFor(activeCocktail, guesses) : undefined;
  const score = guesses.filter((guess) => guess.correct).length;
  const isComplete = guesses.length >= DAILY_COCKTAIL_COUNT;
  const suggestions = useMemo(
    () => getCocktailSuggestions(draft, cocktails),
    [draft],
  );

  const scorePayload = useMemo(() => {
    if (!isComplete) {
      return null;
    }

    return {
      gameId: "bartendle",
      mode: "daily" as const,
      score,
      maxScore: DAILY_COCKTAIL_COUNT,
      playedOn: dateKey,
      idempotencyKey: `bartendle:${dateKey}`,
      metadata: {
        guesses,
        cocktails: dailyCocktails.map((cocktail) => cocktail.id),
      },
    };
  }, [dailyCocktails, dateKey, guesses, isComplete, score]);

  useScoreSubmission(scorePayload);

  useEffect(() => {
    const resolvedDateKey = resolveArchiveDate(requestedArchiveDateKey(), todayKey);
    const saved = readSavedDailyState(resolvedDateKey);

    setDateKey(resolvedDateKey);
    setDraft("");
    if (saved) {
      setActiveIndex(Math.min(saved.activeIndex, DAILY_COCKTAIL_COUNT - 1));
      setGuesses(saved.guesses.slice(0, DAILY_COCKTAIL_COUNT));
    } else {
      setActiveIndex(0);
      setGuesses([]);
    }

    setLoadedSavedState(true);
  }, [todayKey]);

  useEffect(() => {
    if (!loadedSavedState) {
      return;
    }

    writeSavedDailyState({ dateKey, activeIndex, guesses });
  }, [activeIndex, dateKey, guesses, loadedSavedState]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeCocktail || activeResult || isComplete || !draft.trim()) {
      return;
    }

    const correct = isCorrectGuess(draft, activeCocktail);
    const nextGuess = {
      cocktailId: activeCocktail.id,
      guess: draft.trim(),
      correct,
    };

    setGuesses((current) => [...current, nextGuess]);
    setDraft("");
  }

  function moveNext() {
    setActiveIndex((index) => Math.min(index + 1, DAILY_COCKTAIL_COUNT - 1));
  }

  function resetLocalRound() {
    clearSavedDailyState(dateKey);
    setActiveIndex(0);
    setGuesses([]);
    setDraft("");
  }

  function navigateToArchiveDate(nextDateKey: string) {
    window.location.href = archiveHref(nextDateKey, todayKey);
  }

  return (
    <main className="bartendle-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Bartendle home">
          <span className="brand-mark" aria-hidden="true">
            B
          </span>
          <span>Bartendle</span>
        </a>
        <ClerkAuthControls />
      </header>

      <section className="game-layout" aria-label="Bartendle daily game">
        <aside className="bar-panel" aria-label="Daily progress">
          <div className="daily-intro">
            <h1>Bartendle</h1>
            <p className="lede">
              Guess the IBA cocktail from the recipe.
            </p>
          </div>

          <div className="daily-meta">
            <div className="meta-tile">
              <span>Date</span>
              <strong>{dateKey}</strong>
            </div>
            <div className="meta-tile">
              <span>Score</span>
              <strong>
                {score}/{DAILY_COCKTAIL_COUNT}
              </strong>
            </div>
          </div>

          <div className="archive-panel" aria-label="Archive mode">
            <div className="archive-heading">
              <span>Archive</span>
              <strong>{isToday ? "Today" : "Archive day"}</strong>
            </div>
            <div className="archive-controls">
              <button
                aria-label="Previous day"
                className="archive-nav"
                disabled={!canGoPrevious}
                onClick={() => navigateToArchiveDate(previousDateKey)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={18} />
              </button>
              <label className="archive-date-field">
                <CalendarDays aria-hidden="true" size={16} />
                <input
                  aria-label="Archive date"
                  max={todayKey}
                  min={ARCHIVE_START_KEY}
                  onChange={(event) => navigateToArchiveDate(event.target.value)}
                  type="date"
                  value={dateKey}
                />
              </label>
              <button
                aria-label="Next day"
                className="archive-nav"
                disabled={!canGoNext}
                onClick={() => navigateToArchiveDate(nextDateKey)}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={18} />
              </button>
            </div>
            {!isToday ? (
              <div className="archive-range">
                <a href={archiveHref(todayKey, todayKey)}>Today</a>
              </div>
            ) : null}
          </div>

          <div>
            <div className="progress-copy">
              <span>{isToday ? "Today's pours" : "Archive pours"}</span>
              <strong>
                Recipe {Math.min(guesses.length + 1, DAILY_COCKTAIL_COUNT)} of{" "}
                {DAILY_COCKTAIL_COUNT}
              </strong>
            </div>
            <div className="progress-dots" aria-label="Daily recipe progress">
              {dailyCocktails.map((cocktail, index) => {
                const result = resultFor(cocktail, guesses);
                const statusClass = result
                  ? result.correct
                    ? " correct"
                    : " wrong"
                  : index === activeIndex
                    ? " active"
                    : "";

                return (
                  <span
                    className={`progress-dot${statusClass}`}
                    key={cocktail.id}
                    aria-label={`Recipe ${index + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </aside>

        <section className="recipe-stage">
          {!isComplete && activeCocktail ? (
            <article className="recipe-card">
              <div className="recipe-card-header">
                <div>
                  <p className="recipe-step">
                    Recipe {activeIndex + 1} of {DAILY_COCKTAIL_COUNT}
                  </p>
                  <h2>What drink is this?</h2>
                </div>
                <span className="category-pill">{activeCocktail.category}</span>
              </div>

              <div className="ingredient-list" aria-label="Ingredients and proportions">
                {activeCocktail.ingredients.map((ingredient) => (
                  <div className="ingredient-row" key={ingredient}>
                    <span className="measure">{ingredientAmount(ingredient) || "dash"}</span>
                    <span className="ingredient-name">
                      {ingredientName(ingredient) || ingredient}
                    </span>
                  </div>
                ))}
              </div>

              <div className="method-grid">
                <div>
                  <span>Method</span>
                  {activeCocktail.method.map((step) => (
                    <p key={step}>{step}</p>
                  ))}
                </div>
                <div>
                  <span>Garnish</span>
                  <p>{activeCocktail.garnish}</p>
                </div>
              </div>

              {!activeResult ? (
                <form className="guess-form" onSubmit={handleSubmit}>
                  <label htmlFor="cocktail-guess">Your guess</label>
                  <div className="guess-row">
                    <input
                      autoComplete="off"
                      id="cocktail-guess"
                      list="cocktail-options"
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Name the cocktail..."
                      type="text"
                      value={draft}
                    />
                    <button type="submit" disabled={!draft.trim()}>
                      <Send aria-hidden="true" size={18} />
                      Guess
                    </button>
                  </div>
                  <datalist id="cocktail-options">
                    {cocktails.map((cocktail) => (
                      <option key={cocktail.id} value={cocktail.name} />
                    ))}
                  </datalist>
                  {suggestions.length > 0 ? (
                    <div className="suggestion-row" aria-label="Suggestions">
                      {suggestions.map((cocktail) => (
                        <button
                          key={cocktail.id}
                          onClick={() => setDraft(cocktail.name)}
                          type="button"
                        >
                          {cocktail.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </form>
              ) : (
                <div className={`answer-reveal${activeResult.correct ? " correct" : " wrong"}`}>
                  <div className="answer-status">
                    <span aria-hidden="true">
                      {activeResult.correct ? <Check size={18} /> : <X size={18} />}
                    </span>
                    <strong>
                      {activeResult.correct ? "Correct" : activeCocktail.name}
                    </strong>
                  </div>
                  {!activeResult.correct ? (
                    <p>
                      Your guess: <span>{activeResult.guess}</span>
                    </p>
                  ) : null}
                  <div className="answer-actions">
                    <a href={activeCocktail.sourceUrl} rel="noopener" target="_blank">
                      Recipe
                      <ExternalLink aria-hidden="true" size={16} />
                    </a>
                    {guesses.length < DAILY_COCKTAIL_COUNT ? (
                      <button onClick={moveNext} type="button">
                        Next recipe
                        <ArrowRight aria-hidden="true" size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </article>
          ) : (
            <article className="finish-card">
              <p className="recipe-step">Service complete</p>
              <h2>
                {score}/{DAILY_COCKTAIL_COUNT} {scoreLabel(score)}
              </h2>
              <div className="summary-list">
                {dailyCocktails.map((cocktail) => {
                  const result = resultFor(cocktail, guesses);
                  return (
                    <div className="summary-row" key={cocktail.id}>
                      <span className={result?.correct ? "summary-icon correct" : "summary-icon wrong"}>
                        {result?.correct ? <Check size={16} /> : <X size={16} />}
                      </span>
                      <div>
                        <strong>{cocktail.name}</strong>
                        <span>{cocktail.ingredients.join(" / ")}</span>
                      </div>
                      <a href={cocktail.sourceUrl} rel="noopener" target="_blank">
                        Recipe
                        <ExternalLink aria-hidden="true" size={15} />
                      </a>
                    </div>
                  );
                })}
              </div>
              <button className="reset-button" onClick={resetLocalRound} type="button">
                <RotateCcw aria-hidden="true" size={16} />
                Replay locally
              </button>
            </article>
          )}
        </section>
      </section>

      <footer className="site-credit">
        Created by{" "}
        <a href="https://cenough.games" rel="noopener" target="_blank">
          CloseEnough Games
        </a>
      </footer>
    </main>
  );
}
