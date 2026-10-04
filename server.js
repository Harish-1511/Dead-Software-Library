// server.js — end-to-end backend for Dead Software Library (zero npm deps)
// - Serves web/ statically
// - Sanity Content Lake FIRST (project s2icbb2m / production), local db.json fallback
// - Ghostwriter workflow + decay tick (mirrors sanity/decay-workflow.ts)
// - Token from .env server-side only, never sent to browser.
//
// Run: node server.js   (reads .env, defaults PORT 3001)
// API:
//   GET  /api/health
//   GET  /api/corpses
//   GET  /api/eulogies?project=<id>
//   POST /api/tribute   { projectId, author, memory }
//   POST /api/bury      { name, bornYear, diedYear, causeOfDeath, epitaph, successor }
//   POST /api/exorcise  { projectId }
//   POST /api/decay-tick

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const WEB_DIR = path.join(ROOT, 'web');
const DB_FILE = path.join(ROOT, 'db.json');

// ---- tiny .env loader (no deps) ----
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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
})();

const PORT = +(process.env.PORT || 3001);
const SANITY_PROJECT_ID = (process.env.SANITY_PROJECT_ID || '').trim();
const SANITY_DATASET = (process.env.SANITY_DATASET || 'production').trim();
const SANITY_API_VERSION = (process.env.SANITY_API_VERSION || '2024-01-01').trim();
const SANITY_TOKEN = (process.env.SANITY_API_TOKEN || '').trim();
const sanityConfigured = Boolean(SANITY_PROJECT_ID && SANITY_TOKEN);

