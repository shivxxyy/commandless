# Deploying CommandLess

CommandLess ships in two halves that go live together:

1. **The AI proxy** (`server/`) — a tiny Node service that holds your Ollama
   Cloud key and is hosted publicly so downloaded apps can reach it.
2. **The desktop app** — built into macOS + Windows installers by GitHub
   Actions and published to GitHub Releases for anyone to download.

The app is built with `VITE_AI_PROXY_URL` pointing at your deployed proxy, so
order matters: **deploy the proxy first, then cut a release.**

---

## 0. Put the code on GitHub

```bash
gh auth login                       # one-time
gh repo create commandless --public --source=. --remote=origin --push
# or: create a repo in the UI, then `git remote add origin … && git push -u origin main`
```

The repo already contains `render.yaml` (proxy) and
`.github/workflows/release.yml` (installers).

---

## 1. Deploy the proxy (Render — free tier)

The proxy is a Docker service. `render.yaml` is a ready Blueprint.

1. Go to <https://render.com> → **New → Blueprint** → pick your repo.
2. Render reads `render.yaml` and creates the `commandless-proxy` service.
3. Set the two secret env vars (marked `sync:false`, so not in the repo):
   - `OLLAMA_API_KEY` — your Ollama Cloud key.
   - `APP_TOKEN` — any random string (e.g. `openssl rand -hex 16`). The app
     must send the same value; you'll set it as `VITE_APP_TOKEN` below.
4. Deploy. You'll get a URL like `https://commandless-proxy.onrender.com`.
5. Verify: open `https://<your-url>/health` → `{"ok":true,"hasKey":true}`.

> The same `server/Dockerfile` works on Fly.io (`fly launch`), Railway, a VM,
> etc. Any host that runs the container and lets you set env vars is fine.
> On Render's free tier the service sleeps when idle and cold-starts on the
> first request (a few seconds) — fine for a demo; upgrade for always-on.

**Cost/abuse guards** (already built in, tune via env vars):
`RATE_PER_MIN` (per-IP/min, default 15), `DAILY_CAP` (global model calls/day,
default 1500), and the `APP_TOKEN` gate. Your key never leaves the server.

---

## 2. Configure release secrets

In the GitHub repo → **Settings → Secrets and variables → Actions → New
repository secret**, add:

| Secret              | Value                                             |
| ------------------- | ------------------------------------------------- |
| `VITE_AI_PROXY_URL` | `https://<your-proxy-url>/api/ai`                 |
| `VITE_APP_TOKEN`    | the same random string you set as `APP_TOKEN`     |
| `VITE_POSTHOG_KEY`  | your PostHog project key (optional — see below)   |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` (or `eu`) (optional)   |

`GITHUB_TOKEN` is provided automatically.

---

## 3. Cut a release (builds the installers)

```bash
git tag v0.1.0
git push origin v0.1.0
```

This triggers `.github/workflows/release.yml`, which builds on macOS + Windows
runners and publishes a **draft** GitHub Release with:

- `CommandLess_0.1.0_universal.dmg` (macOS, Apple Silicon + Intel)
- `CommandLess_0.1.0_x64-setup.exe` / `.msi` (Windows)

Open the release, review, and **Publish**. Your download links are the asset
URLs on that release (perfect for the LinkedIn post).

---

## 4. What downloaders experience

Because the builds are **unsigned** (no paid signing certs yet):

- **macOS:** first launch → right-click the app → **Open** → **Open** (bypasses
  Gatekeeper once). Subsequent launches are normal.
- **Windows:** SmartScreen → **More info → Run anyway**.

AI works out of the box (it calls your hosted proxy). The terminal, recipes,
risk engine, and error explainer work regardless.

---

## Analytics (who's using it, what they ask, from where)

Three sources cover it:

- **Downloads:** `npm run downloads <owner>/<repo>` prints per-asset and total
  download counts from the GitHub Releases API. (Use `GITHUB_TOKEN=…` for a
  higher rate limit.)
- **Product usage:** [PostHog](https://posthog.com) (free tier). Create a
  project, copy the **Project API key**, and set `VITE_POSTHOG_KEY` (+
  `VITE_POSTHOG_HOST`) as release secrets. The app then reports, per anonymous
  install id:
  - `app_opened`, `onboarding_completed`
  - `intent_submitted` — **includes the prompt text** the user typed
  - `command_resolved` (recipe vs AI, risk level), `command_run`
  - `error_detected` (which error pattern)
  - PostHog adds **geo (country/city)** from IP and gives you unique users,
    DAU/retention, and funnels out of the box.
- **AI request volume/timing:** also visible in the proxy logs (`[req]`/`[ok]`).

Notes:
- The PostHog project key is a client-side ingestion key — safe to ship.
- Users can opt out via **Settings → Share anonymous usage analytics** (on by
  default). Terminal output is never sent to analytics; only prompt text +
  metadata.
- Leave `VITE_POSTHOG_KEY` unset to ship with analytics fully disabled.

## Upgrading later

- **Signed/notarized builds** (no warnings): get an Apple Developer account
  ($99/yr) + a Windows code-signing cert, then add the signing secrets and the
  notarization step to the workflow.
- **Auto-update:** Tauri's updater plugin can push updates from GitHub Releases.
- **Scale/limits:** move the proxy off the free tier and tighten
  `RATE_PER_MIN` / `DAILY_CAP`, or switch to per-user keys if usage grows.
