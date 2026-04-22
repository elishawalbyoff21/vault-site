// lib/db.js
// Database abstraction — uses Supabase by default.
// Swap this file's implementation for Firebase/PlanetScale/etc. without touching the rest of the app.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key (server-side only, never expose to client)
);

// ─── Posts ────────────────────────────────────────────────────────────────────

/**
 * Get a single post by ID.
 * @param {string} id
 * @param {{ includeContent?: boolean }} options - If true, includes content_url/text (only after payment)
 */
export async function getPost(id, options = {}) {
  const query = supabase.from('posts').select(
    options.includeContent
      ? 'id, title, price, currency, type, published, content_url, content_text'
      : 'id, title, price, currency, type, published'
  ).eq('id', id).single();

  const { data, error } = await query;
  if (error) { console.error('getPost error:', error); return null; }
  return data;
}

/**
 * List all published posts (for public storefront).
 */
export async function listPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, price, currency, type')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) { console.error('listPosts error:', error); return []; }
  return data;
}

/**
 * List all posts (for admin).
 */
export async function listAllPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, price, currency, type, published, created_at')
    .order('created_at', { ascending: false });

  if (error) { console.error('listAllPosts error:', error); return []; }
  return data;
}

/**
 * Create a new post.
 */
export async function createPost({ title, price, currency, type, content_url, content_text }) {
  const { data, error } = await supabase.from('posts').insert([{
    title, price, currency, type, content_url, content_text,
    published: false, // Draft by default
  }]).select().single();

  if (error) throw error;
  return data;
}

/**
 * Update a post field(s).
 */
export async function updatePost(id, fields) {
  const { data, error } = await supabase.from('posts').update(fields).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

/**
 * Delete a post.
 */
export async function deletePost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

// ─── Purchases ────────────────────────────────────────────────────────────────

/**
 * Record a confirmed purchase (called from Stripe webhook).
 */
export async function recordPurchase({ postId, sessionId, email, amountPaid, currency, paidAt }) {
  const { error } = await supabase.from('purchases').insert([{
    post_id: postId,
    stripe_session_id: sessionId,
    email: email || null,
    amount_paid: amountPaid,
    currency,
    paid_at: paidAt,
  }]);
  if (error) console.error('recordPurchase error:', error);
}

/**
 * Check if a session has an associated purchase (prevents double-access without payment).
 */
export async function getPurchase(sessionId) {
  const { data } = await supabase
    .from('purchases')
    .select('id, post_id')
    .eq('stripe_session_id', sessionId)
    .single();
  return data;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalytics() {
  const [{ data: purchases }, { data: posts }] = await Promise.all([
    supabase.from('purchases').select('post_id, amount_paid, paid_at'),
    supabase.from('posts').select('id, title'),
  ]);

  if (!purchases) return null;

  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount_paid, 0);
  const totalPurchases = purchases.length;
  const avgSale = totalPurchases ? Math.round(totalRevenue / totalPurchases) : 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRevenue = purchases
    .filter(p => new Date(p.paid_at) >= monthStart)
    .reduce((sum, p) => sum + p.amount_paid, 0);

  // Per-post breakdown
  const postMap = {};
  for (const p of purchases) {
    if (!postMap[p.post_id]) postMap[p.post_id] = { purchases: 0, revenue: 0 };
    postMap[p.post_id].purchases++;
    postMap[p.post_id].revenue += p.amount_paid;
  }

  const topPosts = (posts || [])
    .map(post => ({
      ...post,
      purchases: postMap[post.id]?.purchases || 0,
      revenue: postMap[post.id]?.revenue || 0,
    }))
    .filter(p => p.purchases > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return { totalRevenue, totalPurchases, monthRevenue, avgSale, topPosts };
}
