# SUBMISSION — Dead Software Library 🪦
**Path Two: Vibe-Code Something Strange**
*Prompt your way to a working app. Sanity behind it.*

Interactive cemetery for discontinued software. Leave flowers, file eulogies, watch souls decay.
Ghostwriter agent reviews every tribute; a human approves through the same state transitions.
Live at `http://localhost:3001` via `node server.js`.

---

## 1. Sanity wiring (live, verified)

| Item | Value |
|---|---|
| Project ID | `s2icbb2m` (display name: "Dead software library") |
| Dataset | `production` (public read, token write) |
| API version | `2024-01-01` |
| Token | API key from `.env` → `SANITY_API_TOKEN` (**server-side only**, never sent to the browser) |
| Content Lake | **18 `deceasedProject` + 3 `eulogy` docs** (verified via GROQ count query, 2026-10-04) |

Token was validated against `https://api.sanity.io/v2021-10-21/projects`
(which returned this project), dataset list confirmed `production`,
and every write path below was executed against the real Content Lake —
responses carry `"source": "sanity"`.

> ⚠️ **Before publishing this repo anywhere:** `.env` (real token) is gitignored
> but present in this folder. Either keep the folder private or rotate the token
> in manage.sanity.io and re-seed. Judges only need `.env.example` + their own token.

## 2. What was vibe-coded (honest build log)

Built with an AI-native IDE (OpenCode) by prompting, in this order:

1. `schemas/deceasedProject.ts` + `schemas/eulogy.ts` — content model first.
2. `sanity/decay-workflow.ts` — decay math + ghostwriter review as pure functions.
3. `sanity/SeanceDashboard.tsx` — custom Studio tool (Graveyard Radar).
4. `sanity/ghostwriter-api.example.js` — webhook handler shape.
5. `web/` frontend (data, grid, modals, workflow log).
6. `server.js` — zero-deps Node backend: static host + REST API that is
   **Sanity-first with local `db.json` fallback**.
7. `scripts/seed-sanity.js` — one-shot `createOrReplace` seed from `web/data.js`.
8. Frontend patched to sync from `/api/*` with localStorage fallback.

Every step was verified by execution (health checks, write-path tests, syntax checks) —
no step was assumed working.

## 3. How deep into Sanity (judging: "the build as much as the result")

- **Content Lake as source of truth** — `server.js` reads/writes Sanity first,
  falls back to `db.json` only on error. `/api/health` reports `backend: "sanity"`.
- **GROQ in production paths** (not just the Studio):
  - `*[_type=="deceasedProject"] | order(vitalityScore desc)` → graveyard grid
  - `*[_type=="eulogy" && project._ref=="<id>"] | order(createdAt desc)` → detail modal
  - `{"corpses": count(*[_type=="deceasedProject"]), "eulogies": count(*[_type=="eulogy"])}` → health/stats
  - `count(*[_type=="deceasedProject" && lower(name)=="<name>"])` → duplicate-burial guard
- **Schema design** (`schemas/`): required validation, max-length, option lists
  (causes of death, haunting statuses, workflow states), `initialValue`s,
  `reference` (`eulogy.project → deceasedProject`), `preview` select.
- **Mutations, not just queries**: `create` (tribute/bury), `patch`/`set`
  (vitality bump, exorcism, decay tick), `delete` (used to clean up test docs).
- **Custom Studio tool**: `sanity/SeanceDashboard.tsx` — Graveyard Radar with
  vitality colors, crack overlay < 30, one-click Flower/Exorcism patches.
- **Seed as code**: `npm run seed` → `createOrReplace` of all 21 docs. Idempotent.
- **Token hygiene**: token lives in `.env`, used only in server-side `Authorization`
  headers. The browser never sees it (verified: no token string in `web/`).

## 4. Bonus 1 — Custom app, real-time data, own interface (App SDK spirit)

`web/` + `server.js` **is** the custom app on top of the content:

- Own interface: moonlit graveyard grid, decay shaders tied to `vitalityScore`,
  search / cause filter / 4 sorts, detail modal with inline tribute box,
  add-new-software modal, live workflow log.
- Real-time data: frontend boots from `/api/corpses` + `/api/eulogies`,
  re-syncs after every mutation, and the gentle decay loop calls
  `POST /api/decay-tick` then re-renders. Stats pills recompute live.
