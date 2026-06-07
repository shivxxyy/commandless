import { describe, it, expect } from "vitest";
import { matchRecipes, bestRecipe } from "./match";
import { RECIPES_BY_ID, buildRecipe } from "./recipes";

describe("recipe matching", () => {
  it("matches natural-language intents to the right recipe", () => {
    expect(bestRecipe("find the largest files in this folder")?.id).toBe(
      "find-large-files",
    );
    expect(bestRecipe("what is using port 3000")?.id).toBe("find-port");
    expect(bestRecipe("show hidden files")?.id).toBe("show-hidden");
    expect(bestRecipe("show my git changes")?.id).toBe("git-status");
    expect(bestRecipe("compress this folder")?.id).toBe("compress-folder");
    expect(bestRecipe("search TODO in this project")?.id).toBe("search-text");
  });

  it("returns nothing for gibberish", () => {
    expect(matchRecipes("asdf qwerty zxcv")).toHaveLength(0);
  });

  it("ranks the best match first", () => {
    const matches = matchRecipes("show disk usage");
    expect(matches[0].recipe.id).toBe("disk-usage");
  });
});

describe("OS-specific command generation", () => {
  it("generates a macOS find-port command with lsof", () => {
    const built = buildRecipe(RECIPES_BY_ID["find-port"], {
      os: "macos",
      inputs: { port: "3000" },
    });
    expect(built.command).toBe("lsof -i :3000");
  });

  it("generates a Windows find-port command with Get-NetTCPConnection", () => {
    const built = buildRecipe(RECIPES_BY_ID["find-port"], {
      os: "windows",
      inputs: { port: "3000" },
    });
    expect(built.command).toContain("Get-NetTCPConnection -LocalPort 3000");
  });

  it("sanitizes the port input to digits only", () => {
    const built = buildRecipe(RECIPES_BY_ID["find-port"], {
      os: "macos",
      inputs: { port: "3000; rm -rf /" },
    });
    expect(built.command).toBe("lsof -i :3000");
  });

  it("uses PowerShell for compress on Windows and zip on macOS", () => {
    expect(
      buildRecipe(RECIPES_BY_ID["compress-folder"], {
        os: "windows",
        inputs: { name: "out.zip" },
      }).command,
    ).toContain("Compress-Archive");
    expect(
      buildRecipe(RECIPES_BY_ID["compress-folder"], {
        os: "macos",
        inputs: { name: "out.zip" },
      }).command,
    ).toContain("zip -r");
  });

  it("marks kill-port as dangerous", () => {
    expect(RECIPES_BY_ID["kill-port"].risk).toBe("dangerous");
  });
});
