// web/app.js — graveyard with real entries + community contributions (localStorage)
// Prod swap: replace load()/save() with Sanity Live Content API useQuery + mutations.

const $ = (id) => document.getElementById(id);
const radar = $('radar'), projSel = $('proj'), logEl = $('log');
const searchEl = $('search'), causeFilter = $('causeFilter'), sortEl = $('sort'), statsEl = $('stats');

const LS_C = 'dsl_corpses_v1', LS_E = 'dsl_eulogies_v1';
const band = (v) => (v > 60 ? 'healthy' : v > 30 ? 'low' : 'critical');
const statusFor = (v) => (v > 60 ? 'fading' : v > 30 ? 'ghost' : v > 5 ? 'haunting' : 'peaceful_rest');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let USE_BACKEND = location.protocol.startsWith('http');
async function api(path, opts) {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!r.ok) throw new Error('api ' + r.status);
  return r.json();
}
async function syncFromBackend() {
  if (!USE_BACKEND) return false;
  try {
    const [c, e] = await Promise.all([api('/api/corpses'), api('/api/eulogies')]);
    if (Array.isArray(c) && Array.isArray(e)) { corpses = c; eulogies = e; return true; }
  } catch { USE_BACKEND = false; }
  return false;
}

let corpses, eulogies;
try {
  corpses = [...window.SEED_CORPSES, ...(JSON.parse(localStorage.getItem(LS_C) || '[]'))];
  eulogies = [...window.SEED_EULOGIES, ...(JSON.parse(localStorage.getItem(LS_E) || '[]'))];
} catch { corpses = [...window.SEED_CORPSES]; eulogies = [...window.SEED_EULOGIES]; }
const save = () => {
  const seedIds = new Set(window.SEED_CORPSES.map((c) => c._id));
  localStorage.setItem(LS_C, JSON.stringify(corpses.filter((c) => !seedIds.has(c._id))));
  localStorage.setItem(LS_E, JSON.stringify(eulogies.slice(window.SEED_EULOGIES.length)));
};

// Filters
window.CAUSES.forEach((c) => {
  const o = document.createElement('option'); o.value = c; o.textContent = '⚰️ ' + c;
  causeFilter.appendChild(o);
});
$('f-cause').innerHTML = window.CAUSES.map((c) => `<option>${esc(c)}</option>`).join('');

function filtered() {
  const q = searchEl.value.trim().toLowerCase();
  const cause = causeFilter.value;
  let list = corpses.filter((c) =>
    (!cause || c.causeOfDeath === cause) &&
    (!q || (c.name + ' ' + c.epitaph + ' ' + (c.successor || '')).toLowerCase().includes(q)));
  const s = sortEl.value;
  if (s === 'vitality-desc') list.sort((a, b) => b.vitalityScore - a.vitalityScore);
  if (s === 'vitality-asc') list.sort((a, b) => a.vitalityScore - b.vitalityScore);
  if (s === 'died-desc') list.sort((a, b) => b.diedYear - a.diedYear);
  if (s === 'flowers-desc') list.sort((a, b) => b.flowersLeft - a.flowersLeft);
  return list;
}

function renderStats() {
  const total = corpses.length, flowers = corpses.reduce((n, c) => n + c.flowersLeft, 0);
  const avg = Math.round(corpses.reduce((n, c) => n + c.vitalityScore, 0) / Math.max(1, total));
  statsEl.innerHTML = `<span class="pill">🪦 <b>${total}</b> buried</span>
    <span class="pill">🌸 <b>${flowers}</b> flowers</span>
    <span class="pill">💬 <b>${eulogies.length}</b> eulogies</span>
    <span class="pill">👻 avg soul <b>${avg}</b></span>`;
}

