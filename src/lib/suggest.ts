import type {
  CommandSuggestion,
  OsType,
} from "@/lib/types";
import type { AiCommandResponse } from "@/lib/ai/types";
import { classifyRisk } from "@/lib/risk/classifier";
import { buildRecipe } from "@/lib/recipes/recipes";
import type { Recipe, RecipeContext } from "@/lib/recipes/types";

const RISK_ORDER = { safe: 0, medium: 1, dangerous: 2 } as const;

/** Pick the more cautious of two risk levels. */
function maxRisk(
  a: CommandSuggestion["riskLevel"],
  b: CommandSuggestion["riskLevel"],
): CommandSuggestion["riskLevel"] {
  return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b;
}

/**
 * Build a CommandSuggestion from a recipe, re-checking risk locally.
 * The local risk engine always has the final say.
 */
export function recipeToSuggestion(
  recipe: Recipe,
  ctx: RecipeContext,
): CommandSuggestion {
  const built = buildRecipe(recipe, ctx);
  const assessment = classifyRisk(built.command);
  // Take the more cautious of the recipe's declared risk and the classifier.
  const riskLevel = maxRisk(recipe.risk, assessment.level);

  return {
    intent: recipe.title,
    command: built.command,
    explanation: built.unsupportedMessage ?? recipe.explanation,
    riskLevel,
    riskReason:
      riskLevel === recipe.risk && recipe.risk !== assessment.level
        ? recipe.explanation
        : assessment.reason,
    requiresConfirmation: riskLevel !== "safe",
    os: built.os,
    expectedOutcome: recipe.preview,
    alternatives: [],
    source: "recipe",
    recipeId: recipe.id,
  };
}

/**
 * Build a CommandSuggestion from an AI response. The local risk engine
 * re-checks the AI command and can only escalate risk, never lower it.
 */
export function aiToSuggestion(
  ai: AiCommandResponse,
  os: OsType,
): CommandSuggestion {
  const assessment = classifyRisk(ai.command);
  const riskLevel = maxRisk(ai.riskLevel, assessment.level);
  const escalated = riskLevel !== ai.riskLevel;

  return {
    intent: ai.intent || "AI suggestion",
    command: ai.command,
    explanation: ai.explanation,
    riskLevel,
    riskReason: escalated
      ? `${assessment.reason} (CommandLess raised this above the model's estimate.)`
      : ai.riskReason || assessment.reason,
    requiresConfirmation: ai.requiresConfirmation || riskLevel !== "safe",
    os: ai.os || os,
    expectedOutcome: ai.expectedOutcome,
    alternatives: ai.alternatives,
    source: "ai",
  };
}

/** Build a suggestion for a raw command the user typed/edited manually. */
export function manualToSuggestion(
  command: string,
  os: OsType,
  intent = "Manual command",
): CommandSuggestion {
  const assessment = classifyRisk(command);
  return {
    intent,
    command,
    explanation: "A command you entered directly.",
    riskLevel: assessment.level,
    riskReason: assessment.reason,
    requiresConfirmation: assessment.level !== "safe",
    os,
    expectedOutcome: "",
    alternatives: [],
    source: "manual",
  };
}
