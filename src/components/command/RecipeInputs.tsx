import { useState } from "react";
import { motion } from "framer-motion";
import type { Recipe } from "@/lib/recipes/types";
import { Button } from "@/components/ui/Button";

interface RecipeInputsProps {
  recipe: Recipe;
  onSubmit: (inputs: Record<string, string>) => void;
  onCancel: () => void;
}

/** Collect required inputs for a recipe before building its command. */
export function RecipeInputs({ recipe, onSubmit, onCancel }: RecipeInputsProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      recipe.inputs.map((i) => [i.id, i.defaultValue ?? ""]),
    ),
  );

  const canSubmit = recipe.inputs
    .filter((i) => i.required)
    .every((i) => (values[i.id] ?? "").trim().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-soft space-y-3 p-4"
    >
      <div>
        <p className="text-sm font-medium text-ink">{recipe.title}</p>
        <p className="mt-0.5 text-[13px] text-ink-soft">{recipe.explanation}</p>
      </div>
      {recipe.inputs.map((input) => (
        <label key={input.id} className="block space-y-1">
          <span className="text-xs text-ink-soft">{input.label}</span>
          <input
            value={values[input.id] ?? ""}
            placeholder={input.placeholder}
            onChange={(e) =>
              setValues((v) => ({ ...v, [input.id]: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSubmit) onSubmit(values);
            }}
            autoFocus
            className="w-full rounded-lg border border-white/10 bg-graphite-900/70 px-3 py-2 text-sm text-ink focus-ring"
          />
        </label>
      ))}
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={!canSubmit}
          onClick={() => onSubmit(values)}
        >
          Build command
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
