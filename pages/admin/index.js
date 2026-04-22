// pages/admin/index.js
// Password-protected admin dashboard

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState('content'); // content | analytics | links
  const [posts, setPosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simple client-side auth (server validates on every API call too)
  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem('admin_token', password);
      setAuthed(true);
      loadData();
    } else {
      setAuthError('Incorrect password');
    }
  };

  const adminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-token': sessionStorage.getItem('admin_token') || '',
  });

  const loadData = async () => {
    setLoading(true);
    const [postsRes, analyticsRes] = await Promise.all([
      fetch('/api/admin/posts', { headers: adminHeaders() }),
      fetch('/api/admin/analytics', { headers: adminHeaders() }),
    ]);
    if (postsRes.ok) setPosts(await postsRes.json());
    if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
    setLoading(false);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) { setAuthed(true); loadData(); }
  }, []);

  if (!authed) {
    return (
      <div className="login-screen">
        <Head><title>Admin — The Vault</title><meta name="robots" content="noindex"/></Head>
        <div className="login-box">
          <div className="login-logo">⬡</div>
          <h1>ADMIN ACCESS</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {authError && <div className="auth-error">{authError}</div>}
            <button type="submit">ENTER</button>
          </form>
        </div>
        <style jsx>{`
          .login-screen {
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            background: var(--void);
          }
          .login-box {
            background: var(--surface); border: 1px solid var(--gold-dim);
            padding: 3rem 2.5rem; width: 340px; text-align: center;
          }
          .login-logo { font-size: 2rem; color: var(--gold); margin-bottom: 1rem; }
          h1 { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 2rem; }
          input {
            width: 100%; background: var(--surface-2); border: 1px solid var(--border);
            color: var(--white); padding: 0.9rem 1rem; font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem; margin-bottom: 0.75rem; outline: none;
          }
          input:focus { border-color: var(--gold-dim); }
          button {
            width: 100%; background: var(--gold); color: var(--black);
            font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;
            letter-spacing: 0.2em; padding: 1rem; transition: all 0.2s;
          }
          button:hover { background: var(--gold-light); }
          .auth-error { color: #ff6b6b; font-size: 0.7rem; margin-bottom: 0.75rem; font-family: 'JetBrains Mono', monospace; }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head><title>Admin Dashboard — The Vault</title><meta name="robots" content="noindex"/></Head>
      <div className="admin">
        <aside className="sidebar">
          <div className="sidebar-logo">⬡ VAULT ADMIN</div>
          <nav>
            {['content', 'analytics', 'links'].map(t => (
              <button
                key={t}
                className={`nav-item ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'content' && '📁'} {t === 'analytics' && '📊'} {t === 'links' && '🔗'}
                {' '}{t.toUpperCase()}
              </button>
            ))}
          </nav>
          <button className="logout" onClick={() => { sessionStorage.clear(); setAuthed(false); }}>
            LOGOUT
          </button>
        </aside>

        <main className="admin-main">
          {tab === 'content' && <ContentTab posts={posts} adminHeaders={adminHeaders} reload={loadData} />}
          {tab === 'analytics' && <AnalyticsTab data={analytics} />}
          {tab === 'links' && <LinksTab posts={posts} adminHeaders={adminHeaders} />}
        </main>
      </div>

      <style jsx>{`
        .admin { display: flex; min-height: 100vh; }
        .sidebar {
          width: 220px; background: var(--surface); border-right: 1px solid var(--border);
          display: flex; flex-direction: column; padding: 1.5rem 0; flex-shrink: 0;
          position: sticky; top: 0; height: 100vh;
        }
        .sidebar-logo {
          font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;
          letter-spacing: 0.15em; color: var(--gold); padding: 0 1.5rem; margin-bottom: 2rem;
        }
        nav { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; padding: 0 0.75rem; }
        .nav-item {
          background: none; color: var(--white-dim); font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem; letter-spacing: 0.15em; padding: 0.75rem 1rem;
          text-align: left; transition: all 0.2s; border-radius: 2px;
        }
        .nav-item:hover, .nav-item.active { background: rgba(201,168,76,0.1); color: var(--gold); }
        .logout {
          margin: 0 0.75rem; background: none; color: #333; font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem; letter-spacing: 0.15em; padding: 0.75rem 1rem; text-align: left;
          border-top: 1px solid var(--border); transition: color 0.2s;
        }
        .logout:hover { color: var(--red-bright); }
        .admin-main { flex: 1; padding: 2rem; overflow-y: auto; }
        @media (max-width: 700px) {
          .admin { flex-direction: column; }
          .sidebar { width: 100%; height: auto; position: static; flex-direction: row; flex-wrap: wrap; padding: 1rem; }
          nav { flex-direction: row; }
        }
      `}</style>
    </>
  );
}

