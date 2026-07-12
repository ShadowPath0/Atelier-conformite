import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return new Response('Session manquante.', { status: 400 });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    return new Response('Session de paiement introuvable.', { status: 404 });
  }

  // Vérification réelle auprès de Stripe — impossible à falsifier depuis le navigateur.
  // mode "payment" = achat unique (le kit), différent de "subscription" (l'abonnement).
  if (session.mode !== 'payment' || session.payment_status !== 'paid') {
    return new Response('Paiement non confirmé pour cette session.', { status: 403 });
  }

  const filePath = path.join(process.cwd(), 'public', 'kit', 'Kit-Conformite-Confituriers-Conserveurs.zip');
  const fileBuffer = fs.readFileSync(filePath);

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="Kit-Conformite-Confituriers-Conserveurs.zip"',
    },
  });
}
