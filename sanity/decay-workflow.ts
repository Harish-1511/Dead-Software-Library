// sanity/decay-workflow.ts — Sanity Workflows: Automated Decay + Eulogy Approval
// States: submitted -> ghostwriter_review (agent) -> sanctified (human approve) -> published
//
// Wire-up: Sanity webhook on eulogy.create -> POST /api/ghostwriter-review
// Studio: workflow button "Approve" transitions sanctified -> publishes + patches vitalityScore.

export const EULOGY_WORKFLOW = {
  id: 'eulogy-sanctification',
  states: ['submitted', 'ghostwriter_review', 'sanctified', 'rejected'] as const,
}

// --- Agent step: AI Ghostwriter Review (run as webhook / server action) ---
// Spam check (length, links, banned words) -> draft poetic inscription -> +5 vitality, +1 flower.

const BANNED = ['http://', 'https://', 'buy now', 'crypto giveaway'];

export function ghostwriterReview(memory: string): { ok: boolean; inscription?: string; reason?: string } {
  if (!memory || memory.trim().length < 3) return { ok: false, reason: 'empty' };
  if (BANNED.some((b) => memory.toLowerCase().includes(b))) return { ok: false, reason: 'spam' };
  const line = memory.trim().slice(0, 120);
  return {
    ok: true,
    inscription: `Here lies a dream once compiled with love — "${line}" — now cached in our hearts.`,
  };
}

// --- Automated Decay (cron: daily) ---
// vitalityScore decays with age since death; status derived from score.
// fading (>60) -> ghost (30-60) -> haunting (5-30) -> peaceful_rest (0-5)

export function decayTick(vitality: number, yearsDead: number): number {
  const decay = 1 + Math.min(5, yearsDead * 0.3); // older corpses fade faster
  return Math.max(0, Math.round(vitality - decay));
}

export function statusFor(vitality: number): string {
  if (vitality > 60) return 'fading';
  if (vitality > 30) return 'ghost';
  if (vitality > 5) return 'haunting';
  return 'peaceful_rest';
}

// --- Human approval patch (what the Studio "Approve" button does) ---
// PATCH deceasedProject: { vitalityScore: min(100, v+5), flowersLeft: f+1 }
// PATCH eulogy: { state: 'sanctified' } + publish

export function approvePatch(vitality: number, flowers: number) {
  return {
    vitalityScore: Math.min(100, vitality + 5),
    flowersLeft: flowers + 1,
  };
}
