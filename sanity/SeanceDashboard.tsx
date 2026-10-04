// sanity/SeanceDashboard.tsx — Custom Studio Tool ("Séance Dashboard" / Graveyard Radar)
// Drop into sanity.config.ts as a tool. Shows decay visually, quick-actions patch docs live.
// Green names -> gray as vitalityScore drops. Crack overlay when < 30.

import React from 'react';

type Corpse = {
  _id: string;
  name: string;
  vitalityScore: number;
  status: string;
  flowersLeft: number;
  causeOfDeath: string;
};

export function vitalityColor(v: number): string {
  if (v > 60) return '#7dffa8';
  if (v > 30) return '#9aa5b1';
  if (v > 5) return '#5a636e';
  return '#2e3440';
}

export function SeanceDashboard({ corpses, onFlower, onExorcism }: {
  corpses: Corpse[];
  onFlower: (id: string) => void;
  onExorcism: (id: string) => void;
}) {
  return (
    <div style={{ background: '#0b0e14', color: '#e6e6e6', padding: 16 }}>
      <h2>🪦 Graveyard Radar</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {corpses.map((c) => (
          <div key={c._id} style={{ border: '1px solid #333', padding: 12, opacity: 0.4 + c.vitalityScore / 170 }}>
            <div style={{ color: vitalityColor(c.vitalityScore), fontWeight: 700 }}>
              {c.vitalityScore < 30 ? '🪨‍💥 ' : '🪦 '}{c.name}
            </div>
            <div style={{ fontSize: 12 }}>soul: {c.vitalityScore} · 🌸 {c.flowersLeft} · {c.status}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{c.causeOfDeath}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button onClick={() => onFlower(c._id)}>🌸 Lay Flowers</button>
              <button onClick={() => onExorcism(c._id)}>🕯️ Cast Exorcism</button>
            </div>
          </div>
        ))}
      </div>
      <p style={{ opacity: 0.6, fontSize: 12 }}>
        onFlower: patch {'{ vitalityScore: min(100,v+5), flowersLeft: f+1 }'} ·
        onExorcism: patch {'{ status: "peaceful_rest", vitalityScore: 0 }'}
      </p>
    </div>
  );
}
