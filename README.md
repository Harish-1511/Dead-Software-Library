# Dead Software Library 🪦

Interactive cemetery for deceased software. Dark pixel-art graveyard grid, decay shaders
tied to `vitalityScore`, real-time flowers/eulogies.

**Sanity Challenge — Path Two: Vibe-Code Something Strange.** Full writeup: [`SUBMISSION.md`](SUBMISSION.md).

## Run (no build step, zero deps)

```powershell
cd dead-software-library
node server.js
# open http://localhost:3001
```

Backend is **Sanity-first** (project `s2icbb2m` / dataset `production`, token from
`.env` server-side only) with local `db.json` fallback. Health:
`GET /api/health` → `{backend:"sanity", sanity:{corpses:18, eulogies:3}}`.
Reset data: `node scripts/seed-sanity.js` (or `npm run seed`).
Copy `.env.example` → `.env` to point at your own project.

## Structure
- `schemas/deceasedProject.ts` — cemetery entry (fixed `eulogies` bracket bug from draft)
- `schemas/eulogy.ts` — tribute with workflow `state`
- `sanity/decay-workflow.ts` — ghostwriter agent + decay tick + approve patch
- `sanity/SeanceDashboard.tsx` — custom Studio tool / Graveyard Radar
- `sanity/ghostwriter-api.example.js` — webhook handler for AI review
- `web/` — live frontend prototype (swap `data.js` for Sanity Live Content API `useQuery`)

## Sanity wiring (production)
1. `sanity schema` ← `schemas/*`
2. Webhook `eulogy.create` → `POST /api/ghostwriter-review`
3. Cron daily → `decayTick()` on all `deceasedProject`
4. Studio tool ← `SeanceDashboard.tsx`
5. Frontend ← `useQuery(groq'*[_type=="deceasedProject"]')` for live updates