- Not read-only: every button mutates the Content Lake (flower +5 soul,
  bury, exorcism, decay).

Honest note: this is **vanilla JS, not Next.js/Astro**. Deliberate trade —
zero dependencies means a judge runs `node server.js` with nothing to install,
and the whole Sanity integration stays readable in one file. With more time I'd
port it to Next.js + `sanity/live` (`useQuery` swap is already marked in `web/app.js:2`).

## 5. Bonus 2 — Workflows as data (agent + human through the same transitions)

`eulogy.state`: `submitted → ghostwriter_review → sanctified | rejected`

| Step | Who | What happens |
|---|---|---|
| `submitted` | visitor | tribute POSTed, logged in workflow panel |
| agent review | ghostwriter (`ghostwriterReview`) | spam/empty check → poetic inscription, or `rejected` |
| `sanctified` | human Approve (Studio button / auto in demo) | patch project `{vitalityScore: min(100,v+5), flowersLeft: f+1}`, publish eulogy |
| `rejected` | agent | spam (`http`, `buy now`, `crypto giveaway`) — nothing written |

The decay side is the same pattern on a cron: `decayTick(vitality, yearsDead)`
daily → `statusFor()` transitions `fading → ghost → haunting → peaceful_rest`.
`POST /api/decay-tick` runs it across all docs in one mutation batch.

## 6. Run it (judge steps, ~2 min)

```powershell
cd dead-software-library
node server.js
# open http://localhost:3001
```

- Health: `GET /api/health` → `{backend:"sanity", sanity:{corpses:18, eulogies:3}}`
- Reset data anytime: `node scripts/seed-sanity.js` (or `npm run seed`)
- No `npm install` needed — zero dependencies (Node 18+ for built-in `fetch`).
- Point at your own project: copy `.env.example` → `.env`, set
  `SANITY_PROJECT_ID` + `SANITY_API_TOKEN`, run seed.

## 7. Verification evidence (executed 2026-10-04, all against Sanity)

| Test | Result |
|---|---|
| `GET /api/health` | `backend:"sanity"`, `sanity:{corpses:18, eulogies:3}`, `tokenLoaded:true` |
| `POST /api/tribute` (genuine memory) | `ok:true, state:"sanctified", source:"sanity"` — Flash `vitalityScore 22→27`, `flowersLeft 128→129` |
| `POST /api/tribute` (spam: `buy now http://spam`) | `ok:false, reason:"spam", state:"rejected"` — nothing written |
| `POST /api/bury` (E2E TestOS) | `ok:true, source:"sanity"`, soul 100 |
| `GET /api/eulogies?project=<new id>` | 1 gravedigger eulogy, normalized `{project:"<id>"}` shape |
| `POST /api/exorcise` (test doc) | `ok:true, source:"sanity"` |
| `POST /api/decay-tick` | `ok:true, source:"sanity", corpses:19, patched:18` |
| `GET /` static | `200` |
| Cleanup | test docs deleted via `mutate/delete`, dataset re-seeded → `18 / 3` canonical |
| Syntax | `node --check server.js`, `seed-sanity.js`, `sanity.client.js` loads OK |

## 8. File map

| File | Role |
|---|---|
| `schemas/deceasedProject.ts`, `schemas/eulogy.ts` | Content model (Studio-ready) |
| `sanity/decay-workflow.ts` | Workflow pure logic (review, decay, approve patch) |
| `sanity/SeanceDashboard.tsx` | Custom Studio tool |
| `sanity/ghostwriter-api.example.js` | Webhook handler shape (`eulogy.create → POST`) |
| `sanity/sanity.client.js` | Server-side Sanity client (zero deps) |
| `server.js` | Backend: Sanity-first REST + static host + .env loader |
| `scripts/seed-sanity.js` | Idempotent Content Lake seed |
| `web/` | Custom graveyard app (real-time, read-write) |
| `.env` / `.env.example` / `.gitignore` | Token config (gitignored) / template / ignores |
| `db.json` | Local fallback only (gitignored) |

## 9. With more time

1. Next.js port with `sanity/live` + published Studio (`sanity deploy`).
2. Real Sanity Workflows dashboard wired to `eulogy.state` + scheduled decay Function.
3. Authenticated mourners + rate limiting on tribute endpoint.
4. GIF/og-image generator per gravestone (fits the "turn videos into gifs" spirit).
