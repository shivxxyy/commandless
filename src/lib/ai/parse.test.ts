import { describe, it, expect } from "vitest";
import { parseAiCommandResponse, extractJsonObject } from "./parse";

describe("AI JSON parser", () => {
  it("parses a clean JSON response", () => {
    const raw = JSON.stringify({
      intent: "list files",
      command: "ls -la",
      explanation: "Lists files",
      riskLevel: "safe",
      riskReason: "read only",
      requiresConfirmation: false,
      os: "macos",
      expectedOutcome: "a file listing",
      alternatives: [],
    });
    const parsed = parseAiCommandResponse(raw);
    expect(parsed?.command).toBe("ls -la");
    expect(parsed?.riskLevel).toBe("safe");
  });

  it("extracts JSON wrapped in markdown fences and prose", () => {
    const raw =
      "Sure! Here is the command:\n```json\n{\"command\": \"pwd\", \"riskLevel\": \"safe\"}\n```\nHope that helps.";
    const parsed = parseAiCommandResponse(raw);
    expect(parsed?.command).toBe("pwd");
  });

  it("handles braces inside string values", () => {
    const raw = '{"command": "echo {hello}", "riskLevel": "safe"}';
    expect(extractJsonObject(raw)).toBe(raw);
    expect(parseAiCommandResponse(raw)?.command).toBe("echo {hello}");
  });

  it("coerces unknown risk levels to a cautious default", () => {
    const raw = '{"command": "ls", "riskLevel": "totally-fine"}';
    expect(parseAiCommandResponse(raw)?.riskLevel).toBe("medium");
  });

  it("normalizes risk synonyms", () => {
    expect(
      parseAiCommandResponse('{"command":"x","riskLevel":"very dangerous"}')
        ?.riskLevel,
    ).toBe("dangerous");
  });

  it("returns null when no command and no clarification", () => {
    expect(parseAiCommandResponse("not json at all")).toBeNull();
    expect(parseAiCommandResponse('{"explanation":"hi"}')).toBeNull();
  });

  it("accepts a clarification response with no command", () => {
    const raw =
      '{"command":"","needsClarification":true,"clarificationQuestion":"Which folder?"}';
    const parsed = parseAiCommandResponse(raw);
    expect(parsed?.needsClarification).toBe(true);
    expect(parsed?.clarificationQuestion).toBe("Which folder?");
  });

  it("defaults requiresConfirmation to true when omitted", () => {
    const parsed = parseAiCommandResponse('{"command":"ls"}');
    expect(parsed?.requiresConfirmation).toBe(true);
  });
});
