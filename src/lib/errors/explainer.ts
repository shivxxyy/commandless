import type { OsType } from "@/lib/types";

export interface ErrorPattern {
  id: string;
  test: RegExp;
  title: string;
  whatHappened: string;
  likelyCause: string;
  suggestedFix: string;
  /** Optional safe command suggestion, may depend on OS. */
  safeCommand?: (os: OsType) => string | undefined;
}

/**
 * Pattern-based error detection. Runs first, locally, with no AI.
 * The frontend can additionally offer "Ask AI to explain this error".
 */
export const ERROR_PATTERNS: ErrorPattern[] = [
  {
    id: "command-not-found",
    test: /command not found|is not recognized as an internal or external command|: not found/i,
    title: "Command not found",
    whatHappened: "The shell could not find the program you tried to run.",
    likelyCause:
      "The tool isn't installed, or it isn't on your PATH, or the command was mistyped.",
    suggestedFix:
      "Check the spelling. If it's a tool you expect to have, install it or make sure its folder is on your PATH.",
  },
  {
    id: "permission-denied",
    test: /permission denied|operation not permitted/i,
    title: "Permission denied",
    whatHappened: "The operating system blocked the command from accessing a file or resource.",
    likelyCause:
      "You don't have rights to that file or folder, or the file isn't marked as executable.",
    suggestedFix:
      "Check that you own the file and have access. Avoid using sudo unless you understand the change. For scripts, ensure they are executable.",
  },
  {
    id: "access-denied-win",
    test: /access (is )?denied|UnauthorizedAccessException/i,
    title: "Access denied",
    whatHappened: "Windows blocked the operation due to insufficient permissions.",
    likelyCause:
      "The file is in use, protected, or requires an elevated (administrator) PowerShell.",
    suggestedFix:
      "Close any program using the file, or run the command from an elevated PowerShell only if you trust it.",
  },
  {
    id: "port-in-use",
    test: /address already in use|EADDRINUSE|port .* is already (allocated|in use)/i,
    title: "Port already in use",
    whatHappened: "The port your program wants is already taken by another process.",
    likelyCause: "A previous run is still active, or another app is using that port.",
    suggestedFix:
      "Find what's using the port and stop it, or run your app on a different port.",
    safeCommand: (os) =>
      os === "windows"
        ? "Get-NetTCPConnection -LocalPort 3000 | Select-Object LocalPort,OwningProcess"
        : "lsof -i :3000",
  },
  {
    id: "file-not-found",
    test: /no such file or directory|cannot find the path|FileNotFoundError/i,
    title: "File or directory not found",
    whatHappened: "The path you referenced doesn't exist.",
    likelyCause: "A typo in the path, or you're in a different folder than you expected.",
    suggestedFix:
      "Confirm the path and your current folder. List the directory to check the exact names.",
    safeCommand: (os) => (os === "windows" ? "Get-Location" : "pwd && ls -la"),
  },
  {
    id: "not-a-git-repo",
    test: /not a git repository|fatal: not a git repo/i,
    title: "Not a git repository",
    whatHappened: "You ran a git command in a folder that isn't a git repository.",
    likelyCause: "You're not inside a project that has been initialized with git.",
    suggestedFix:
      "Move into the project folder, or initialize a new repository if this is a fresh project.",
    safeCommand: () => "git init",
  },
  {
    id: "npm-not-found",
    test: /npm: command not found|'npm' is not recognized/i,
    title: "npm is not installed",
    whatHappened: "The npm package manager isn't available on your system.",
    likelyCause: "Node.js (which includes npm) isn't installed or isn't on your PATH.",
    suggestedFix: "Install Node.js from nodejs.org, then restart your terminal.",
    safeCommand: () => "node -v",
  },
  {
    id: "node-not-found",
    test: /node: command not found|'node' is not recognized/i,
    title: "Node.js is not installed",
    whatHappened: "The Node.js runtime isn't available on your system.",
    likelyCause: "Node.js isn't installed or isn't on your PATH.",
    suggestedFix: "Install Node.js from nodejs.org, then restart your terminal.",
  },
  {
    id: "python-not-found",
    test: /python: command not found|'python' is not recognized|python3: command not found/i,
    title: "Python is not installed",
    whatHappened: "The Python interpreter isn't available on your system.",
    likelyCause: "Python isn't installed, or the command name differs (python vs python3).",
    suggestedFix:
      "Install Python from python.org. On macOS/Linux try python3; on Windows try python.",
  },
  {
    id: "network-unreachable",
    test: /network is unreachable|could not resolve host|temporary failure in name resolution|getaddrinfo/i,
    title: "Network unreachable",
    whatHappened: "The command couldn't reach the network or resolve a hostname.",
    likelyCause: "You may be offline, behind a proxy, or DNS isn't resolving.",
    suggestedFix: "Check your internet connection and try again.",
    safeCommand: (os) =>
      os === "windows" ? "Test-Connection -Count 4 1.1.1.1" : "ping -c 4 1.1.1.1",
  },
  {
    id: "package-install-failed",
    test: /npm ERR!|ERESOLVE|gyp ERR!|failed to install|could not install/i,
    title: "Package install failed",
    whatHappened: "Installing dependencies failed partway through.",
    likelyCause:
      "Version conflicts, a missing build tool, or a network hiccup during download.",
    suggestedFix:
      "Read the first error line carefully. Try clearing the cache and reinstalling, or resolve the version conflict it names.",
    safeCommand: () => "npm cache verify",
  },
];

/**
 * Inspect terminal output for a known error pattern.
 * More specific patterns (e.g. "node: command not found") take precedence over
 * the generic "command not found", so we check the generic one last.
 */
const GENERIC_LAST = new Set(["command-not-found"]);

export function detectError(output: string): ErrorPattern | null {
  if (!output) return null;
  const specific = ERROR_PATTERNS.filter((p) => !GENERIC_LAST.has(p.id));
  const generic = ERROR_PATTERNS.filter((p) => GENERIC_LAST.has(p.id));
  for (const pattern of [...specific, ...generic]) {
    if (pattern.test.test(output)) return pattern;
  }
  return null;
}
