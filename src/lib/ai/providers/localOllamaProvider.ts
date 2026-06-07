import {
  SYSTEM_PROMPT,
  type AiProvider,
  type AiProviderConfig,
  type AiRequestContext,
  type AiCommandResponse,
} from "../types";
import { parseAiCommandResponse } from "../parse";

/**
 * Optional provider that talks to a local Ollama instance
 * (e.g. http://localhost:11434). No API key is required. This is fully
 * optional — CommandLess works without it via recipes and the proxy.
 */
export class LocalOllamaProvider implements AiProvider {
  readonly kind = "local-ollama" as const;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config: AiProviderConfig) {
    this.baseUrl = config.ollamaUrl.replace(/\/$/, "");
    this.model = config.model || "llama3.1";
  }

  private async generate(prompt: string, system: string): Promise<string> {
    if (!this.baseUrl) {
      throw new Error("No Ollama URL configured. Set it in Settings.");
    }
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        system,
        prompt,
        stream: false,
        format: "json",
        options: { temperature: 0.2 },
      }),
    });
    if (!res.ok) {
      throw new Error(
        `Ollama request failed (${res.status}). Is Ollama running?`,
      );
    }
    const data = (await res.json()) as { response?: string };
    return data.response ?? "";
  }

  async suggestCommand(
    intent: string,
    ctx: AiRequestContext,
  ): Promise<AiCommandResponse> {
    const lines = [
      `OS: ${ctx.os}`,
      `Shell: ${ctx.shell}`,
      `Working directory: ${ctx.cwd ?? "unknown"}`,
    ];
    if (ctx.history?.length) {
      lines.push("Earlier in this session:");
      for (const turn of ctx.history) {
        lines.push(`- intent: ${turn.intent}\n  command: ${turn.command}`);
      }
    }
    if (ctx.recentOutput) {
      lines.push(`Recent terminal output:\n${ctx.recentOutput}`);
    }
    lines.push(`User intent: ${intent}`);
    const text = await this.generate(lines.join("\n"), SYSTEM_PROMPT);
    const parsed = parseAiCommandResponse(text);
    if (!parsed) {
      throw new Error("Could not understand the Ollama response.");
    }
    return parsed;
  }

  async explainError(output: string, ctx: AiRequestContext) {
    const system =
      "You explain shell errors clearly for CommandLess. Return strict JSON with keys: title, whatHappened, likelyCause, suggestedFix, safeCommand. No markdown.";
    const prompt = `OS: ${ctx.os}\nShell: ${ctx.shell}\nTerminal output:\n${output}`;
    const text = await this.generate(prompt, system);
    try {
      const data = JSON.parse(text) as Record<string, string>;
      return {
        title: data.title ?? "Error explanation",
        whatHappened: data.whatHappened ?? text,
        likelyCause: data.likelyCause ?? "",
        suggestedFix: data.suggestedFix ?? "",
        safeCommand: data.safeCommand,
      };
    } catch {
      return {
        title: "Error explanation",
        whatHappened: text,
        likelyCause: "",
        suggestedFix: "",
      };
    }
  }
}
