import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Signature webhook invalide:', err.message);
    return new Response('Signature invalide', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.client_reference_id; // relié depuis le lien d'abonnement
      if (userId) {
        await supabaseAdmin.from('profiles').update({
          stripe_customer_id: session.customer,
          subscription_status: 'active',
        }).eq('id', userId);
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const status = subscription.status === 'active' ? 'active'
        : subscription.status === 'past_due' ? 'past_due'
        : 'canceled';
      await supabaseAdmin.from('profiles').update({ subscription_status: status })
        .eq('stripe_customer_id', subscription.customer);
      break;
    }
    default:
      break; // autres événements ignorés
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
