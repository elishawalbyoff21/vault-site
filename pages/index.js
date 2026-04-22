// pages/index.js — Public storefront
import Head from 'next/head';
import { useState, useEffect } from 'react';
import ContentCard from '../components/ContentCard';
import HeroSection from '../components/HeroSection';

export default function Home({ posts }) {
  return (
    <>
      <Head>
        <title>THE VAULT — Exclusive Access</title>
        <meta name="description" content="Premium exclusive content. Pay to unlock. No accounts. Instant access." />
        <meta name="robots" content="noindex" /> {/* Keep private if desired */}
        <meta property="og:title" content="THE VAULT" />
        <meta property="og:description" content="Premium exclusive content. Pay to unlock." />
        <link rel="icon" href="/favicon.ico" />
        {/* Disable right-click and text selection globally */}
        <style>{`
          body { -webkit-user-select: none; user-select: none; }
          img, video { pointer-events: none; -webkit-user-drag: none; }
        `}</style>
      </Head>

      <main>
        <HeroSection />
        <section className="grid-section">
          <div className="section-label">LOCKED CONTENT</div>
          <div className="grid">
            {posts.map(post => (
              <ContentCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      </main>

      <footer>
        <p>© {new Date().getFullYear()} THE VAULT. All rights reserved.</p>
        <p className="fine">All transactions are processed securely via Stripe. No data is stored.</p>
      </footer>

      <style jsx>{`
        main { min-height: 100vh; }
        .grid-section { padding: 4rem 2rem 6rem; max-width: 1200px; margin: 0 auto; }
        .section-label {
          font-family: 'Courier New', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.3em;
          color: var(--gold);
          margin-bottom: 2rem;
          opacity: 0.7;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        footer {
          border-top: 1px solid #1a1a1a;
          padding: 2rem;
          text-align: center;
          color: #333;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }
        .fine { margin-top: 0.5rem; font-size: 0.65rem; }
        @media (max-width: 600px) {
          .grid { grid-template-columns: 1fr 1fr; gap: 1rem; }
          .grid-section { padding: 2rem 1rem 4rem; }
        }
      `}</style>
    </>
  );
}

// Fetch posts from your database (Supabase/Firebase)
export async function getServerSideProps() {
  // Replace with your actual DB call
  // e.g. const { data } = await supabase.from('posts').select('id,title,price,preview_url,type').eq('published', true)
  const posts = [
    { id: '1', title: 'Access Level I', price: 999, currency: 'usd', preview_url: null, type: 'image' },
    { id: '2', title: 'Private Session', price: 1999, currency: 'usd', preview_url: null, type: 'video' },
    { id: '3', title: 'Classified File', price: 2999, currency: 'usd', preview_url: null, type: 'text' },
    { id: '4', title: 'Inner Circle', price: 4999, currency: 'usd', preview_url: null, type: 'image' },
    { id: '5', title: 'Restricted Drop', price: 1499, currency: 'usd', preview_url: null, type: 'image' },
    { id: '6', title: 'Eyes Only', price: 3499, currency: 'usd', preview_url: null, type: 'video' },
  ];
  return { props: { posts } };
}
