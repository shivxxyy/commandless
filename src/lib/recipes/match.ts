import type { Recipe } from "./types";
import { RECIPES } from "./recipes";

export interface RecipeMatch {
  recipe: Recipe;
  score: number;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "this", "that", "my", "in", "on", "of", "to", "for",
  "is", "are", "what", "show", "me", "please", "here", "current", "folder",
  "and", "with", "i", "do", "can", "you", "it", "all",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

/**
 * Score how well an intent matches a recipe. Deterministic, no AI.
 * Combines:
 *  - exact/substring match against example phrases (strong signal)
 *  - keyword hits
 *  - token overlap with examples
 */
function scoreRecipe(intent: string, recipe: Recipe): number {
  const normalized = intent.toLowerCase().trim();
  if (!normalized) return 0;

  let score = 0;
  // Whole words in the intent, used so short terms ("ls", "df", "ps") only
  // match as standalone words and never as substrings inside other words.
  const intentWords = new Set(
    normalized.split(/[^a-z0-9]+/).filter(Boolean),
  );

  for (const example of recipe.examples) {
    const ex = example.toLowerCase();
    if (normalized === ex) return 100; // perfect match short-circuits
    if (ex.includes(" ")) {
      // Multi-word phrase: substring match is a strong signal.
      if (normalized.includes(ex) || ex.includes(normalized)) score += 30;
    } else if (intentWords.has(ex)) {
      // Single token: require a whole-word match.
      score += 20;
    }
  }

  for (const keyword of recipe.keywords) {
    const kw = keyword.toLowerCase();
    if (kw.includes(" ")) {
      if (normalized.includes(kw)) score += 12;
    } else if (intentWords.has(kw)) {
      score += 12;
    }
  }

  const intentTokens = new Set(tokenize(normalized));
  const exampleTokens = new Set(
    recipe.examples.flatMap((e) => tokenize(e)).concat(recipe.keywords.flatMap((k) => tokenize(k))),
  );
  let overlap = 0;
  for (const t of intentTokens) {
    if (exampleTokens.has(t)) overlap++;
  }
  score += overlap * 5;

  return score;
}

/**
 * Find the best recipe matches for a natural-language intent.
 * Returns matches sorted by score, above a confidence threshold.
 */
export function matchRecipes(intent: string, limit = 3): RecipeMatch[] {
  const matches = RECIPES.map((recipe) => ({
    recipe,
    score: scoreRecipe(intent, recipe),
  }))
    .filter((m) => m.score >= 12)
    .sort((a, b) => b.score - a.score);

  return matches.slice(0, limit);
}

/** Convenience: the single best recipe, or null if nothing is confident. */
export function bestRecipe(intent: string): Recipe | null {
  const [top] = matchRecipes(intent, 1);
  return top?.recipe ?? null;
}
