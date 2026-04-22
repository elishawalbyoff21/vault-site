// pages/access/[sessionId].js
// User lands here after Stripe payment — we verify and show content

import Head from 'next/head';
import { useState, useEffect } from 'react';
import Stripe from 'stripe';
import { getPost, getPurchase } from '../../lib/db';

export default function AccessPage({ post, error }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="error-page">
        <div className="error-box">
          <div className="eyebrow">ACCESS DENIED</div>
          <h1>Invalid or Expired Link</h1>
          <p>This access link is not valid. If you completed payment, please check your email for your access link.</p>
          <a href="/">← Return to Vault</a>
        </div>
        <style jsx>{`
          .error-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .error-box { text-align: center; padding: 2rem; max-width: 400px; }
          .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.3em; color: var(--red-bright); margin-bottom: 1rem; }
          h1 { font-family: 'Bebas Neue', sans-serif; font-size: 2.5rem; margin-bottom: 1rem; }
          p { color: var(--white-dim); font-style: italic; margin-bottom: 2rem; }
          a { color: var(--gold); font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; letter-spacing: 0.15em; }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Access Granted — {post.title}</title>
        <meta name="robots" content="noindex, nofollow" />
        {/* Prevent sharing/saving */}
        <style>{`
          body { -webkit-user-select: none; user-select: none; }
          img, video { pointer-events: none; -webkit-user-drag: none; }
        `}</style>
      </Head>

      <div className="access-page">
        <div className="access-header">
          <div className="eyebrow">✓ PAYMENT VERIFIED — ACCESS GRANTED</div>
          <h1>{post.title}</h1>
          <p className="save-link-note">
            Save this page URL to access later.
            <button className="copy-btn" onClick={copyLink}>
              {copied ? '✓ COPIED' : 'COPY LINK'}
            </button>
          </p>
        </div>

        <div className="content-area">
          {post.type === 'image' && (
            // onContextMenu disabled to prevent right-click save
            <img
              src={post.content_url}
              alt={post.title}
              onContextMenu={(e) => e.preventDefault()}
              draggable="false"
            />
          )}
          {post.type === 'video' && (
            <video
              controls
              controlsList="nodownload nofullscreen"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
            >
              <source src={post.content_url} />
            </video>
          )}
          {post.type === 'text' && (
            <div className="text-content" onCopy={(e) => e.preventDefault()}>
              {post.content_text}
            </div>
          )}
        </div>

        <div className="access-footer">
          <a href="/">← Back to The Vault</a>
          <span>This link is yours. Do not share.</span>
        </div>
      </div>

      <style jsx>{`
        .access-page { max-width: 900px; margin: 0 auto; padding: 3rem 1.5rem; }
        .access-header { text-align: center; margin-bottom: 3rem; }
        .eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.3em;
          color: var(--gold);
          margin-bottom: 1rem;
        }
        h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(2.5rem, 8vw, 5rem);
          margin-bottom: 1rem;
        }
        .save-link-note {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: var(--white-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        .copy-btn {
          background: none;
          border: 1px solid var(--gold-dim);
          color: var(--gold);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          padding: 0.3rem 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .copy-btn:hover { background: var(--gold); color: var(--black); }
        .content-area {
          border: 1px solid var(--border);
          background: var(--surface);
          padding: 2rem;
          margin-bottom: 2rem;
        }
        .content-area img, .content-area video {
          width: 100%;
          max-height: 80vh;
          object-fit: contain;
          display: block;
        }
        .text-content {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem;
          line-height: 1.8;
          color: var(--white);
          white-space: pre-wrap;
        }
        .access-footer {
          display: flex;
          justify-content: space-between;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          color: var(--white-dim);
          letter-spacing: 0.1em;
        }
        .access-footer a { color: var(--gold); }
      `}</style>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const { sessionId } = params;

  try {
    // Verify Stripe session is paid
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return { props: { error: 'Payment not complete', post: null } };
    }

    const { postId } = session.metadata;
    const post = await getPost(postId, { includeContent: true }); // Get full content URL
    if (!post) return { props: { error: 'Content not found', post: null } };

    return { props: { post, error: null } };
  } catch (err) {
    console.error(err);
    return { props: { error: 'Invalid session', post: null } };
  }
}
