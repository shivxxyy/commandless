# CommandLess AI proxy

A tiny, dependency-free Node server (built-in `http` + `fetch`, Node 18+) that
holds your **Ollama Cloud** API key server-side and exposes the contract the
CommandLess desktop app expects. The key never reaches the app or the repo.

## Setup

```bash
# 1. Add your key (this file is gitignored)
cp server/.env.example server/.env
#    then edit server/.env and set OLLAMA_API_KEY=... and OLLAMA_MODEL=...

# 2. Start the proxy
npm run proxy
#    -> listening on http://localhost:8787
```

The app's `.env` already points at it:

```
VITE_AI_PROXY_URL=http://localhost:8787/api/ai
```

So the full local dev loop is two processes:

```bash
npm run proxy       # terminal 1 — holds the key, talks to Ollama Cloud
npm run tauri:dev   # terminal 2 — the desktop app
```

In the app, make sure the AI provider is **Cloud AI through CommandLess proxy**
(Settings → AI provider), then type an intent that has no built-in recipe — it
will be sent to the proxy, which calls Ollama Cloud and returns a structured
command. The local risk engine still re-checks every command.

## Endpoints

| Method | Path              | Body                          | Returns                          |
| ------ | ----------------- | ----------------------------- | -------------------------------- |
| GET    | `/health`         | —                             | `{ ok, model, hasKey }`          |
| POST   | `/api/ai/command` | `{ system, intent, context }` | `{ text }` (model JSON string)   |
| POST   | `/api/ai/explain` | `{ output, context }`         | `{ title, whatHappened, ... }`   |

## Config (server/.env)

| Variable          | Default              | Notes                                   |
| ----------------- | -------------------- | --------------------------------------- |
| `OLLAMA_API_KEY`  | —                    | **Required.** Your Ollama Cloud key.    |
| `OLLAMA_HOST`     | `https://ollama.com` | Ollama Cloud endpoint.                  |
| `OLLAMA_MODEL`    | `gpt-oss:120b`       | Any cloud model your account can use.   |
| `PORT`            | `8787`               | Proxy listen port.                      |
| `ALLOWED_ORIGIN`  | `*`                  | CORS origin; `*` is fine for local dev. |

## Deploying

For a shipped app, host this on any Node platform (Fly, Render, a VM, a Lambda
behind an HTTP endpoint, etc.), set the env vars there, and point the app's
`VITE_AI_PROXY_URL` at the deployed URL. Lock `ALLOWED_ORIGIN` down in production.
