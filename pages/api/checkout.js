// pages/api/checkout.js
// Creates a Stripe Checkout Session for a single content item

import Stripe from 'stripe';
import { getPost } from '../../lib/db'; // Your DB helper

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Simple in-memory rate limiter (swap for Redis in production)
const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const max = 10;
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  const requests = rateLimitMap.get(ip).filter(t => now - t < windowMs);
  requests.push(now);
  rateLimitMap.set(ip, requests);
  return requests.length > max;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many requests' });

  const { postId, email } = req.body;
  if (!postId) return res.status(400).json({ error: 'Missing postId' });

  try {
    // Fetch post from your DB
    const post = await getPost(postId);
    if (!post) return res.status(404).json({ error: 'Content not found' });
    if (!post.published) return res.status(403).json({ error: 'Content not available' });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'], // Stripe also auto-adds Apple Pay, Google Pay, etc.
      line_items: [
        {
          price_data: {
            currency: post.currency || 'usd',
            unit_amount: post.price, // in cents
            product_data: {
              name: post.title,
              description: 'Instant digital access — no account required',
              // No images to keep anonymous
            },
          },
          quantity: 1,
        },
      ],
      // Where to redirect after payment
      success_url: `${baseUrl}/access/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?cancelled=1`,
      // Pass metadata so webhook can identify what was purchased
      metadata: {
        postId: post.id,
        email: email || '',
      },
      // Prefill email if provided
      ...(email ? { customer_email: email } : {}),
      // Allow international payments — Stripe handles currency conversion
      billing_address_collection: 'auto',
      // Collect as little info as possible
      phone_number_collection: { enabled: false },
      // Session expires in 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: 'Payment setup failed' });
  }
}
