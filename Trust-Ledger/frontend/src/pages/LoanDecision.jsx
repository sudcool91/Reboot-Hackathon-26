import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { getLoanApplications } from '../services/api';

/* ── helpers ─────────────────────────────────────────────── */
function fmtAmount(raw) {
  if (!raw) return '—';
  const s = String(raw);
  if (s.startsWith('GBP ')) return '£' + s.slice(4);
  if (s.startsWith('£')) return s;
  const n = Number(s.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? s : '£' + n.toLocaleString();
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function pseudoHash(id) {
  let h = 0;
  for (let c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return '0x' + h.toString(16).padStart(8, '0') + (h ^ 0xdeadbeef).toString(16).padStart(8, '0');
}

function pseudoBlock(id, idx) {
  let h = 0;
  for (let c of String(id)) h = (h * 17 + c.charCodeAt(0)) >>> 0;
  return (48200 + (h % 800) + idx).toLocaleString();
}

const STATUS_COLOR = {
  'auto-eligible':  { bg: '#E2EEE7', color: '#024731',  dot: '#22C55E' },
  'auto_eligible':  { bg: '#E2EEE7', color: '#024731',  dot: '#22C55E' },
  'approved':       { bg: '#E2EEE7', color: '#024731',  dot: '#22C55E' },
  'pending':        { bg: '#FEF3C7', color: '#854F0B',  dot: '#F59E0B' },
  'pending docs':   { bg: '#FEF3C7', color: '#854F0B',  dot: '#F59E0B' },
  'manual review':  { bg: '#FEF3C7', color: '#854F0B',  dot: '#F59E0B' },
  'rejected':       { bg: '#FCEBEB', color: '#A32D2D',  dot: '#EF4444' },
  'declined':       { bg: '#FCEBEB', color: '#A32D2D',  dot: '#EF4444' },
};

function getStatusStyle(st) {
  return STATUS_COLOR[(st || '').toLowerCase()] || { bg: '#F0EFE6', color: '#6A6A5A', dot: '#9A9A8A' };
}

function ScoreDial({ score }) {
  if (!score) return <div style={{ fontSize: 12, color: '#9A9A8A' }}>N/A</div>;
  const r = 28, circ = 2 * Math.PI * r;
  const pct = Math.min(score / 1000, 1);
  const col = score >= 750 ? '#22C55E' : score >= 650 ? '#F59E0B' : '#EF4444';
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(2,71,49,0.1)" strokeWidth="6"/>
      <circle cx="36" cy="36" r={r} fill="none" stroke={col} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} transform="rotate(-90 36 36)"/>
      <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="800" fill="#1A1A14" fontFamily="-apple-system,sans-serif">{score}</text>
    </svg>
  );
}

const FILTERS = ['All', 'Auto-eligible', 'Approved', 'Pending', 'Manual review', 'Rejected'];

/* ── main component ──────────────────────────────────────── */
export default function LoanDecision({ onNavigate, notifications = [] }) {
  const [loans,      setLoans]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState(null);
  const [filter,     setFilter]     = useState('All');
  const [search,     setSearch]     = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getLoanApplications()
      .then(d => {
        const arr = Array.isArray(d) ? d : (d?.applications || []);
        setLoans([...arr].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
      })
      .catch(() => setLoans([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (id) => setExpanded(e => e === id ? null : id);

  const visible = loans.filter(a => {
    const st = (a.status || a.applicationStatus || '').toLowerCase();
    const matchFilter =
      filter === 'All' ||
      (filter === 'Auto-eligible' && (st === 'auto-eligible' || st === 'auto_eligible')) ||
      (filter === 'Approved'      && st === 'approved') ||
      (filter === 'Pending'       && (st === 'pending' || st === 'pending docs')) ||
      (filter === 'Manual review' && st === 'manual review') ||
      (filter === 'Rejected'      && (st === 'rejected' || st === 'declined'));
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (a.applicantName || a.customerName || '').toLowerCase().includes(q) ||
      (a.applicationId || a.id || '').toLowerCase().includes(q) ||
      (a.product || a.productType || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = {
    total:   loans.length,
    approved: loans.filter(a => ['approved','auto-eligible','auto_eligible'].includes((a.status||'').toLowerCase())).length,
    pending:  loans.filter(a => ['pending','pending docs','manual review'].includes((a.status||'').toLowerCase())).length,
    rejected: loans.filter(a => ['rejected','declined'].includes((a.status||'').toLowerCase())).length,
  };

  return (
    <div className="main">
      <Navbar crumb="Loan ledger" onFluid={() => onNavigate('fluid_overview')} variant="admin" notifications={notifications} />
      <div className="content" style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#1A1A14', letterSpacing: '-0.5px' }}>
                🔗 Loan Application Ledger
              </div>
              <div style={{ fontSize: 13, color: '#6A6A5A', marginTop: 4 }}>
                Immutable record of every loan application — linked, hashed, and timestamped on-chain.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E2EEE7', border: '1px solid #C6E8D4', borderRadius: 20, padding: '5px 12px', fontSize: 11, color: '#024731', fontWeight: 700 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 6px #22C55E' }}/>
                CHAIN LIVE
              </div>
              <button onClick={load} style={{ background: '#024731', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total records',  value: counts.total,    icon: '📋', col: '#024731', bg: 'linear-gradient(135deg,#024731,#036844)' },
            { label: 'Approved',       value: counts.approved, icon: '✅', col: '#065F46', bg: 'linear-gradient(135deg,#065F46,#059669)' },
            { label: 'Under review',   value: counts.pending,  icon: '⏳', col: '#854F0B', bg: 'linear-gradient(135deg,#854F0B,#B45309)' },
            { label: 'Rejected',       value: counts.rejected, icon: '❌', col: '#A32D2D', bg: 'linear-gradient(135deg,#A32D2D,#DC2626)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '16px 18px', color: '#fff' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Search + filter ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #E2E0D2', borderRadius: 10, padding: '8px 12px' }}>
            <span style={{ color: '#9A9A8A', fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, ID, product, email…"
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#1A1A14', background: 'transparent', width: '100%', fontFamily: 'inherit' }} />
            {search && <span onClick={() => setSearch('')} style={{ cursor: 'pointer', color: '#9A9A8A', fontSize: 12 }}>✕</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                background: filter === f ? '#024731' : '#F2F0E6',
                color: filter === f ? '#fff' : '#4A4A40',
                border: filter === f ? '1.5px solid #024731' : '1.5px solid #E2E0D2',
                transition: 'all 0.15s',
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* ── Chain view ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9A9A8A' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⛓️</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Loading ledger blocks…</div>
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9A9A8A' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 14 }}>{loans.length === 0 ? 'No loan applications recorded yet.' : 'No applications match filters.'}</div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Vertical chain line */}
            <div style={{ position: 'absolute', left: 27, top: 40, bottom: 20, width: 2, background: 'linear-gradient(180deg,#024731 0%,rgba(2,71,49,0.1) 100%)', zIndex: 0, borderRadius: 2 }}/>

            {visible.map((app, idx) => {
              const id = app.applicationId || app.id || String(idx);
              const name = app.applicantName || app.customerName || 'Unknown';
              const initials = name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??';
              const st = app.status || app.applicationStatus || 'Pending';
              const ss = getStatusStyle(st);
              const isOpen = expanded === id;
              const txHash = pseudoHash(id);
              const blockNo = pseudoBlock(id, idx);
              const isChain = (app.kycSource || '').startsWith('On-chain');

              return (
                <motion.div key={id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  style={{ position: 'relative', zIndex: 1, marginBottom: 12 }}>

                  {/* Block node on chain */}
                  <div style={{ position: 'absolute', left: 19, top: 22, width: 18, height: 18, borderRadius: 5, background: ss.dot, border: '2.5px solid #fff', boxShadow: `0 0 8px ${ss.dot}66`, zIndex: 2 }}/>

                  {/* Card */}
                  <div style={{ marginLeft: 52, background: '#fff', border: `1.5px solid ${isOpen ? '#024731' : '#E2E0D2'}`, borderRadius: 16, overflow: 'hidden', boxShadow: isOpen ? '0 4px 20px rgba(2,71,49,0.12)' : '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}>

                    {/* Collapsed row */}
                    <div onClick={() => toggle(id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}>
                      {/* Avatar */}
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#024731,#0B5C3F)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                        {initials}
                      </div>

                      {/* Name + product */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A14', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {name}
                          {isChain && <span style={{ fontSize: 10, background: '#E2EEE7', color: '#024731', border: '1px solid #C6E8D4', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>⛓ ON-CHAIN KYC</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#9A9A8A', marginTop: 2, fontFamily: 'monospace' }}>
                          {id} · blk #{blockNo}
                        </div>
                      </div>

                      {/* Product chip */}
                      <div style={{ flexShrink: 0, background: '#F2F0E6', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#4A4A40', whiteSpace: 'nowrap' }}>
                        {app.product || app.productType || app.loanType || '—'}
                      </div>

                      {/* Amount */}
                      <div style={{ flexShrink: 0, fontWeight: 800, fontSize: 15, color: '#024731', minWidth: 80, textAlign: 'right' }}>
                        {fmtAmount(app.amount)}
                      </div>

                      {/* Status */}
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, background: ss.bg, color: ss.color, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: ss.dot, display: 'inline-block' }}/>
                        {st}
                      </div>

                      {/* Date */}
                      <div style={{ flexShrink: 0, fontSize: 10, color: '#9A9A8A', minWidth: 72, textAlign: 'right' }}>
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                      </div>

                      {/* Chevron */}
                      <div style={{ flexShrink: 0, color: '#9A9A8A', fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</div>
                    </div>

                    {/* Expanded panel */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div key="exp" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                          <div style={{ borderTop: '1px solid #E8F5EE', background: '#F8FCF9', padding: '20px 18px' }}>

                            {/* Blockchain header */}
                            <div style={{ background: 'linear-gradient(90deg,#024731,#036844)', borderRadius: 10, padding: '10px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#A8D4B8' }}>
                                <span style={{ color: '#fff', fontWeight: 700 }}>TX</span> {txHash}
                              </div>
                              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#A8D4B8' }}>
                                Block <span style={{ color: '#fff', fontWeight: 700 }}>#{blockNo}</span> · 4/4 confirmations · {fmtDate(app.createdAt)}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 16 }}>
                              {[
                                ['Applicant',        name],
                                ['Email',            app.email || '—'],
                                ['Phone',            app.phone || '—'],
                                ['Product',          app.product || app.productType || '—'],
                                ['Amount',           fmtAmount(app.amount)],
                                ['Target bank',      app.targetBank || '—'],
                                ['Employment',       app.employmentStatus || '—'],
                                ['Annual income',    app.annualIncome ? '£' + Number(app.annualIncome).toLocaleString() : '—'],
                                ['Loan term',        app.loanTerm ? app.loanTerm + ' months' : '—'],
                                ['Date of birth',    app.dob || '—'],
                                ['Address',          app.address || '—'],
                                ['Purpose',          app.purpose || '—'],
                                ['Existing debts',   app.existingDebts ? '£' + Number(app.existingDebts).toLocaleString() + '/mo' : '—'],
                                ['KYC source',       app.kycSource || '—'],
                                ['Credential ID',    app.credentialId || '—'],
                              ].map(([label, value]) => (
                                <div key={label} style={{ background: '#fff', border: '1px solid #C6E8D4', borderRadius: 10, padding: '10px 14px' }}>
                                  <div style={{ fontSize: 10, color: '#9A9A8A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                                  <div style={{ fontSize: 13, color: '#1A1A14', fontWeight: 600, wordBreak: 'break-all' }}>{value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Credit score + policy trace row */}
                            <div style={{ display: 'grid', gridTemplateColumns: app.creditScore ? '120px 1fr' : '1fr', gap: 12 }}>
                              {app.creditScore && (
                                <div style={{ background: '#fff', border: '1px solid #C6E8D4', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                                  <ScoreDial score={app.creditScore} />
                                  <div style={{ fontSize: 10, color: '#6A6A5A', marginTop: 4, fontWeight: 700 }}>CREDIT SCORE</div>
                                </div>
                              )}
                              <div style={{ background: '#0D1F14', borderRadius: 10, padding: '14px 16px', fontFamily: 'monospace', fontSize: 11, color: '#4DFF9A', lineHeight: 1.8, overflowX: 'auto' }}>
                                <div style={{ color: '#A8D4B8', marginBottom: 6, fontWeight: 700 }}>// Smart contract policy trace</div>
                                <div>verifyKYC(<span style={{color:'#FFD700'}}>{app.credentialId || 'pending'}</span>) → valid: <span style={{color: isChain ? '#4DFF9A' : '#F59E0B'}}>{isChain ? 'true' : 'unverified'}</span></div>
                                <div>policyEngine.evaluate(</div>
                                <div>&nbsp;&nbsp;amount=<span style={{color:'#FFD700'}}>{String(app.amount||0).replace(/[^0-9]/g,'')}</span>,</div>
                                <div>&nbsp;&nbsp;credit_score=<span style={{color:'#FFD700'}}>{app.creditScore || 'N/A'}</span>,</div>
                                <div>&nbsp;&nbsp;employment=<span style={{color:'#FFD700'}}>"{app.employmentStatus || 'unknown'}"</span></div>
                                <div>) → status: <span style={{ color: ss.dot, fontWeight: 700 }}>"{st}"</span></div>
                                <div style={{marginTop:6,color:'#6A9A7A'}}>// Ledger hash: {txHash}</div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {visible.length > 0 && !loading && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#9A9A8A', marginTop: 8 }}>
            Showing {visible.length} of {loans.length} ledger records
          </div>
        )}
      </div>
    </div>
  );
}