function render(flashId) {
  renderStats();
  projSel.innerHTML = corpses.map((c) => `<option value="${c._id}">${esc(c.name)}</option>`).join('');
  const list = filtered();
  radar.innerHTML = list.length ? '' : `<div class="empty">No ghosts match. <button id="emptyAdd">Bury it yourself →</button></div>`;
  list.forEach((c) => {
    const d = document.createElement('div');
    d.className = 'stone' + (c._id === flashId ? ' flash' : '');
    d.dataset.vitality = band(c.vitalityScore);
    const color = c.vitalityScore > 60 ? '#7dffa8' : c.vitalityScore > 30 ? '#9aa5b1' : '#5a636e';
    d.innerHTML = `
      <div class="rip">R · I · P</div>
      <div class="name" style="color:${color}">${c.vitalityScore <= 30 ? '🪨‍💥 ' : '🪦 '}${esc(c.name)}</div>
      <div class="years">${c.bornYear} — ${c.diedYear}</div>
      <div style="text-align:center"><span class="cause">${esc(c.causeOfDeath)}</span></div>
      <div class="epitaph">“${esc(c.epitaph || 'Gone, but cached.')}”</div>
      <div class="meta"><span>👻 ${c.status} · soul ${c.vitalityScore}</span><span>🌸 ${c.flowersLeft}</span></div>
      <div class="bar"><div style="width:${c.vitalityScore}%"></div></div>
      <div class="actions">
        <button data-flower="${c._id}">🌸 Flower</button>
        <button data-open="${c._id}">📖 Details</button>
      </div>`;
    d.querySelector('[data-open]').onclick = (e) => { e.stopPropagation(); openDetail(c._id); };
    d.querySelector('[data-flower]').onclick = (e) => { e.stopPropagation(); layFlowers(c._id, 'visitor', 'a fond memory'); };
    d.onclick = () => openDetail(c._id);
    radar.appendChild(d);
  });
  const ea = $('emptyAdd');
  if (ea) ea.onclick = () => $('addModal').classList.remove('hidden');
}

function say(m) {
  const d = document.createElement('div');
  d.textContent = '> ' + m;
  logEl.prepend(d);
}

// Workflow: submitted → ghostwriter_review (agent) → sanctified (auto here, human in Studio)
async function layFlowers(id, author, memory = 'a fond memory') {
  if (USE_BACKEND) {
    try {
      const r = await api('/api/tribute', { method: 'POST', body: JSON.stringify({ projectId: id, author, memory }) });
      if (!r.ok) { say(`ghostwriter: rejected as spam — state=rejected (${r.reason || 'spam'})`); return; }
      await syncFromBackend(); save();
      say(`sanctified (server) — ${r.corpse.name} soul → ${r.corpse.vitalityScore}, flowers ${r.corpse.flowersLeft}`);
      render(id);
      if (!$('detailModal').classList.contains('hidden')) openDetail(id, true);
      return;
    } catch (e) { USE_BACKEND = false; /* fall through to local */ }
  }
  const c = corpses.find((x) => x._id === id);
  if (!c) return;
  say(`tribute submitted for ${c.name} — state=submitted`);
  if (/http|buy now|crypto giveaway/i.test(memory)) { say('ghostwriter: rejected as spam — state=rejected'); return; }
  const inscription = `Here lies a dream once compiled with love — "${memory.slice(0, 80)}" — now cached in our hearts.`;
  say(`ghostwriter approved — state=ghostwriter_review`);
  eulogies.push({ author: author || 'anonymous', memory, inscription, project: id });
  c.vitalityScore = Math.min(100, c.vitalityScore + 5);
  c.flowersLeft += 1;
  c.status = statusFor(c.vitalityScore);
  save();
  say(`sanctified — ${c.name} soul → ${c.vitalityScore}, flowers ${c.flowersLeft}`);
  render(id);
  if (!$('detailModal').classList.contains('hidden')) openDetail(id, true);
}

// Detail modal with eulogies + inline tribute box
function openDetail(id, keepOpen) {
  const c = corpses.find((x) => x._id === id);
  const list = eulogies.filter((e) => e.project === id);
  $('detailCard').innerHTML = `
    <div style="text-align:right"><button id="closeDetail">✕</button></div>
    <div class="rip">R · I · P</div>
    <h2 style="text-align:center;margin:4px 0">${esc(c.name)}</h2>
    <p style="text-align:center;color:var(--dim)">${c.bornYear} — ${c.diedYear} · ${esc(c.causeOfDeath)}</p>
    <p style="font-style:italic">“${esc(c.epitaph || '')}”</p>
    <p>👻 ${c.status} · soul ${c.vitalityScore} · 🌸 ${c.flowersLeft}<br/>➡️ Successor: ${esc(c.successor || '—')}</p>
    <h3>💬 Eulogies (${list.length})</h3>
    ${list.length ? list.map((e) => `<div class="eulogy"><b>${esc(e.author)}</b>: ${esc(e.memory)}${e.inscription ? `<br/><span style="opacity:.7">${esc(e.inscription)}</span>` : ''}</div>`).join('') : '<p class="hint">No eulogies yet. Be the first mourner.</p>'}
    <form id="detailForm" class="row">
      <input id="d-author" placeholder="your name" required maxlength="40" style="flex:1" />
      <input id="d-memory" placeholder="share a memory…" required maxlength="500" style="flex:2" />
      <button class="primary" type="submit">🌸 Lay flower</button>
    </form>`;
  $('detailModal').classList.remove('hidden');
  $('closeDetail').onclick = () => $('detailModal').classList.add('hidden');
  $('detailForm').onsubmit = (e) => {
    e.preventDefault();
    layFlowers(id, $('d-author').value, $('d-memory').value);
  };
}

