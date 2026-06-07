import { describe, it, expect } from "vitest";
import { detectError } from "./explainer";

describe("error pattern matching", () => {
  it("detects command not found (unix and windows)", () => {
    expect(detectError("zsh: command not found: foo")?.id).toBe(
      "command-not-found",
    );
    expect(
      detectError("'foo' is not recognized as an internal or external command")
        ?.id,
    ).toBe("command-not-found");
  });

  it("detects permission denied", () => {
    expect(detectError("bash: ./run.sh: Permission denied")?.id).toBe(
      "permission-denied",
    );
  });

  it("detects port already in use", () => {
    expect(detectError("Error: listen EADDRINUSE: address already in use :::3000")?.id).toBe(
      "port-in-use",
    );
  });

  it("detects not a git repository", () => {
    expect(detectError("fatal: not a git repository")?.id).toBe(
      "not-a-git-repo",
    );
  });

  it("detects missing node/npm/python", () => {
    expect(detectError("node: command not found")?.id).toBe("node-not-found");
    expect(detectError("npm: command not found")?.id).toBe("npm-not-found");
    expect(detectError("python3: command not found")?.id).toBe(
      "python-not-found",
    );
  });

  it("detects file not found", () => {
    expect(detectError("cat: missing.txt: No such file or directory")?.id).toBe(
      "file-not-found",
    );
  });

  it("returns null for normal output", () => {
    expect(detectError("Successfully built project")).toBeNull();
    expect(detectError("")).toBeNull();
  });

  it("provides an OS-aware safe command for file-not-found", () => {
    const pattern = detectError("No such file or directory");
    expect(pattern?.safeCommand?.("windows")).toContain("Get-Location");
    expect(pattern?.safeCommand?.("macos")).toContain("pwd");
  });
});
