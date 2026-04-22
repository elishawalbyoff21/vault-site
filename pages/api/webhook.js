// pages/api/webhook.js
// Stripe sends payment confirmation here — we record it and generate access

import Stripe from 'stripe';
import { buffer } from 'micro';
import { recordPurchase } from '../../lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// Required: disable Next.js body parsing for webhook signature verification
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const rawBody = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { postId, email } = session.metadata;

    // Record purchase in DB (postId, sessionId, amount, timestamp)
    await recordPurchase({
      postId,
      sessionId: session.id,
      email,
      amountPaid: session.amount_total,
      currency: session.currency,
      paidAt: new Date(session.created * 1000),
    });
  }

  res.status(200).json({ received: true });
}
