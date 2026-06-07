import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  ActionCard,
  CommandStatus,
  CommandSuggestion,
  ErrorInsight,
} from "@/lib/types";
import type { Recipe } from "@/lib/recipes/types";
import { loadJson, saveJson, STORAGE_KEYS } from "@/lib/storage/store";

/** A user-saved recipe (snapshot of a suggestion they liked). */
export interface SavedRecipe {
  id: string;
  title: string;
  command: string;
  explanation: string;
  riskLevel: CommandSuggestion["riskLevel"];
  os: CommandSuggestion["os"];
  createdAt: number;
}

/** One turn of session conversation memory (not persisted across restarts). */
export interface ConversationTurn {
  intent: string;
  command: string;
  ts: number;
}

interface HistoryState {
  cards: ActionCard[];
  insights: ErrorInsight[];
  savedRecipes: SavedRecipe[];
  recentFolders: string[];
  /** Recent (intent → command) turns, most recent first. Session-only. */
  conversation: ConversationTurn[];

  addCard: (suggestion: CommandSuggestion, status?: CommandStatus) => string;
  updateCard: (id: string, patch: Partial<ActionCard>) => void;
  clearHistory: () => void;

  addTurn: (intent: string, command: string) => void;
  clearConversation: () => void;

  addInsight: (insight: Omit<ErrorInsight, "id" | "createdAt">) => void;
  dismissInsight: (id: string) => void;

  saveRecipe: (suggestion: CommandSuggestion) => void;
  removeSavedRecipe: (id: string) => void;

  addRecentFolder: (path: string) => void;
}

const HISTORY_LIMIT = 100;

const persistedCards = loadJson<ActionCard[]>(STORAGE_KEYS.history, []);
const persistedRecipes = loadJson<SavedRecipe[]>(STORAGE_KEYS.savedRecipes, []);
const persistedFolders = loadJson<string[]>(STORAGE_KEYS.recentFolders, []);

const CONVERSATION_LIMIT = 6;

export const useHistoryStore = create<HistoryState>((set) => ({
  cards: persistedCards,
  insights: [],
  savedRecipes: persistedRecipes,
  recentFolders: persistedFolders,
  conversation: [],

  addCard: (suggestion, status = "suggested") => {
    const id = nanoid(10);
    const card: ActionCard = {
      id,
      suggestion,
      status,
      createdAt: Date.now(),
    };
    set((s) => {
      const cards = [card, ...s.cards].slice(0, HISTORY_LIMIT);
      saveJson(STORAGE_KEYS.history, cards);
      return { cards };
    });
    return id;
  },

  updateCard: (id, patch) =>
    set((s) => {
      const cards = s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c));
      saveJson(STORAGE_KEYS.history, cards);
      return { cards };
    }),

  clearHistory: () => {
    saveJson(STORAGE_KEYS.history, []);
    set({ cards: [], insights: [], conversation: [] });
  },

  addTurn: (intent, command) =>
    set((s) => {
      if (!command.trim()) return s;
      // Avoid consecutive duplicates (e.g. re-generating the same intent).
      if (s.conversation[0]?.command === command) return s;
      return {
        conversation: [
          { intent, command, ts: Date.now() },
          ...s.conversation,
        ].slice(0, CONVERSATION_LIMIT),
      };
    }),

  clearConversation: () => set({ conversation: [] }),

  addInsight: (insight) =>
    set((s) => ({
      insights: [
        { ...insight, id: nanoid(10), createdAt: Date.now() },
        ...s.insights,
      ].slice(0, 20),
    })),

  dismissInsight: (id) =>
    set((s) => ({ insights: s.insights.filter((i) => i.id !== id) })),

  saveRecipe: (suggestion) =>
    set((s) => {
      const recipe: SavedRecipe = {
        id: nanoid(10),
        title: suggestion.intent || "Saved command",
        command: suggestion.command,
        explanation: suggestion.explanation,
        riskLevel: suggestion.riskLevel,
        os: suggestion.os,
        createdAt: Date.now(),
      };
      const savedRecipes = [recipe, ...s.savedRecipes];
      saveJson(STORAGE_KEYS.savedRecipes, savedRecipes);
      return { savedRecipes };
    }),

  removeSavedRecipe: (id) =>
    set((s) => {
      const savedRecipes = s.savedRecipes.filter((r) => r.id !== id);
      saveJson(STORAGE_KEYS.savedRecipes, savedRecipes);
      return { savedRecipes };
    }),

  addRecentFolder: (path) =>
    set((s) => {
      const recentFolders = [path, ...s.recentFolders.filter((f) => f !== path)].slice(0, 8);
      saveJson(STORAGE_KEYS.recentFolders, recentFolders);
      return { recentFolders };
    }),
}));

/** Export helper used by Settings → Export. */
export function exportData(): string {
  const state = useHistoryStore.getState();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      cards: state.cards,
      savedRecipes: state.savedRecipes,
      recentFolders: state.recentFolders,
    },
    null,
    2,
  );
}

// Re-export the recipe type for convenience in consumers.
export type { Recipe };
