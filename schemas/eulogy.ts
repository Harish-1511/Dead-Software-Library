// schemas/eulogy.ts — Tribute / Flower memory
export default {
  name: 'eulogy',
  title: 'Eulogy',
  type: 'document',
  fields: [
    { name: 'author', type: 'string', title: 'Mourner', validation: (R: any) => R.required() },
    { name: 'memory', type: 'text', title: 'Memory', validation: (R: any) => R.required().max(500) },
    {
      name: 'project',
      type: 'reference',
      title: 'For Project',
      to: [{ type: 'deceasedProject' }],
      validation: (R: any) => R.required(),
    },
    {
      name: 'state',
      type: 'string',
      title: 'Workflow State',
      initialValue: 'submitted',
      options: { list: ['submitted', 'ghostwriter_review', 'sanctified', 'rejected'] },
    },
    { name: 'poeticInscription', type: 'text', title: 'AI Ghostwriter Inscription' },
    { name: 'createdAt', type: 'datetime', title: 'Left At', initialValue: () => new Date().toISOString() },
  ],
}
