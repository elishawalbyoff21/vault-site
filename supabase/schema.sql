-- supabase/schema.sql
-- Run this in the Supabase SQL Editor to set up your database.

-- ── Posts table ────────────────────────────────────────────────────────────────
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  price INTEGER NOT NULL,           -- in cents (e.g. 999 = $9.99)
  currency TEXT NOT NULL DEFAULT 'usd',
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'text')),
  content_url TEXT,                 -- URL to image/video in cloud storage
  content_text TEXT,                -- For text-type content
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Purchases table ────────────────────────────────────────────────────────────
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  email TEXT,                       -- Optional, may be null
  amount_paid INTEGER NOT NULL,     -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ─────────────────────────────────────────────────────────
-- Block ALL public access. Only the service key (server-side) can read/write.
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- No public policies = everything blocked by default.
-- Your server uses the service_key which bypasses RLS — that's correct and intentional.

-- ── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_purchases_post_id ON purchases(post_id);
CREATE INDEX idx_purchases_stripe_session ON purchases(stripe_session_id);
CREATE INDEX idx_purchases_paid_at ON purchases(paid_at);
