// pages/api/admin/auth.js
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// ─────────────────────────────────────────────────────────────────────────────
// pages/api/admin/posts.js
// ─────────────────────────────────────────────────────────────────────────────
// import { listAllPosts, createPost } from '../../../lib/db';
// import { requireAdmin } from '../../../lib/adminAuth';
//
// export default async function handler(req, res) {
//   if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
//   if (req.method === 'GET') {
//     const posts = await listAllPosts();
//     return res.status(200).json(posts);
//   }
//   if (req.method === 'POST') {
//     const post = await createPost(req.body);
//     return res.status(201).json(post);
//   }
//   res.status(405).end();
// }

// ─────────────────────────────────────────────────────────────────────────────
// pages/api/admin/posts/[id].js
// ─────────────────────────────────────────────────────────────────────────────
// import { updatePost, deletePost } from '../../../../lib/db';
// import { requireAdmin } from '../../../../lib/adminAuth';
//
// export default async function handler(req, res) {
//   if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
//   const { id } = req.query;
//   if (req.method === 'PATCH') {
//     const updated = await updatePost(id, req.body);
//     return res.status(200).json(updated);
//   }
//   if (req.method === 'DELETE') {
//     await deletePost(id);
//     return res.status(204).end();
//   }
//   res.status(405).end();
// }

// ─────────────────────────────────────────────────────────────────────────────
// pages/api/admin/analytics.js
// ─────────────────────────────────────────────────────────────────────────────
// import { getAnalytics } from '../../../lib/db';
// import { requireAdmin } from '../../../lib/adminAuth';
//
// export default async function handler(req, res) {
//   if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
//   const data = await getAnalytics();
//   return res.status(200).json(data);
// }

// ─────────────────────────────────────────────────────────────────────────────
// pages/api/admin/generate-link.js — Create a pre-filled Stripe Checkout link
// ─────────────────────────────────────────────────────────────────────────────
// import Stripe from 'stripe';
// import { getPost } from '../../../lib/db';
// import { requireAdmin } from '../../../lib/adminAuth';
//
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//
// export default async function handler(req, res) {
//   if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
//   if (req.method !== 'POST') return res.status(405).end();
//
//   const { postId } = req.body;
//   const post = await getPost(postId);
//   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
//
//   const session = await stripe.checkout.sessions.create({
//     mode: 'payment',
//     payment_method_types: ['card'],
//     line_items: [{ price_data: { currency: post.currency, unit_amount: post.price,
//       product_data: { name: post.title } }, quantity: 1 }],
//     success_url: `${baseUrl}/access/{CHECKOUT_SESSION_ID}`,
//     cancel_url: `${baseUrl}/`,
//     metadata: { postId: post.id },
//   });
//
//   return res.status(200).json({ url: session.url });
// }
