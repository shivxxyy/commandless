# CommandLess

**Terminal power. No command memorization.**

CommandLess is a modern, AI-assisted desktop terminal for both everyday users and
developers. Type commands normally, or describe what you want in plain English —
CommandLess proposes a command, explains what it does, shows the risk, and asks
before running. The terminal output is real (a true PTY), but every action also
becomes a readable card. If a command fails, CommandLess explains the likely
reason and suggests a fix.

> CommandLess reduces memorization, but never hides what will run.

Built with **Tauri v2** (Rust + a real PTY), **React + TypeScript**, **Vite**,
**Tailwind CSS**, **Framer Motion**, and **xterm.js**. No Electron. No fake
terminal.

---

## Features

- **Real terminal** — true PTY sessions via `portable-pty`, one per tab. zsh/bash
  on macOS, PowerShell on Windows. Resize, copy/paste, multiple tabs, rename,
  per-tab working directory.
- **Intent mode** — describe a task in plain English in the right-hand
  intelligence panel. CommandLess matches a built-in recipe first, then falls
  back to AI (if enabled).
- **Recipe engine** — 25+ deterministic recipes (files, system, developer) that
  work with **no AI at all**, with correct macOS and Windows variants.
- **Risk engine** — a local classifier inspects every command (including
  AI-suggested ones) and labels it Safe / Medium risk / Dangerous. Dangerous
  commands require typing a confirmation phrase before they can run.
- **Command cards** — intent, command, risk badge, explanation, OS, timestamp,
  status, duration, and expandable output. Run / Copy / Edit / Explain / Save.
- **Error explainer** — pattern-based detection of common failures (command not
  found, permission denied, port in use, not a git repo, missing node/npm/python,
  network errors, install failures) with plain-English fixes. Optional
  "Ask AI to explain this error".
- **Command palette** — `⌘K` / `Ctrl K`. Search recipes, run quick actions,
  toggle panels, open settings.
- **Polished onboarding**, themeable settings, toasts, keyboard shortcuts, and a
  calm, premium dark UI with glassmorphism and soft neon gradients.

---

## Tech stack

| Layer        | Choice                                            |
| ------------ | ------------------------------------------------- |
| Shell        | Tauri v2 (Rust)                                   |
| PTY          | `portable-pty` (real pseudo-terminal)             |
| Frontend     | React 18 + TypeScript + Vite                      |
| Styling      | Tailwind CSS, custom glass components             |
| Animation    | Framer Motion                                     |
| Terminal     | xterm.js (`@xterm/xterm` + fit + web-links)       |
| State        | Zustand                                           |
| Async        | TanStack Query                                    |
| Icons        | Lucide React                                      |

---

## Prerequisites

- **Node.js** 18+ and npm
- **Rust** (stable) + Cargo — install via [rustup](https://rustup.rs)
- Platform tooling for Tauri v2:
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Windows:** Microsoft C++ Build Tools and WebView2 (preinstalled on Win 11)

See the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) for
details.

---

## Setup

```bash
# 1. Install frontend dependencies
npm install

# 2. Create your env file (optional — only needed for the proxy/Ollama providers)
cp .env.example .env
# then edit VITE_AI_PROXY_URL to point at your backend
```

---

## Development

Run the full desktop app (Rust backend + Vite frontend with a real PTY):

```bash
npm run tauri:dev
```

Run only the web frontend (fast UI iteration, **no real shell** — the terminal
shows a clearly-labeled preview mode; recipes, risk labels, and cards all work):

```bash
npm run dev          # http://localhost:1420
```

Other scripts:

```bash
npm run typecheck    # tsc --noEmit
npm test             # vitest — recipe, risk, AI-parse, and error tests
npm run build        # typecheck + production web build
```

---

## Building

### macOS

```bash
npm run tauri:build
```

Produces a `.app` and `.dmg` under `src-tauri/target/release/bundle/`.

### Windows

```bash
npm run tauri:build
```

Produces an `.msi` / `.exe` installer under
`src-tauri/target/release/bundle/`.

> App icons are generated into `src-tauri/icons`. To regenerate from a source
> image: `npx @tauri-apps/cli icon path/to/icon.png`.

### Distributing to others

To publish downloadable installers (macOS + Windows) and host the AI proxy so
downloads work out of the box, see **[DEPLOYMENT.md](DEPLOYMENT.md)**. In short:
deploy the proxy (Vercel functions in `api/`, or Docker/`render.yaml`), set
`VITE_AI_PROXY_URL` + `VITE_APP_TOKEN` as GitHub Actions secrets, then push a
`v*` tag — CI builds both installers and publishes a GitHub Release.

---

## AI provider architecture (no hardcoded secrets)

CommandLess **never** stores a real AI API key in the desktop app. The AI layer is
a swappable provider interface (`src/lib/ai/`):

```
src/lib/ai/types.ts                     # AiProvider interface + system prompt
src/lib/ai/parse.ts                     # robust JSON parsing + fallback
src/lib/ai/providers/proxyProvider.ts   # default: calls YOUR backend
src/lib/ai/providers/localOllamaProvider.ts  # optional: local Ollama
```

Three modes, chosen in onboarding or Settings:

