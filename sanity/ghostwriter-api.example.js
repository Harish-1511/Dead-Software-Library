// sanity/ghostwriter-api.example.js — Webhook: POST /api/ghostwriter-review
// Sanity webhook on eulogy.create (state=submitted) -> this handler.
// Does agent review, patches eulogy -> ghostwriter_review, bumps project vitality.

export async function POST(req, sanityClient) {
  const { _id, memory, projectId } = await req.json();

  const banned = ['http://', 'https://', 'buy now', 'crypto giveaway'];
  if (banned.some((b) => memory.toLowerCase().includes(b))) {
    await sanityClient.patch(_id).set({ state: 'rejected' }).commit();
    return Response.json({ ok: false, reason: 'spam' });
  }

  const inscription =
    `Here lies a dream once compiled with love — "${memory.slice(0, 120)}" — now cached in our hearts.`;

  await sanityClient.patch(_id).set({ state: 'ghostwriter_review', poeticInscription: inscription }).commit();
  // Human then hits Approve in Studio workflow -> sanctified + publish + vitality+5:
  // await sanityClient.patch(projectId).inc({ flowersLeft: 1 }).commit();
  // await sanityClient.patch(projectId).set({ vitalityScore: Math.min(100, v + 5) }).commit();

  return Response.json({ ok: true, inscription, next: 'awaiting human Approve -> sanctified' });
}
