// sanity/sanity.client.js — server-side Sanity client (token never leaves the server)
// Uses only Node built-ins. Configure via .env: SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN.
// Note: .env is loaded by server.js / seed script before this module is required.
const PROJECT = process.env.SANITY_PROJECT_ID || '';
const DATASET = process.env.SANITY_DATASET || 'production';
const VERSION = process.env.SANITY_API_VERSION || '2024-01-01';
const TOKEN = process.env.SANITY_API_TOKEN || '';

function base() {
  if (!PROJECT) throw new Error('SANITY_PROJECT_ID missing in .env');
  return `https://${PROJECT}.api.sanity.io/v${VERSION}/data`;
}
async function query(groq, params = {}) {
  const qs = new URLSearchParams({ query: groq, ...params }).toString();
  const r = await fetch(`${base()}/query/${DATASET}?${qs}`, {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
  });
  if (!r.ok) throw new Error(`Sanity query failed: ${r.status} ${await r.text()}`);
  return (await r.json()).result;
}
async function mutate(mutations) {
  const r = await fetch(`${base()}/mutate/${DATASET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
    body: JSON.stringify({ mutations }),
  });
  if (!r.ok) throw new Error(`Sanity mutate failed: ${r.status} ${await r.text()}`);
  return r.json();
}
module.exports = { query, mutate, isConfigured: () => Boolean(PROJECT && TOKEN) };
