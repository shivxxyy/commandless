import type { AiProvider, AiProviderConfig } from "./types";
import { ProxyProvider } from "./providers/proxyProvider";
import { LocalOllamaProvider } from "./providers/localOllamaProvider";

export * from "./types";
export { parseAiCommandResponse, extractJsonObject } from "./parse";

/**
 * Build the configured AI provider, or null when AI is disabled.
 * The provider layer is fully swappable: the rest of the app only depends on
 * the AiProvider interface, never on a concrete implementation.
 */
export function createAiProvider(config: AiProviderConfig): AiProvider | null {
  switch (config.kind) {
    case "proxy":
      return new ProxyProvider(config);
    case "local-ollama":
      return new LocalOllamaProvider(config);
    case "none":
    default:
      return null;
  }
}

export function defaultAiConfig(): AiProviderConfig {
  return {
    kind: "proxy",
    proxyUrl: import.meta.env.VITE_AI_PROXY_URL ?? "",
    ollamaUrl: import.meta.env.VITE_OLLAMA_URL ?? "http://localhost:11434",
    model: import.meta.env.VITE_OLLAMA_MODEL ?? "llama3.1",
  };
}
