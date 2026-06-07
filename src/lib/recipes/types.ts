import type { OsType, RiskLevel } from "@/lib/types";

/** A value the recipe needs from the user before building a command. */
export interface RecipeInput {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
  defaultValue?: string;
}

/** Context passed to a recipe's command builder. */
export interface RecipeContext {
  os: OsType;
  cwd?: string;
  inputs: Record<string, string>;
}

/** Result of building a recipe into a runnable command. */
export interface BuiltCommand {
  command: string;
  os: OsType;
  /** Set when the recipe cannot run on the current OS. */
  unsupportedMessage?: string;
}

export interface Recipe {
  id: string;
  title: string;
  /** Natural-language phrases used for matching. */
  examples: string[];
  /** Keywords that strongly indicate this recipe. */
  keywords: string[];
  supportedOs: OsType[];
  inputs: RecipeInput[];
  risk: RiskLevel;
  explanation: string;
  /** Short preview shown before any inputs are filled. */
  preview: string;
  category: "files" | "system" | "developer";
  /** Build the OS-specific command. */
  build: (ctx: RecipeContext) => BuiltCommand;
  /** Optional summariser for raw command output. */
  parseResult?: (output: string) => string;
}
