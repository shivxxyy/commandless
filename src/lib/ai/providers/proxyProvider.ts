import {
  SYSTEM_PROMPT,
  type AiProvider,
  type AiProviderConfig,
  type AiRequestContext,
  type AiCommandResponse,
} from "../types";
import { parseAiCommandResponse } from "../parse";

/**
 * Default provider. Calls the user's own backend, which holds the real
 * Ollama Cloud (or other) API key. The desktop app never sees the key.
 *
 * Expected backend contract:
 *   POST {proxyUrl}/command   -> { text: string } | AiCommandResponse JSON
 *   POST {proxyUrl}/explain   -> { text: string }
 */
export class ProxyProvider implements AiProvider {
  readonly kind = "proxy" as const;
  private readonly baseUrl: string;

  constructor(config: AiProviderConfig) {
    this.baseUrl = config.proxyUrl.replace(/\/$/, "");
  }

  private async post(path: string, body: unknown): Promise<string> {
    if (!this.baseUrl) {
      throw new Error(
        "No proxy URL configured. Set the AI proxy URL in Settings.",
      );
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // Shared app token (baked at build time) so the hosted proxy can reject
    // casual abuse. Not a real secret — it ships inside the app.
    const token = import.meta.env.VITE_APP_TOKEN;
    if (token) headers["x-commandless-token"] = token;

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Proxy request failed (${res.status}).`);
    }
    const data = await res.json().catch(() => null);
    if (data == null) throw new Error("Proxy returned an invalid response.");
    // Backend may return { text } (raw model output) or the structured object.
    if (typeof data === "string") return data;
    if (typeof data.text === "string") return data.text;
    return JSON.stringify(data);
  }

  async suggestCommand(
    intent: string,
    ctx: AiRequestContext,
  ): Promise<AiCommandResponse> {
    const text = await this.post("/command", {
      system: SYSTEM_PROMPT,
      intent,
      context: ctx,
    });
    const parsed = parseAiCommandResponse(text);
    if (!parsed) {
      throw new Error("Could not understand the AI response.");
    }
    return parsed;
  }

  async explainError(output: string, ctx: AiRequestContext) {
    const text = await this.post("/explain", {
      output,
      context: ctx,
    });
    // Reuse the JSON extractor for the explanation shape.
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
