import React, { useEffect, useMemo, useState } from 'react';

const API = 'https://jsonplaceholder.typicode.com';
const gradients = ['violet', 'orange', 'mint', 'blue', 'rose', 'sunny'];
const categories = ['Perspectives', 'Field notes', 'Ideas', 'On the radar', 'Dispatches', 'Highlights'];

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  if (!response.ok) throw new Error(`Request failed (HTTP ${response.status}). Please try again.`);
  return response.json();
}
const initials = (name = '') => name.split(' ').slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase();
const Icon = ({ name, size = 19 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    close: <><path d="M6 6l12 12M18 6 6 18"/></>,
    refresh: <><path d="M20 11a8 8 0 1 0-2.5 6M20 4v7h-7"/></>,
    pen: <><path d="m16 4 4 4-11 11H5v-4L16 4Z"/><path d="m14 6 4 4"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c6 6 6 12 0 18M12 3C6 9 6 15 12 21"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    alert: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/></>,
    spark: <><path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

function PostCard({ post, author, onOpen }) {
  const variant = gradients[(post.id - 1) % gradients.length];
  return <article className="story-card">
    <button className={`story-art art-${variant}`} type="button" onClick={() => onOpen(post)} aria-label={`Read ${post.title}`}>
      <span className="art-grid" aria-hidden="true"/><span className="art-number">{String(post.id).padStart(2, '0')}</span><span className="art-mark" aria-hidden="true">✳</span><span className="art-label">THE SIGNAL / ISSUE {String(post.id).padStart(3, '0')}</span>
    </button>
    <div className="story-body"><div className="story-meta"><span className="story-category">{categories[(post.id - 1) % categories.length]}</span><span className="meta-sep">·</span><span>4 min read</span></div>
    <h3><button className="story-title-button" onClick={() => onOpen(post)} type="button">{post.title}</button></h3>
    <p className="story-excerpt">{post.body}</p>
    <div className="story-bottom"><div className="author"><span className="author-avatar">{initials(author?.name || 'Unknown author')}</span><span>{author?.name ?? 'Unknown author'}</span></div><button className="read-arrow" onClick={() => onOpen(post)} aria-label={`Open details: ${post.title}`} type="button"><Icon name="arrow"/></button></div></div>
  </article>;
}

export default function App() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [activePost, setActivePost] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorId, setAuthorId] = useState('1');
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoadStatus('loading');
    setLoadError('');
    Promise.all([apiRequest('/posts', { signal: controller.signal }), apiRequest('/users', { signal: controller.signal })])
      .then(([postData, userData]) => {
        if (!Array.isArray(postData) || !Array.isArray(userData)) throw new Error('The API returned unexpected data.');
        setPosts(postData); setUsers(userData); setLoadStatus('success');
      })
      .catch((error) => { if (error.name !== 'AbortError') { setLoadStatus('error'); setLoadError(error.message || 'Could not load stories.'); } });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    if (!activePost && !composeOpen) return;
    const onKeyDown = (event) => { if (event.key === 'Escape' && submitStatus !== 'pending') { setActivePost(null); setComposeOpen(false); } };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activePost, composeOpen, submitStatus]);

  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.filter((post) => (selectedUser === 'all' || post.userId === Number(selectedUser)) && (!query || `${post.title} ${post.body} ${userMap.get(post.userId)?.name || ''}`.toLowerCase().includes(query)));
  }, [posts, search, selectedUser, userMap]);

  const closeCompose = () => { if (submitStatus !== 'pending') setComposeOpen(false); };
  async function handlePublish(event) {
    event.preventDefault();
    if (submitStatus === 'pending' || !title.trim() || !body.trim()) return;
    setSubmitStatus('pending'); setSubmitMessage('');
    try {
      const result = await apiRequest('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), userId: Number(authorId) }),
      });
      if (!result || typeof result.id !== 'number') throw new Error('The API returned an unexpected response.');
      setSubmitStatus('success');
      setSubmitMessage(`Simulation successful! JSONPlaceholder returned post ID ${result.id}. This post was not saved permanently.`);
      setTitle(''); setBody('');
    } catch (error) { setSubmitStatus('error'); setSubmitMessage(error.message || 'Could not submit the post.'); }
  }

  return <div className="site-shell">
    <header className="header"><div className="header-inner"><a href="./" className="logo" aria-label="Signalboard homepage"><span className="logo-icon" aria-hidden="true">✳</span>signalboard<span className="logo-dot">.</span></a><nav className="header-nav" aria-label="Primary navigation"><a href="#stories">Explore</a><a href="#about">About the API</a></nav><button type="button" className="header-action" onClick={() => { setSubmitStatus('idle'); setSubmitMessage(''); setComposeOpen(true); }}><Icon name="pen" size={16}/> New story</button></div></header>

    <main>
      <section className="hero"><div className="hero-orbit orbit-one" aria-hidden="true"/><div className="hero-orbit orbit-two" aria-hidden="true"/><div className="hero-inner"><div className="hero-copy"><div className="hero-eyebrow"><span className="pulse"/> AN OPEN WINDOW INTO IDEAS</div><h1>Stories in<br/><em>motion.</em></h1><p>Discover interesting perspectives, explore the people behind them, and see a live API in action.</p><a href="#stories" className="hero-link">Explore the stories <Icon name="arrow" size={18}/></a></div><div className="hero-graphic" aria-hidden="true"><div className="graphic-ring ring-one"/><div className="graphic-ring ring-two"/><div className="graphic-center">S<span>✳</span></div><div className="graphic-tag tag-top">CREATIVE THINKING <span>↗</span></div><div className="graphic-tag tag-bottom"><span className="tag-pulse"/> LIVE API / CONNECTED</div><div className="graphic-tiny">THE INTERNET<br/>OF IDEAS — 001</div></div></div></section>

      <section className="content-section" id="stories"><div className="editorial-top"><div><span className="section-label">THE EDITORIAL FEED <span className="divider-line"/></span><h2>Explore the latest<span className="purple-period">.</span></h2><p>Real data. Fresh perspectives. Endless curiosity.</p></div><div className="feed-stat"><strong>{loadStatus === 'success' ? posts.length : '—'}</strong><span>STORIES TO EXPLORE</span></div></div>
      <div className="filters"><label className="search-field"><Icon name="search"/><span className="sr-only">Search stories and authors</span><input type="search" placeholder="Search stories, topics, authors..." value={search} onChange={(event) => setSearch(event.target.value)}/></label><label className="select-wrap"><span>AUTHOR</span><select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)}><option value="all">All authors</option>{users.map((user) => <option key={user.id} value={String(user.id)}>{user.name}</option>)}</select></label><button className="refresh-button" type="button" onClick={() => setReload((n) => n + 1)} disabled={loadStatus === 'loading'} title="Refresh stories"><Icon name="refresh" size={18}/><span>Refresh</span></button></div>
      {loadStatus === 'loading' && <div className="state-message" role="status"><div className="spinner"/><h3>Finding your next read...</h3><p>Connecting to the live JSONPlaceholder API.</p></div>}
      {loadStatus === 'error' && <div className="state-message" role="alert"><span className="state-icon"><Icon name="alert" size={30}/></span><h3>We couldn't load the stories</h3><p>{loadError}</p><button className="primary-button" type="button" onClick={() => setReload((n) => n + 1)}><Icon name="refresh" size={16}/> Try again</button></div>}
      {loadStatus === 'success' && <><div className="results-label">SHOWING <strong>{filtered.length}</strong> OF {posts.length} STORIES</div>{filtered.length ? <div className="story-grid">{filtered.map((post) => <PostCard key={post.id} post={post} author={userMap.get(post.userId)} onOpen={setActivePost}/>)}</div> : <div className="state-message" role="status"><span className="state-icon"><Icon name="search" size={30}/></span><h3>No matches this time</h3><p>Try another keyword or select a different author.</p><button className="secondary-button" type="button" onClick={() => { setSearch(''); setSelectedUser('all'); }}>Clear filters</button></div>}</>}
      </section>
      <section className="api-banner" id="about"><div className="api-icon"><Icon name="globe" size={26}/></div><div><span className="section-label">BUILT TO EXPLORE</span><h2>A real API, a safe playground.</h2><p>Stories and authors are fetched directly from <a href="https://jsonplaceholder.typicode.com" target="_blank" rel="noreferrer">JSONPlaceholder</a> in your browser. Creating a story sends a real POST request, but <strong>writes are simulated and never permanently saved.</strong> This is a frontend-only demo, with no server of its own.</p></div><button type="button" className="banner-button" onClick={() => { setSubmitStatus('idle'); setSubmitMessage(''); setComposeOpen(true); }}>Try a POST request <Icon name="arrow" size={18}/></button></section>
    </main>
    <footer className="footer"><span className="footer-logo">✳ signalboard.</span><span>Powered by curiosity &amp; JSONPlaceholder</span><span>Built for DeployMe ↗</span></footer>

    {activePost && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setActivePost(null); }}><section className="modal dialog-article" role="dialog" aria-modal="true" aria-labelledby="details-title"><div className="modal-header"><span className="section-label">STORY / {String(activePost.id).padStart(3, '0')}</span><button type="button" className="icon-button" onClick={() => setActivePost(null)} aria-label="Close story details"><Icon name="close"/></button></div><div className={`detail-art art-${gradients[(activePost.id - 1) % gradients.length]}`} aria-hidden="true"><span>THE SIGNAL</span><strong>✳</strong></div><div className="detail-content"><span className="story-category">{categories[(activePost.id - 1) % categories.length]}</span><h2 id="details-title">{activePost.title}</h2><div className="detail-author"><span className="author-avatar">{initials(userMap.get(activePost.userId)?.name || 'Unknown')}</span><span>By <strong>{userMap.get(activePost.userId)?.name ?? 'Unknown author'}</strong></span></div><p>{activePost.body}</p><div className="detail-note">Live content from JSONPlaceholder · Post #{activePost.id}</div></div></section></div>}

    {composeOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCompose(); }}><section className="modal compose-modal" role="dialog" aria-modal="true" aria-labelledby="compose-title"><div className="modal-header"><span className="section-label">CREATE SOMETHING NEW</span><button type="button" className="icon-button" onClick={closeCompose} disabled={submitStatus === 'pending'} aria-label="Close new story form"><Icon name="close"/></button></div><h2 id="compose-title">Share a story<span className="purple-period">.</span></h2><p className="compose-intro">Test a live POST request against the JSONPlaceholder API.</p><div className="simulation-info"><Icon name="alert" size={19}/><span>This is a simulated publish. JSONPlaceholder accepts the POST request but does <strong>not persist</strong> your story.</span></div><form onSubmit={handlePublish} className="compose-form"><label htmlFor="compose-title-input">Story title</label><input id="compose-title-input" placeholder="Give your story a title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={150} required disabled={submitStatus === 'pending'}/><label htmlFor="compose-author">Author</label><select id="compose-author" value={authorId} onChange={(event) => setAuthorId(event.target.value)} disabled={submitStatus === 'pending'}>{users.length ? users.map((user) => <option key={user.id} value={String(user.id)}>{user.name}</option>) : <option value="1">Demo author (ID 1)</option>}</select><label htmlFor="compose-body">Your story</label><textarea id="compose-body" placeholder="Write something worth sharing..." rows={6} value={body} onChange={(event) => setBody(event.target.value)} maxLength={3000} required disabled={submitStatus === 'pending'}/>{submitMessage && <div className={`submission-feedback ${submitStatus}`} role={submitStatus === 'error' ? 'alert' : 'status'}><Icon name={submitStatus === 'success' ? 'check' : 'alert'} size={18}/>{submitMessage}</div>}<button type="submit" className="primary-button publish-button" disabled={submitStatus === 'pending'}>{submitStatus === 'pending' ? 'Sending request...' : 'Simulate publish'} <Icon name="arrow" size={18}/></button></form></section></div>}
  </div>;
}