// ─── Content Management Tab ────────────────────────────────────────────────────
function ContentTab({ posts, adminHeaders, reload }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', price: '', currency: 'usd', type: 'image', content_url: '', content_text: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const price = Math.round(parseFloat(form.price) * 100); // convert to cents
    await fetch('/api/admin/posts', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ ...form, price }),
    });
    setShowForm(false);
    setForm({ title: '', price: '', currency: 'usd', type: 'image', content_url: '', content_text: '' });
    reload();
    setSaving(false);
  };

  const deletePost = async (id) => {
    if (!confirm('Delete this content?')) return;
    await fetch(`/api/admin/posts/${id}`, { method: 'DELETE', headers: adminHeaders() });
    reload();
  };

  const togglePublish = async (post) => {
    await fetch(`/api/admin/posts/${post.id}`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ published: !post.published }),
    });
    reload();
  };

  return (
    <div>
      <div className="tab-header">
        <h2>CONTENT</h2>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ CANCEL' : '+ ADD CONTENT'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>NEW CONTENT</h3>
          <div className="form-grid">
            <label>Title
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Access Level I" />
            </label>
            <label>Price ($)
              <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="9.99" />
            </label>
            <label>Currency
              <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
                <option value="cad">CAD</option>
                <option value="aud">AUD</option>
              </select>
            </label>
            <label>Type
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="text">Text</option>
              </select>
            </label>
            {form.type !== 'text' && (
              <label className="full-width">Content URL (from your cloud storage)
                <input value={form.content_url} onChange={e => setForm({...form, content_url: e.target.value})} placeholder="https://your-storage.com/file.jpg" />
              </label>
            )}
            {form.type === 'text' && (
              <label className="full-width">Content Text
                <textarea rows={6} value={form.content_text} onChange={e => setForm({...form, content_text: e.target.value})} placeholder="Your premium text content..." />
              </label>
            )}
          </div>
          <button className="save-btn" onClick={save} disabled={saving}>
            {saving ? 'SAVING...' : 'SAVE CONTENT'}
          </button>
        </div>
      )}

      <div className="posts-list">
        {posts.map(post => (
          <div className="post-row" key={post.id}>
            <div className="post-info">
              <span className="post-type-badge">{post.type}</span>
              <span className="post-title">{post.title}</span>
            </div>
            <div className="post-meta">
              <span className="post-price">${(post.price / 100).toFixed(2)}</span>
              <button className={`publish-toggle ${post.published ? 'live' : 'draft'}`} onClick={() => togglePublish(post)}>
                {post.published ? 'LIVE' : 'DRAFT'}
              </button>
              <button className="delete-btn" onClick={() => deletePost(post.id)}>✕</button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="empty">No content yet. Add your first item above.</p>}
      </div>

      <style jsx>{`
        .tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        h2 { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; letter-spacing: 0.1em; }
        .add-btn {
          background: var(--gold); color: var(--black); font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem; letter-spacing: 0.15em; padding: 0.6rem 1.2rem; transition: all 0.2s;
        }
        .add-btn:hover { background: var(--gold-light); }
        .form-card { background: var(--surface); border: 1px solid var(--border); padding: 1.5rem; margin-bottom: 2rem; }
        .form-card h3 { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: 0.1em; margin-bottom: 1rem; color: var(--gold); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .full-width { grid-column: 1 / -1; }
        label { display: flex; flex-direction: column; gap: 0.4rem; font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; letter-spacing: 0.1em; color: var(--white-dim); }
        label input, label select, label textarea {
          background: var(--surface-2); border: 1px solid var(--border); color: var(--white);
          padding: 0.6rem 0.75rem; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;
          outline: none; transition: border-color 0.2s; resize: vertical;
        }
        label input:focus, label select:focus, label textarea:focus { border-color: var(--gold-dim); }
        .save-btn {
          background: var(--gold); color: var(--black); font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem; letter-spacing: 0.2em; padding: 0.75rem 2rem;
        }
        .posts-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .post-row {
          display: flex; justify-content: space-between; align-items: center;
          background: var(--surface); border: 1px solid var(--border); padding: 1rem 1.25rem;
        }
        .post-info { display: flex; align-items: center; gap: 0.75rem; }
        .post-type-badge {
          font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; letter-spacing: 0.1em;
          color: var(--gold); background: rgba(201,168,76,0.1); border: 1px solid var(--gold-dim);
          padding: 0.2rem 0.5rem;
        }
        .post-title { font-family: 'Cormorant Garamond', serif; font-size: 1rem; color: var(--white); }
        .post-meta { display: flex; align-items: center; gap: 0.75rem; }
        .post-price { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--gold); }
        .publish-toggle {
          font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; letter-spacing: 0.15em;
          padding: 0.3rem 0.6rem; border: 1px solid; transition: all 0.2s;
          background: none;
        }
        .publish-toggle.live { color: #4caf50; border-color: #4caf50; }
        .publish-toggle.draft { color: #666; border-color: #333; }
        .delete-btn { background: none; color: #444; font-size: 0.8rem; padding: 0.3rem 0.5rem; transition: color 0.2s; }
        .delete-btn:hover { color: var(--red-bright); }
        .empty { color: var(--white-dim); font-style: italic; font-family: 'Cormorant Garamond', serif; padding: 2rem 0; }
      `}</style>
    </div>
  );
}

