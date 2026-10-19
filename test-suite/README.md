# Kaalvanta Test Suite

Live black-box test suite for Kaalvanta. It is its own app: a small web
cockpit backed by SQLite that runs checks, journeys and webhook replays
against the real system and records every run.

## Quickstart

```powershell
cd test-suite
npm install        # only dependency: mongodb (for the journey + db-audit)
copy .env.example .env
npm start          # → http://127.0.0.1:4760
```

No web framework — it uses Node's built-in HTTP server and `node:sqlite`.
Requires Node >= 22.5.

> The specs themselves live in the app repo (`../e2e/*.spec.ts`) and need
> Playwright to execute: `npm i -D @playwright/test` in the app root.

## What's inside

| Path | What it is |
|---|---|
| `server/index.mjs` | The web app: static UI + `/api/checks`, `/api/run`, `/api/state`, `/api/history`, `/api/stats` |
| `server/checks.mjs` | The check catalog — billing webhook replays + journey + auto-discovered UI specs |
| `server/db.mjs` | SQLite history store (`data/test-suite.db`) |
| `public/` | The cockpit UI (index.html + styles.css + app.js) |
| `scripts/` | Standalone engines: `db-audit`, `api-probe`, `webhook-replay`, `journey`, `playwright-run` |
| `fixtures/` | Razorpay webhook payloads (tagged test identities) |
| `data/` | SQLite file — run history (gitignored) |

## Checks

Browser tests are **auto-discovered**: every Playwright `*.spec.ts` in the
app's `e2e/` folder (`TARGET_DIR` in `.env`, default `..`) becomes its own
cockpit row, executed through `scripts/playwright-run.mjs` and reported with
evidence and DB-backed history. Add a spec in the app, restart the suite —
no editing here.

Static rows in `server/checks.mjs` cover the billing surface, which is not a
browser flow:

| Check | What it proves |
|---|---|
| `billing-env` | The four billing env keys are present |
| `webhook-charged` | A signed `subscription.charged` returns 200 |
| `webhook-cancelled` | A signed `subscription.cancelled` returns 200 |
| `webhook-bad-signature` | An invalid signature returns 400 |
| `webhook-unknown` | An unknown subscription id returns 200 and does not crash |
| `journey-billing` | Arrange a user + PENDING sub → deliver the webhook → assert ACTIVE + plan upgrade → clean up |

### Dev / Live modes

The cockpit has a **Dev | Live** toggle. `Dev` runs the spec against the
locally running app (`UI_DEV_URL`, default http://localhost:3000, using the
app's own `.env` credentials). `Live` runs the same spec against the deployed
endpoint (`UI_LIVE_URL`) using `UI_LIVE_ADMIN_EMAIL` / `UI_LIVE_ADMIN_PASSWORD`
from `.env` — until those are filled, live runs fail with that exact message.
The active mode is printed as the first evidence line of every run.

Cockpit runs force `E2E_MEDIA=on`: every run records video, screenshots and a
trace, and each row's evidence links them (`open video` / `open trace` …)
served through `/api/artifact` — restricted to the app's `test-results/`
folder. Old runs accumulate there; delete the folder to reclaim disk.

## Environment (`.env`)

| Key | Used for |
|---|---|
| `DATABASE_URL` | The app's Mongo database (journey arrange/cleanup + db-audit) |
| `TARGET_URL` | The app's Razorpay webhook endpoint |
| `RAZORPAY_WEBHOOK_SECRET` | Signing replays — must match the app's secret |
| `RAZORPAY_TEST_SUBSCRIPTION_ID` | The subscription webhook replays target |
| `UI_DEV_URL` / `UI_LIVE_URL` | The two browser-test targets |
| `UI_LIVE_ADMIN_EMAIL` / `UI_LIVE_ADMIN_PASSWORD` | Credentials for live mode |
| `TARGET_DIR` | The app under test (default `..`) |

Copy `.env.example` and fill in. Never commit `.env`.

## Adding a check

1. Add an entry to `server/checks.mjs` (id, group, label, desc, and either
   `args` for a script or a `special` handler).
2. Restart the server. It appears in the UI with run button, evidence and
   history automatically.

For browser coverage you usually do **not** touch this file — just add a
Playwright spec under `../e2e/`.

## The specs

The app-side specs (auto-discovered) live in `../e2e/`:

| Spec | Locks in |
|---|---|
| `01-public.spec.ts` | Public routes render for anonymous visitors |
| `02-auth.spec.ts` | Login form, invalid credentials, suspended accounts |
| `03-rbac.spec.ts` | Members cannot reach `/admin` or `/studio`; admins can |
| `04-publishing.spec.ts` | Analyst composes → publishes → appears in the public feed |
| `05-paywall.spec.ts` | Premium bodies are locked for non-premium viewers |
| `06-api-guards.spec.ts` | tRPC guards: 401 unauthenticated, 403 wrong role |

They are written, not wired into CI yet. Run them with:

```bash
npx playwright test            # in the app root
```
