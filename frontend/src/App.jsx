import React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link2, Copy, Check, ExternalLink, Trash2, MousePointerClick, Plus, Search, Zap, ShieldCheck, BarChart3 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const prettyDate = value => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default function App() {
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [filter, setFilter] = useState('');

  const loadLinks = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/links`);
      if (!response.ok) throw new Error('Unable to load links. Is the API running?');
      setLinks(await response.json());
      setError('');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadLinks(); }, [loadLinks]);

  async function createLink(event) {
    event.preventDefault(); setError(''); setCreating(true);
    try {
      const response = await fetch(`${API}/api/links`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not create short link.');
      setLinks(current => [data, ...current]); setUrl('');
    } catch (e) { setError(e.message); }
    finally { setCreating(false); }
  }

  async function copyLink(link) {
    try { await navigator.clipboard.writeText(link.shortUrl); setCopied(link._id); setTimeout(() => setCopied(''), 1600); }
    catch { setError('Clipboard access failed. Copy the URL manually.'); }
  }

  async function deleteLink(id) {
    if (!window.confirm('Delete this short link?')) return;
    try {
      const response = await fetch(`${API}/api/links/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not delete link.');
      setLinks(current => current.filter(link => link._id !== id));
    } catch (e) { setError(e.message); }
  }

  const totalClicks = useMemo(() => links.reduce((sum, link) => sum + (link.clicks || 0), 0), [links]);
  const filtered = useMemo(() => links.filter(link => `${link.originalUrl} ${link.shortCode}`.toLowerCase().includes(filter.toLowerCase())), [links, filter]);

  return <main className="page-shell">
    <nav className="topbar"><a className="brand" href="#top"><span className="brand-icon"><Link2 size={21}/></span> linkly<span className="brand-dot">.</span></a><span className="nav-note"><span className="status-dot"/> Simple links. Better reach.</span></nav>
    <section className="hero" id="top">
      <div className="eyebrow"><Zap size={14}/> YOUR LINKS, SIMPLIFIED</div>
      <h1>Shorten links.<br/><span>Share more.</span></h1>
      <p className="hero-copy">Turn long, messy URLs into clean links you can share anywhere. Track every click, all in one place.</p>
      <form className="shorten-form" onSubmit={createLink}>
        <div className="url-input-wrap"><Link2 size={19}/><input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste your long URL here..." required aria-label="Long URL"/></div>
        <button className="primary-btn" disabled={creating}>{creating ? 'Creating…' : <><span>Shorten URL</span><Plus size={17}/></>}</button>
      </form>
      {error && <div className="error-message" role="alert">{error}</div>}
      <div className="trust-row"><span><ShieldCheck size={15}/> Free to use</span><span><Zap size={15}/> Instant redirects</span><span><BarChart3 size={15}/> Click analytics</span></div>
    </section>

    <section className="dashboard">
      <div className="section-heading"><div><div className="eyebrow muted">YOUR WORKSPACE</div><h2>Link dashboard</h2></div><span className="count-pill">{links.length} {links.length === 1 ? 'link' : 'links'}</span></div>
      <div className="stats-grid"><article className="stat-card"><div className="stat-icon purple"><Link2 size={18}/></div><div><p>Total links</p><strong>{links.length}</strong></div></article><article className="stat-card"><div className="stat-icon green"><MousePointerClick size={18}/></div><div><p>Total clicks</p><strong>{totalClicks.toLocaleString()}</strong></div></article><article className="stat-card"><div className="stat-icon orange"><BarChart3 size={18}/></div><div><p>Avg. clicks / link</p><strong>{links.length ? (totalClicks / links.length).toFixed(1) : '0'}</strong></div></article></div>
      <div className="links-panel"><div className="panel-toolbar"><div><h3>Recent links</h3><p>Manage and track your shortened URLs</p></div><label className="search-box"><Search size={16}/><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search links…" aria-label="Search links"/></label></div>
        {loading ? <div className="empty-state">Loading your links…</div> : filtered.length === 0 ? <div className="empty-state"><span className="empty-icon"><Link2 size={23}/></span><strong>{links.length ? 'No matching links' : 'No links yet'}</strong><p>{links.length ? 'Try another search term.' : 'Your shortened URLs will show up here. Create your first one above.'}</p></div> : <div className="table-wrap"><table><thead><tr><th>SHORT LINK</th><th>DESTINATION</th><th>CLICKS</th><th>CREATED</th><th aria-label="Actions"/></tr></thead><tbody>{filtered.map(link => <tr key={link._id}><td><div className="short-cell"><span className="link-mark"><Link2 size={15}/></span><a href={link.shortUrl} target="_blank" rel="noreferrer">{link.shortUrl.replace(/^https?:\/\//, '')}</a></div></td><td><span className="destination" title={link.originalUrl}>{link.originalUrl}</span></td><td><span className="click-count"><MousePointerClick size={14}/>{link.clicks || 0}</span></td><td><span className="date-text">{prettyDate(link.createdAt)}</span></td><td><div className="actions"><button className="icon-btn" onClick={() => copyLink(link)} title="Copy short link" aria-label="Copy short link">{copied === link._id ? <Check size={16}/> : <Copy size={16}/>}</button><a className="icon-btn" href={link.shortUrl} target="_blank" rel="noreferrer" title="Open short link" aria-label="Open short link"><ExternalLink size={16}/></a><button className="icon-btn delete" onClick={() => deleteLink(link._id)} title="Delete link" aria-label="Delete link"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>}
      </div>
    </section>
    <footer><span>© {new Date().getFullYear()} Linkly</span><span>Made for sharing <span className="heart">♥</span></span></footer>
  </main>;
}
