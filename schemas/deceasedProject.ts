// schemas/deceasedProject.ts — Cemetery Entry
// Biological lifecycle of software decay
export default {
  name: 'deceasedProject',
  title: 'Deceased Project',
  type: 'document',
  fields: [
    { name: 'name', type: 'string', title: 'Package / Tool Name', validation: (R: any) => R.required() },
    { name: 'bornYear', type: 'number', title: 'Birth (Initial Commit)' },
    { name: 'diedYear', type: 'number', title: 'Death (Deprecation / Final Commit)' },
    {
      name: 'causeOfDeath',
      type: 'string',
      title: 'Cause of Death',
      options: {
        list: [
          'Acquired and Murdered',
          'Vibe-Coded into Extinction',
          'Maintainer Burnout',
          'Framework Churn',
          'Rewritten in Rust (and never finished)',
          'Zero-Day Vulnerability',
        ],
      },
    },
    {
      name: 'status',
      type: 'string',
      title: 'Haunting Status',
      initialValue: 'fading',
      options: {
        list: ['fading', 'ghost', 'haunting', 'peaceful_rest'],
      },
    },
    { name: 'vitalityScore', type: 'number', title: 'Soul / Memory Gauge (0-100)', initialValue: 100 },
    { name: 'flowersLeft', type: 'number', title: 'Flowers Left', initialValue: 0 },
    { name: 'epitaph', type: 'text', title: 'Carved Inscription' },
    {
      name: 'eulogies',
      type: 'array',
      title: 'Eulogies',
      of: [{ type: 'reference', to: [{ type: 'eulogy' }] }],
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'causeOfDeath', vitality: 'vitalityScore' },
  },
}