1. **Built-in recipes only** (`none`) — fully offline, no AI. The app is useful
   on its own.
2. **Cloud AI through CommandLess proxy** (`proxy`, default) — the app calls your
   backend, which holds the Ollama Cloud (or other) API key server-side:

   ```
   POST {VITE_AI_PROXY_URL}/command   -> { text } | structured JSON
   POST {VITE_AI_PROXY_URL}/explain   -> { text }
   ```

3. **Local Ollama** (`local-ollama`) — talks to `http://localhost:11434`. No key.

The AI is asked to return strict JSON only:

```json
{
  "intent": "string",
  "command": "string",
  "explanation": "string",
  "riskLevel": "safe|medium|dangerous",
  "riskReason": "string",
  "requiresConfirmation": true,
  "os": "macos|windows|linux|cross-platform",
  "expectedOutcome": "string",
  "alternatives": [{ "label": "string", "command": "string", "reason": "string" }]
}
```

The parser tolerates markdown fences, surrounding prose, and unknown risk values
(coerced to a cautious default). **Whatever the AI returns, the local risk engine
re-checks the command and can only raise the risk, never lower it.**

`.env.example`:

```
VITE_AI_PROXY_URL=https://your-domain.com/api/ai
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.1
```

---

## Architecture notes

```
src/
  App.tsx                     # host detection, theme, onboarding gate
  main.tsx                    # React + TanStack Query root
  components/
    layout/                   # AppShell, Sidebar, TerminalWorkspace, IntelligencePanel
    terminal/                 # TerminalView (xterm + PTY), TerminalTabs, TerminalToolbar
    command/                  # CommandInput, CommandCard, RiskBadge, ActionHistory,
                              #   ErrorInsightCard, CommandPalette, RecipeInputs
    onboarding/               # OnboardingFlow (5 steps)
    settings/                 # SettingsView
    ui/                       # Button, IconButton, Modal, Skeleton, Toasts, ShortcutsHelp
  lib/
    ai/                       # provider layer + JSON parsing
    recipes/                  # recipe types, data, matcher, builder
    risk/                     # deterministic risk classifier
    errors/                   # pattern-based error explainer
    terminal/                 # PTY client (Tauri invoke/events), host info, registry
    storage/                  # localStorage-backed persistence
    utils/                    # cn(), formatting
  hooks/                      # useSuggest, useCommandRunner, useKeyboardShortcuts
  stores/                     # Zustand: settings, ui, terminal, history, toast

src-tauri/
  src/pty.rs                  # PTY sessions: create / write / resize / close, output streaming
  src/sys.rs                  # OS info, default shell, home dir
  src/lib.rs                  # Tauri builder + command registration
  capabilities/default.json   # Tauri v2 permissions
```

**Flow of an intent:** user types intent → `useSuggest` tries a recipe
(`matchRecipes`) → if none and AI is enabled, calls the provider → result becomes
a `CommandSuggestion` → the risk engine re-checks it → a `CommandCard` is shown →
on Run, `useCommandRunner` writes the command to the active PTY and records an
`ActionCard`. Terminal output is streamed back over Tauri events and scanned for
error patterns.

**Persistence:** settings, onboarding completion, command history, saved recipes,
recent folders, and layout preferences are stored in the webview's localStorage
(persists inside the Tauri window).

---

## Safety notes

- Every AI-suggested command is shown before it runs — nothing auto-executes.
- The local risk engine is independent of the AI and always runs. It classifies
  `rm -rf`, `sudo`, `chmod -R`, `chown -R`, `dd`, `mkfs`, `format`, `del`,
  `kill`/`taskkill`, piping remote scripts into a shell, and writes to system
  directories as **Dangerous**.
- Dangerous commands cannot run until the user types `RUN DANGEROUS COMMAND`.
  (This is the literal phrase the user types — not UI styling.)
- When the AI and the local engine disagree, the more cautious level wins.
- The AI system prompt forbids destructive suggestions and asks for clarification
  instead of inventing a dangerous command.

---

## Testing

```bash
npm test
```

Covers: recipe matching, OS-specific command generation, risk classification, the
AI JSON parser (including markdown/garbage fallback), and error-pattern matching.

---

## Known limitations

- The terminal requires the desktop app for a real shell. `npm run dev` in a plain
  browser shows a labeled **preview mode** (recipes, risk, and cards still work).
- History persists command *metadata* and on-demand output, not full raw terminal
  logs.
- Error detection in live terminal output is pattern-based and chunk-based; very
  long error messages split across PTY reads may occasionally be missed until the
  next chunk.
- Cross-platform commands are best-effort. Where a reliable equivalent doesn't
  exist, a recipe is marked platform-specific.
- The proxy backend is **not** included — CommandLess ships the client; you host
  the endpoint that holds your API key.

---

## Brand & UI conventions

- The product name is always **CommandLess** (never all-caps, never lowercase).
- The UI uses natural sentence/title casing. No `text-transform: uppercase`, no
  wide letter spacing, no all-caps micro-labels.
- Risk copy: Safe — "Read-only or low-impact." · Medium risk — "Changes files,
  installs packages, or modifies project state." · Dangerous — "Can delete,
  overwrite, kill processes, or change system settings."
