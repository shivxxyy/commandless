import type { OsType } from "@/lib/types";
import type { BuiltCommand, Recipe, RecipeContext } from "./types";

const isWin = (os: OsType) => os === "windows";

/** Build helper that returns a platform-branched command. */
function platform(
  os: OsType,
  unix: string,
  windows: string,
): BuiltCommand {
  return { command: isWin(os) ? windows : unix, os };
}

/** Quote a path safely for the target shell. */
function q(path: string, os: OsType): string {
  if (!path) return os === "windows" ? "." : ".";
  // Wrap in double quotes; escape existing double quotes minimally.
  const escaped = path.replace(/"/g, '\\"');
  return `"${escaped}"`;
}

export const RECIPES: Recipe[] = [
  // ---------------- Files ----------------
  {
    id: "list-files",
    title: "List files",
    examples: ["list files", "show files", "what's in this folder", "ls", "dir"],
    keywords: ["list", "files", "ls", "dir", "directory contents"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "files",
    explanation: "Lists the files and folders in the current directory.",
    preview: "List everything in the current folder.",
    build: ({ os }) => platform(os, "ls -lah", "Get-ChildItem"),
  },
  {
    id: "show-hidden",
    title: "Show hidden files",
    examples: ["show hidden files", "list hidden files", "see dotfiles"],
    keywords: ["hidden", "dotfiles", "show all"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "files",
    explanation: "Lists all files including hidden ones (names starting with a dot).",
    preview: "Reveal hidden files in the current folder.",
    build: ({ os }) =>
      platform(os, "ls -lah", "Get-ChildItem -Force"),
  },
  {
    id: "find-large-files",
    title: "Find large files",
    examples: [
      "find large files",
      "find the largest files in this folder",
      "what is taking up space here",
      "biggest files",
    ],
    keywords: ["large", "largest", "big", "biggest", "size", "space"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "files",
    explanation:
      "Finds the largest files in the current folder and its subfolders, sorted by size.",
    preview: "Show the largest files under the current folder.",
    build: ({ os }) =>
      platform(
        os,
        "find . -type f -exec du -h {} + | sort -rh | head -n 20",
        "Get-ChildItem -Recurse -File | Sort-Object Length -Descending | Select-Object -First 20 Name,@{Name='SizeMB';Expression={[math]::Round($_.Length/1MB,2)}}",
      ),
  },
  {
    id: "count-files",
    title: "Count files",
    examples: ["count files", "how many files", "number of files here"],
    keywords: ["count", "how many", "number of files"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "files",
    explanation: "Counts how many files are in the current folder and below.",
    preview: "Count the files under the current folder.",
    build: ({ os }) =>
      platform(
        os,
        "find . -type f | wc -l",
        "(Get-ChildItem -Recurse -File | Measure-Object).Count",
      ),
  },
  {
    id: "compress-folder",
    title: "Compress this folder",
    examples: [
      "compress this folder",
      "create a zip of this folder",
      "zip this directory",
      "make an archive",
    ],
    keywords: ["compress", "zip", "archive", "tar"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [
      {
        id: "name",
        label: "Archive name",
        placeholder: "archive.zip",
        required: false,
        defaultValue: "archive.zip",
      },
    ],
    risk: "medium",
    category: "files",
    explanation:
      "Creates a compressed zip archive of the current folder's contents.",
    preview: "Create a zip archive of the current folder.",
    build: ({ os, inputs }) => {
      const name = inputs.name?.trim() || "archive.zip";
      return platform(
        os,
        `zip -r ${q(name, os)} .`,
        `Compress-Archive -Path * -DestinationPath ${q(name, os)}`,
      );
    },
  },
  {
    id: "search-text",
    title: "Search text in files",
    examples: [
      "search for TODO in this project",
      "find text in files",
      "grep for a word",
      "search TODO",
    ],
    keywords: ["search", "grep", "find text", "todo", "contains"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [
      {
        id: "query",
        label: "Text to search for",
        placeholder: "TODO",
        required: true,
      },
    ],
    risk: "safe",
    category: "files",
    explanation:
      "Searches the current project for files containing the given text and shows where it appears.",
    preview: "Search the project for a word or phrase.",
    build: ({ os, inputs }) => {
      const query = inputs.query?.trim() || "TODO";
      return platform(
        os,
        `grep -rni ${q(query, os)} .`,
        `Get-ChildItem -Recurse -File | Select-String -Pattern ${q(query, os)}`,
      );
    },
  },
  {
    id: "create-folder",
    title: "Create a folder",
    examples: ["create folder", "make a directory", "new folder", "mkdir"],
    keywords: ["create folder", "make directory", "mkdir", "new folder"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [
      {
        id: "name",
        label: "Folder name",
        placeholder: "new-folder",
        required: true,
      },
    ],
    risk: "medium",
    category: "files",
    explanation: "Creates a new folder in the current directory.",
    preview: "Create a new folder here.",
    build: ({ os, inputs }) => {
      const name = inputs.name?.trim() || "new-folder";
      return platform(os, `mkdir -p ${q(name, os)}`, `New-Item -ItemType Directory -Force -Path ${q(name, os)}`);
    },
  },
  {
    id: "show-path",
    title: "Show current path",
    examples: ["show current path", "where am i", "print working directory", "pwd"],
    keywords: ["path", "pwd", "where am i", "current directory"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "files",
    explanation: "Prints the full path of the current working directory.",
    preview: "Show the current folder path.",
    build: ({ os }) => platform(os, "pwd", "Get-Location"),
  },

  // ---------------- System ----------------
  {
    id: "disk-usage",
    title: "Show disk usage",
    examples: ["show disk usage", "how much disk space", "disk free", "df"],
    keywords: ["disk", "space", "storage", "df", "usage"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "system",
    explanation: "Shows how much disk space is used and free on your drives.",
    preview: "Show disk space usage.",
    build: ({ os }) =>
      platform(
        os,
        "df -h",
        "Get-PSDrive -PSProvider FileSystem | Select-Object Name,@{n='UsedGB';e={[math]::Round($_.Used/1GB,1)}},@{n='FreeGB';e={[math]::Round($_.Free/1GB,1)}}",
      ),
  },
  {
    id: "memory-usage",
    title: "Show memory usage",
    examples: ["show memory usage", "how much ram", "memory free"],
    keywords: ["memory", "ram", "free memory"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "system",
    explanation: "Shows current memory (RAM) usage.",
    preview: "Show memory usage.",
    build: ({ os }) =>
      platform(
        os,
        "vm_stat",
        "Get-CimInstance Win32_OperatingSystem | Select-Object @{n='TotalGB';e={[math]::Round($_.TotalVisibleMemorySize/1MB,1)}},@{n='FreeGB';e={[math]::Round($_.FreePhysicalMemory/1MB,1)}}",
      ),
  },
  {
    id: "running-processes",
    title: "Show running processes",
    examples: ["list running processes", "show processes", "what's running", "ps"],
    keywords: ["processes", "running", "ps", "tasks"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "system",
    explanation: "Lists the processes currently running, with their resource use.",
    preview: "List running processes.",
    build: ({ os }) =>
      platform(
        os,
        "ps aux | head -n 30",
        "Get-Process | Sort-Object CPU -Descending | Select-Object -First 30 Name,Id,CPU",
      ),
  },
  {
    id: "network-check",
    title: "Check internet connection",
    examples: ["check my internet connection", "am i online", "ping test", "check network connectivity"],
    keywords: ["internet", "network", "connection", "ping", "online", "connectivity"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "system",
    explanation: "Sends a few test pings to a public server to check connectivity.",
    preview: "Check whether you are online.",
    build: ({ os }) =>
      platform(os, "ping -c 4 1.1.1.1", "Test-Connection -Count 4 1.1.1.1"),
  },
  {
    id: "ip-address",
    title: "Show IP address",
    examples: ["show my ip address", "what is my ip", "network address"],
    keywords: ["ip", "address", "ipconfig", "ifconfig"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "system",
    explanation: "Shows your machine's local network IP addresses.",
    preview: "Show your local IP address.",
    build: ({ os }) =>
      platform(
        os,
        "ifconfig | grep 'inet ' | grep -v 127.0.0.1",
        "Get-NetIPAddress -AddressFamily IPv4 | Select-Object IPAddress,InterfaceAlias",
      ),
  },
  {
    id: "clear-terminal",
    title: "Clear terminal",
    examples: ["clear terminal", "clear screen", "cls", "clear"],
    keywords: ["clear", "cls", "clean screen"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "system",
    explanation: "Clears the terminal screen.",
    preview: "Clear the terminal screen.",
    build: ({ os }) => platform(os, "clear", "Clear-Host"),
  },

  // ---------------- Developer ----------------
  {
    id: "git-status",
    title: "Show git changes",
    examples: ["show my git changes", "git status", "what changed", "uncommitted changes"],
    keywords: ["git status", "git changes", "uncommitted", "what changed"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "developer",
    explanation: "Shows which files have changed in the current git repository.",
    preview: "Show your current git changes.",
    build: ({ os }) => platform(os, "git status", "git status"),
  },
  {
    id: "git-diff",
    title: "Show git diff",
    examples: ["git diff", "show diff", "what did i change"],
    keywords: ["diff", "git diff", "changes detail"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "developer",
    explanation: "Shows the line-by-line changes you've made since the last commit.",
    preview: "Show line-level git changes.",
    build: ({ os }) => platform(os, "git diff", "git diff"),
  },
  {
    id: "git-log",
    title: "Show git history",
    examples: ["git log", "show commits", "commit history"],
    keywords: ["git log", "commits", "history"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "developer",
    explanation: "Shows recent commits in a compact one-line-per-commit view.",
    preview: "Show recent git commits.",
    build: ({ os }) =>
      platform(os, "git log --oneline -n 20 --graph", "git log --oneline -n 20 --graph"),
  },
  {
    id: "node-version",
    title: "Check Node version",
    examples: ["check node version", "what node do i have", "node -v"],
    keywords: ["node version", "node", "nodejs"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "developer",
    explanation: "Prints the installed Node.js version.",
    preview: "Check the installed Node.js version.",
    build: ({ os }) => platform(os, "node -v", "node -v"),
  },
  {
    id: "python-version",
    title: "Check Python version",
    examples: ["check python version", "what python do i have", "python --version"],
    keywords: ["python version", "python", "py"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "safe",
    category: "developer",
    explanation: "Prints the installed Python version.",
    preview: "Check the installed Python version.",
    build: ({ os }) =>
      platform(os, "python3 --version", "python --version"),
  },
  {
    id: "install-deps",
    title: "Install dependencies",
    examples: ["install dependencies", "npm install", "install packages", "set up this project"],
    keywords: ["install dependencies", "npm install", "deps", "packages"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "medium",
    category: "developer",
    explanation:
      "Installs the project's dependencies. Run this in a folder that has a package.json.",
    preview: "Install project dependencies (npm install).",
    build: ({ os }) => platform(os, "npm install", "npm install"),
  },
  {
    id: "run-dev",
    title: "Run this project",
    examples: ["run this project", "start dev server", "npm run dev", "run the app"],
    keywords: ["run project", "dev server", "npm run dev", "start"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [],
    risk: "medium",
    category: "developer",
    explanation:
      "Runs the project's dev script. Run this in a folder that has a package.json with a \"dev\" script.",
    preview: "Run the project's dev script (npm run dev).",
    build: ({ os }) => platform(os, "npm run dev", "npm run dev"),
  },
  {
    id: "find-port",
    title: "Find process using a port",
    examples: ["what is using port 3000", "find process on port", "who owns port 5173"],
    keywords: ["port", "using port", "what is using", "lsof port"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [
      {
        id: "port",
        label: "Port number",
        placeholder: "3000",
        required: true,
        defaultValue: "3000",
      },
    ],
    risk: "safe",
    category: "developer",
    explanation:
      "Finds which process is listening on the given port so you can decide what to do.",
    preview: "Find the process using a given port.",
    build: ({ os, inputs }) => {
      const port = (inputs.port ?? "3000").replace(/\D/g, "") || "3000";
      return platform(
        os,
        `lsof -i :${port}`,
        `Get-NetTCPConnection -LocalPort ${port} | Select-Object -Property LocalAddress,LocalPort,OwningProcess`,
      );
    },
  },
  {
    id: "kill-port",
    title: "Kill process using a port",
    examples: ["kill the process using port 5173", "free up port 3000", "stop whatever is on port"],
    keywords: ["kill port", "free port", "stop port", "kill process on port"],
    supportedOs: ["macos", "windows", "linux"],
    inputs: [
      {
        id: "port",
        label: "Port number",
        placeholder: "5173",
        required: true,
        defaultValue: "5173",
      },
    ],
    risk: "dangerous",
    category: "developer",
    explanation:
      "Terminates the process listening on the given port. This stops a running program, so it requires explicit confirmation.",
    preview: "Kill the process using a given port (requires confirmation).",
    build: ({ os, inputs }) => {
      const port = (inputs.port ?? "5173").replace(/\D/g, "") || "5173";
      return platform(
        os,
        `lsof -ti :${port} | xargs kill -9`,
        `Get-NetTCPConnection -LocalPort ${port} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`,
      );
    },
  },
];

export const RECIPES_BY_ID: Record<string, Recipe> = Object.fromEntries(
  RECIPES.map((r) => [r.id, r]),
);

export function buildRecipe(recipe: Recipe, ctx: RecipeContext): BuiltCommand {
  if (!recipe.supportedOs.includes(ctx.os) && ctx.os !== "cross-platform") {
    return {
      command: "",
      os: ctx.os,
      unsupportedMessage: `“${recipe.title}” is not supported on ${ctx.os} yet.`,
    };
  }
  return recipe.build(ctx);
}