// Events
$('eulogyForm').onsubmit = (e) => {
  e.preventDefault();
  layFlowers(projSel.value, $('author').value, $('memory').value);
  $('memory').value = '';
};
$('exorcise').onclick = async () => {
  if (USE_BACKEND) {
    try { await api('/api/exorcise', { method: 'POST', body: JSON.stringify({ projectId: projSel.value }) }); await syncFromBackend(); save(); say(`exorcism cast (server) — peaceful_rest`); render(projSel.value); return; }
    catch { USE_BACKEND = false; }
  }
  const c = corpses.find((x) => x._id === projSel.value);
  c.vitalityScore = 0; c.status = 'peaceful_rest'; save();
  say(`exorcism cast on ${c.name} — peaceful_rest`);
  render(c._id);
};
[searchEl, causeFilter, sortEl].forEach((el) => el.addEventListener('input', () => render()));
$('openAdd').onclick = () => $('addModal').classList.remove('hidden');
$('closeAdd').onclick = () => $('addModal').classList.add('hidden');
$('addModal').addEventListener('click', (e) => { if (e.target.id === 'addModal') $('addModal').classList.add('hidden'); });
$('detailModal').addEventListener('click', (e) => { if (e.target.id === 'detailModal') $('detailModal').classList.add('hidden'); });

// Anyone can add new dead software
$('addForm').onsubmit = async (e) => {
  e.preventDefault();
  const name = $('f-name').value.trim();
  if (!name) return;
  if (USE_BACKEND) {
    try {
      const r = await api('/api/bury', { method: 'POST', body: JSON.stringify({ name, bornYear: $('f-born').value, diedYear: $('f-died').value, causeOfDeath: $('f-cause').value, epitaph: $('f-epitaph').value, successor: $('f-successor').value }) });
      await syncFromBackend(); save();
      $('addModal').classList.add('hidden'); e.target.reset();
      say(`${r.corpse.name} buried by community (server) — state=sanctified, soul=100`);
      render(r.corpse._id); return;
    } catch (err) { if (err.message.includes('409')) { alert('Already buried. Leave a flower instead!'); return; } USE_BACKEND = false; }
  }
  if (corpses.some((c) => c.name.toLowerCase() === name.toLowerCase())) { alert('Already buried. Leave a flower instead!'); return; }
  const born = +$('f-born').value || 2010, died = +$('f-died').value || 2020;
  const c = {
    _id: 'u-' + Date.now().toString(36),
    name, bornYear: Math.min(born, died), diedYear: Math.max(born, died),
    causeOfDeath: $('f-cause').value, status: 'fading', vitalityScore: 100,
    flowersLeft: 1, epitaph: $('f-epitaph').value.trim() || 'Gone, but cached.',
    successor: $('f-successor').value.trim() || '—',
  };
  corpses.push(c);
  eulogies.push({ author: 'gravedigger', memory: `${name} was laid to rest by a community member.`, project: c._id });
  save();
  $('addModal').classList.add('hidden');
  e.target.reset();
  say(`${name} buried by community — state=sanctified, soul=100`);
  render(c._id);
};

// Gentle decay (daily cron in prod; slowed here so UI stays usable)
setInterval(async () => {
  if (USE_BACKEND) {
    try { await api('/api/decay-tick', { method: 'POST', body: '{}' }); await syncFromBackend(); render(); return; }
    catch { USE_BACKEND = false; }
  }
  let changed = false;
  corpses.forEach((c) => {
    if (c.vitalityScore > 0 && Math.random() < 0.35) {
      c.vitalityScore = Math.max(0, c.vitalityScore - 1);
      c.status = statusFor(c.vitalityScore);
      changed = true;
    }
  });
  if (changed) { save(); render(); }
}, 8000);

render();
say('graveyard live — 18 real corpses loaded. Flowers +5 soul. Decay ticks gently.');
syncFromBackend().then((ok) => { if (ok) { render(); say('backend connected — live server db (end-to-end).'); } });