// ─── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({ data }) {
  if (!data) return <p style={{color:'var(--white-dim)'}}>Loading...</p>;
  return (
    <div>
      <h2 style={{fontFamily:'Bebas Neue',fontSize:'2rem',letterSpacing:'0.1em',marginBottom:'1.5rem'}}>ANALYTICS</h2>
      <div className="stat-grid">
        <StatCard label="Total Revenue" value={`$${(data.totalRevenue / 100).toFixed(2)}`} />
        <StatCard label="Total Purchases" value={data.totalPurchases} />
        <StatCard label="This Month" value={`$${(data.monthRevenue / 100).toFixed(2)}`} />
        <StatCard label="Avg. Sale" value={`$${(data.avgSale / 100).toFixed(2)}`} />
      </div>

      <h3 style={{fontFamily:'Bebas Neue',fontSize:'1.3rem',letterSpacing:'0.1em',margin:'2rem 0 1rem',color:'var(--gold)'}}>
        TOP PERFORMING CONTENT
      </h3>
      <div className="leaderboard">
        {data.topPosts?.map((p, i) => (
          <div className="lb-row" key={p.id}>
            <span className="lb-rank">#{i + 1}</span>
            <span className="lb-title">{p.title}</span>
            <span className="lb-count">{p.purchases} sales</span>
            <span className="lb-rev">${(p.revenue / 100).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
        .leaderboard { display: flex; flex-direction: column; gap: 0.5rem; }
        .lb-row {
          display: flex; align-items: center; gap: 1rem;
          background: var(--surface); border: 1px solid var(--border); padding: 0.85rem 1.25rem;
          font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;
        }
        .lb-rank { color: var(--gold); width: 30px; }
        .lb-title { flex: 1; color: var(--white); }
        .lb-count { color: var(--white-dim); }
        .lb-rev { color: var(--gold); }
      `}</style>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{
      background:'var(--surface)', border:'1px solid var(--border)',
      padding:'1.5rem', textAlign:'center'
    }}>
      <div style={{fontFamily:'JetBrains Mono',fontSize:'0.6rem',letterSpacing:'0.2em',color:'var(--white-dim)',marginBottom:'0.5rem'}}>{label}</div>
      <div style={{fontFamily:'Bebas Neue',fontSize:'2.2rem',color:'var(--gold)',letterSpacing:'0.05em'}}>{value}</div>
    </div>
  );
}

// ─── Unique Links Tab ──────────────────────────────────────────────────────────
function LinksTab({ posts, adminHeaders }) {
  const [selectedPost, setSelectedPost] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    const res = await fetch('/api/admin/generate-link', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ postId: selectedPost }),
    });
    const data = await res.json();
    setGeneratedLink(data.url);
  };

  const copy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <h2 style={{fontFamily:'Bebas Neue',fontSize:'2rem',letterSpacing:'0.1em',marginBottom:'0.5rem'}}>UNIQUE LINKS</h2>
      <p style={{color:'var(--white-dim)',fontStyle:'italic',fontFamily:'Cormorant Garamond',marginBottom:'2rem'}}>
        Generate direct unlock links to share in DMs or socials.
      </p>
      <div style={{display:'flex',gap:'1rem',marginBottom:'1rem',flexWrap:'wrap'}}>
        <select
          value={selectedPost}
          onChange={e => setSelectedPost(e.target.value)}
          style={{
            background:'var(--surface-2)', border:'1px solid var(--border)',
            color:'var(--white)', padding:'0.75rem 1rem',
            fontFamily:'JetBrains Mono', fontSize:'0.75rem', minWidth:'220px', outline:'none'
          }}
        >
          <option value="">Select content...</option>
          {posts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <button
          onClick={generateLink} disabled={!selectedPost}
          style={{
            background:'var(--gold)', color:'var(--black)', fontFamily:'JetBrains Mono',
            fontSize:'0.7rem', letterSpacing:'0.15em', padding:'0.75rem 1.5rem',
            opacity: selectedPost ? 1 : 0.5
          }}
        >
          GENERATE LINK
        </button>
      </div>
      {generatedLink && (
        <div style={{background:'var(--surface)',border:'1px solid var(--gold-dim)',padding:'1.25rem',display:'flex',gap:'1rem',alignItems:'center',flexWrap:'wrap'}}>
          <code style={{flex:1,fontFamily:'JetBrains Mono',fontSize:'0.7rem',color:'var(--gold)',wordBreak:'break-all'}}>{generatedLink}</code>
          <button onClick={copy} style={{
            background:'none', border:'1px solid var(--gold-dim)', color:'var(--gold)',
            fontFamily:'JetBrains Mono', fontSize:'0.6rem', letterSpacing:'0.15em',
            padding:'0.5rem 1rem', transition:'all 0.2s', flexShrink:0
          }}>
            {copied ? '✓ COPIED' : 'COPY'}
          </button>
        </div>
      )}
    </div>
  );
}