// ---- Sanity helpers (node built-in fetch) ----
async function sQuery(groq) {
  const q = encodeURIComponent(groq);
  const r = await fetch(`https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${q}`,
    { headers: { Authorization: `Bearer ${SANITY_TOKEN}` } });
  const j = await r.json();
  if (!r.ok) throw new Error('sanity query ' + r.status + ' ' + JSON.stringify(j).slice(0, 300));
  return j.result;
}
async function sMutate(mutations) {
  const r = await fetch(`https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SANITY_TOKEN}` },
    body: JSON.stringify({ mutations }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('sanity mutate ' + r.status + ' ' + JSON.stringify(j).slice(0, 500));
  return j;
}
// Normalize Sanity docs to the flat shape the frontend expects
function normCorpse(d) {
  return { _id: d._id, name: d.name, bornYear: d.bornYear, diedYear: d.diedYear, causeOfDeath: d.causeOfDeath, status: d.status, vitalityScore: d.vitalityScore, flowersLeft: d.flowersLeft, epitaph: d.epitaph, successor: d.successor };
}
function normEulogy(d) {
  const proj = typeof d.project === 'string' ? d.project : (d.project && d.project._ref);
  return { _id: d._id, author: d.author, memory: d.memory, inscription: d.poeticInscription || d.inscription, poeticInscription: d.poeticInscription, project: proj, state: d.state, createdAt: d.createdAt };
}

// ---- workflow logic (mirrors sanity/decay-workflow.ts) ----
const BANNED = ['http://', 'https://', 'buy now', 'crypto giveaway'];
function ghostwriterReview(memory) {
  if (!memory || memory.trim().length < 3) return { ok: false, reason: 'empty' };
  if (BANNED.some((b) => memory.toLowerCase().includes(b))) return { ok: false, reason: 'spam' };
  const line = memory.trim().slice(0, 120);
  return { ok: true, inscription: `Here lies a dream once compiled with love — "${line}" — now cached in our hearts.` };
}
function statusFor(v) {
  if (v > 60) return 'fading';
  if (v > 30) return 'ghost';
  if (v > 5) return 'haunting';
  return 'peaceful_rest';
}
function decayTick(vitality, yearsDead) {
  const decay = 1 + Math.min(5, yearsDead * 0.3);
  return Math.max(0, Math.round(vitality - decay));
}

// ---- db.json fallback (seed from web/data.js on first run) ----
function seedFromDataJs() {
  const src = fs.readFileSync(path.join(WEB_DIR, 'data.js'), 'utf8');
  const sandbox = { window: {} };
  const fn = new Function('window', src + '\nreturn {c: window.SEED_CORPSES, e: window.SEED_EULOGIES};');
  const { c, e } = fn(sandbox.window);
  return { corpses: c, eulogies: e.map((x, i) => ({ _id: 'seed-eul-' + i, state: 'sanctified', ...x })) };
}
function loadDb() {
  if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const seed = seedFromDataJs();
  const db = { corpses: seed.corpses, eulogies: seed.eulogies };
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  return db;
}
function saveDb(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
let db = loadDb();

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };

function send(res, code, body, type = 'application/json') {
  const buf = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.end(buf);
}
function readBody(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === 'OPTIONS') return send(res, 204, '');
  const p = u.pathname;

  // --- API ---
  if (p === '/api/health') {
    let sanity = { ok: false };
    if (sanityConfigured) {
      try {
        const r = await sQuery('{"corpses": count(*[_type=="deceasedProject"]), "eulogies": count(*[_type=="eulogy"])}');
        sanity = { ok: true, ...r };
      } catch (e) { sanity = { ok: false, error: String(e.message || e).slice(0, 200) }; }
    }
    return send(res, 200, { ok: true, backend: sanity.ok ? 'sanity' : 'local db.json', corpses: db.corpses.length, eulogies: db.eulogies.length, sanityConfigured, sanityProject: SANITY_PROJECT_ID || null, tokenLoaded: Boolean(SANITY_TOKEN), sanity });
  }
  if (p === '/api/corpses' && req.method === 'GET') {
    if (sanityConfigured) {
      try {
        const docs = await sQuery('*[_type=="deceasedProject"] | order(vitalityScore desc)');
        return send(res, 200, docs.map(normCorpse));
      } catch (e) { /* fall through */ }
    }
    return send(res, 200, db.corpses);
  }
  if (p === '/api/eulogies' && req.method === 'GET') {
    const pid = u.searchParams.get('project');
    if (sanityConfigured) {
      try {
        const groq = pid
          ? `*[_type=="eulogy" && project._ref=="${pid.replace(/"/g, '')}"] | order(createdAt desc)`
          : '*[_type=="eulogy"] | order(createdAt desc)';
        const docs = await sQuery(groq);
        return send(res, 200, docs.map(normEulogy));
      } catch (e) { /* fall through */ }
    }
    return send(res, 200, pid ? db.eulogies.filter((e) => e.project === pid || e.project?._ref === pid) : db.eulogies);
  }
  if (p === '/api/tribute' && req.method === 'POST') {
    const { projectId, author, memory } = await readBody(req);
    const review = ghostwriterReview(String(memory || ''));
    if (!review.ok) return send(res, 200, { ok: false, reason: review.reason, state: 'rejected' });
    if (sanityConfigured) {
      try {
        const corpses = await sQuery(`*[_type=="deceasedProject" && _id=="${String(projectId).replace(/"/g, '')}"]`);
        if (!corpses.length) return send(res, 404, { ok: false, reason: 'not-found' });
        const c = corpses[0];
        const eId = 'e-' + Date.now().toString(36);
        const nv = Math.min(100, c.vitalityScore + 5);
        await sMutate([
          { create: { _id: eId, _type: 'eulogy', author: (author || 'anonymous').slice(0, 40), memory: String(memory).slice(0, 500), project: { _type: 'reference', _ref: projectId }, state: 'sanctified', poeticInscription: review.inscription, createdAt: new Date().toISOString() } },
          { patch: { id: projectId, set: { vitalityScore: nv, flowersLeft: c.flowersLeft + 1, status: statusFor(nv) } } },
        ]);
        const updated = { ...c, vitalityScore: nv, flowersLeft: c.flowersLeft + 1, status: statusFor(nv) };
        return send(res, 200, { ok: true, state: 'sanctified', source: 'sanity', eulogy: { _id: eId, project: projectId }, corpse: normCorpse(updated) });
      } catch (e) { /* fall through to local */ }
    }
    const c = db.corpses.find((x) => x._id === projectId);
    if (!c) return send(res, 404, { ok: false, reason: 'not-found' });
    const eulogy = { _id: 'e-' + Date.now().toString(36), author: (author || 'anonymous').slice(0, 40), memory: String(memory).slice(0, 500), inscription: review.inscription, poeticInscription: review.inscription, project: projectId, state: 'sanctified', createdAt: new Date().toISOString() };
    db.eulogies.push(eulogy);
    c.vitalityScore = Math.min(100, c.vitalityScore + 5);
    c.flowersLeft += 1;
    c.status = statusFor(c.vitalityScore);
    saveDb(db);
    return send(res, 200, { ok: true, state: 'sanctified', source: 'local', eulogy, corpse: c });
  }
  if (p === '/api/bury' && req.method === 'POST') {
    const b = await readBody(req);
    const name = String(b.name || '').trim();
    if (!name) return send(res, 400, { ok: false, reason: 'name-required' });
    if (sanityConfigured) {
      try {
        const dup = await sQuery(`count(*[_type=="deceasedProject" && lower(name)=="${name.toLowerCase().replace(/"/g, '')}"])`);
        if (dup > 0) return send(res, 409, { ok: false, reason: 'already-buried' });
        const born = +b.bornYear || 2010, died = +b.diedYear || 2020;
        const id = 'u-' + Date.now().toString(36);
        const doc = { _id: id, _type: 'deceasedProject', name: name.slice(0, 60), bornYear: Math.min(born, died), diedYear: Math.max(born, died), causeOfDeath: b.causeOfDeath || 'Framework Churn', status: 'fading', vitalityScore: 100, flowersLeft: 1, epitaph: String(b.epitaph || 'Gone, but cached.').slice(0, 200), successor: String(b.successor || '—').slice(0, 80) };
        await sMutate([
          { create: doc },
          { create: { _type: 'eulogy', author: 'gravedigger', memory: `${name} was laid to rest by a community member.`, project: { _type: 'reference', _ref: id }, state: 'sanctified', createdAt: new Date().toISOString() } },
        ]);
        return send(res, 200, { ok: true, source: 'sanity', corpse: normCorpse(doc) });
      } catch (e) { /* fall through */ }
    }
    if (db.corpses.some((c) => c.name.toLowerCase() === name.toLowerCase())) return send(res, 409, { ok: false, reason: 'already-buried' });
    const born = +b.bornYear || 2010, died = +b.diedYear || 2020;
    const c = { _id: 'u-' + Date.now().toString(36), name: name.slice(0, 60), bornYear: Math.min(born, died), diedYear: Math.max(born, died), causeOfDeath: b.causeOfDeath || 'Framework Churn', status: 'fading', vitalityScore: 100, flowersLeft: 1, epitaph: String(b.epitaph || 'Gone, but cached.').slice(0, 200), successor: String(b.successor || '—').slice(0, 80) };
    db.corpses.push(c);
    db.eulogies.push({ _id: 'e-' + Date.now().toString(36) + 'g', author: 'gravedigger', memory: `${name} was laid to rest by a community member.`, project: c._id, state: 'sanctified', createdAt: new Date().toISOString() });
    saveDb(db);
    return send(res, 200, { ok: true, source: 'local', corpse: c });
  }
  if (p === '/api/exorcise' && req.method === 'POST') {
    const { projectId } = await readBody(req);
    if (sanityConfigured) {
      try {
        await sMutate([{ patch: { id: projectId, set: { vitalityScore: 0, status: 'peaceful_rest' } } }]);
        return send(res, 200, { ok: true, source: 'sanity' });
      } catch (e) { /* fall through */ }
    }
    const c = db.corpses.find((x) => x._id === projectId);
    if (!c) return send(res, 404, { ok: false });
    c.vitalityScore = 0; c.status = 'peaceful_rest';
    saveDb(db);
    return send(res, 200, { ok: true, source: 'local', corpse: c });
  }
  if (p === '/api/decay-tick' && req.method === 'POST') {
    const year = new Date().getFullYear();
    if (sanityConfigured) {
      try {
        const docs = await sQuery('*[_type=="deceasedProject"]{_id, vitalityScore, diedYear}');
        const mutations = docs
          .map((d) => {
            const nv = decayTick(d.vitalityScore, Math.max(0, year - (d.diedYear || year)));
            return nv === d.vitalityScore ? null : { patch: { id: d._id, set: { vitalityScore: nv, status: statusFor(nv) } } };
          })
          .filter(Boolean);
        if (mutations.length) await sMutate(mutations);
        return send(res, 200, { ok: true, source: 'sanity', corpses: docs.length, patched: mutations.length });
      } catch (e) { /* fall through */ }
    }
    db.corpses.forEach((c) => {
      const yearsDead = Math.max(0, year - (c.diedYear || year));
      c.vitalityScore = decayTick(c.vitalityScore, yearsDead);
      c.status = statusFor(c.vitalityScore);
    });
    saveDb(db);
    return send(res, 200, { ok: true, source: 'local', corpses: db.corpses.length });
  }

  // --- static ---
  let fp = path.join(WEB_DIR, p === '/' ? 'index.html' : decodeURIComponent(p.slice(1)).split('?')[0]);
  if (!fp.startsWith(WEB_DIR) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    if (p.startsWith('/api/')) return send(res, 404, { ok: false, reason: 'unknown-api' });
    fp = path.join(WEB_DIR, 'index.html');
  }
  send(res, 200, fs.readFileSync(fp), MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream');
});

server.listen(PORT, () => {
  console.log(`🪦 Dead Software Library backend on http://localhost:${PORT}`);
  console.log(`   API token loaded: ${SANITY_TOKEN ? 'yes (' + SANITY_TOKEN.slice(0, 4) + '…' + SANITY_TOKEN.slice(-4) + ')' : 'NO'}`);
  console.log(`   Sanity: ${sanityConfigured ? `ON (project ${SANITY_PROJECT_ID}/${SANITY_DATASET})` : 'OFF (local db.json only)'}`);
});
