// scripts/seed-sanity.js — one-shot seed of Content Lake from web/data.js (zero deps)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
(function loadEnv() {
  const p = path.join(ROOT, '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
})();
const PROJECT = (process.env.SANITY_PROJECT_ID || '').trim();
const DATASET = (process.env.SANITY_DATASET || 'production').trim();
const VERSION = (process.env.SANITY_API_VERSION || '2024-01-01').trim();
const TOKEN = (process.env.SANITY_API_TOKEN || '').trim();
if (!PROJECT || !TOKEN) { console.error('Missing SANITY_PROJECT_ID / SANITY_API_TOKEN in .env'); process.exit(1); }

const src = fs.readFileSync(path.join(ROOT, 'web', 'data.js'), 'utf8');
const sandbox = { window: {} };
const { c, e } = new Function('window', src + '\nreturn {c: window.SEED_CORPSES, e: window.SEED_EULOGIES};')(sandbox.window);

const mutations = [
  ...c.map((x) => ({ createOrReplace: { _id: x._id, _type: 'deceasedProject', ...x } })),
  ...e.map((x, i) => ({
    createOrReplace: {
      _id: 'seed-eul-' + i, _type: 'eulogy', author: x.author, memory: x.memory,
      project: { _type: 'reference', _ref: x.project }, state: 'sanctified',
      createdAt: new Date().toISOString(),
    },
  })),
];

(async () => {
  const r = await fetch(`https://${PROJECT}.api.sanity.io/v${VERSION}/data/mutate/${DATASET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ mutations }),
  });
  const j = await r.json();
  if (!r.ok) { console.error('Seed failed:', JSON.stringify(j).slice(0, 2000)); process.exit(1); }
  console.log(`Seeded ${c.length} deceasedProject + ${e.length} eulogy docs to ${PROJECT}/${DATASET}.`);
})();
