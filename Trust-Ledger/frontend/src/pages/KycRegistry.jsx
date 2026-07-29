import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useStore } from '../store';
import { getKycRegistry, getShareRequests, submitShareRequest } from '../services/api';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const LBG_BANKS = [
  'Lloyds Bank', 'Halifax', 'Bank of Scotland', 'Scottish Widows',
  'MBNA', 'Black Horse', 'Lex Autolease', 'Lloyds Wealth', 'Lloyds Technology Centre',
];

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusColor(s) {
  if (s === 'Active') return { dot: '#059669', bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' };
  if (s === 'Expiring soon') return { dot: '#D97706', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' };
  return { dot: '#DC2626', bg: '#FEF2F2', text: '#7F1D1D', border: '#FCA5A5' };
}

/* =============================================
   CREDENTIAL DETAIL MODAL (popup on card click)
   ============================================= */
function CredentialModal({ row, shareRequests, onClose, onShare, onLedger }) {
  const clr = statusColor(row.status);
  const approvedBanks = shareRequests.filter(r => r.credentialId === row.credentialId && r.status === 'approved').map(r => r.targetBank);
  const pendingBanks  = shareRequests.filter(r => r.credentialId === row.credentialId && r.status === 'pending').map(r => r.targetBank);
  const txHash = row.txHash || ('0x' + (row.credentialId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 14) + '…');

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        style={{
          background: '#fff', borderRadius: 24, width: 540, maxWidth: '100%',
          boxShadow: '0 32px 80px rgba(2,71,49,0.18), 0 4px 16px rgba(0,0,0,0.08)',
          overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Lloyds green header */}
        <div style={{
          background: 'linear-gradient(135deg,#024731 0%,#036844 55%,#045C3B 100%)',
          padding: '24px 28px 20px', position: 'relative', flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14, width: 30, height: 30,
            borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900, color: '#fff',
            }}>{row.av}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{row.customerName}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{row.email || '—'}</div>
            </div>
          </div>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '5px 14px',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: clr.dot, display: 'inline-block' }} />
            {row.status}
          </span>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '22px 28px 28px' }}>
          {/* Credential ID */}
          <div style={{ background: '#F0FAF4', border: '1.5px solid #A7F3D0', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 700 }}>Credential ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#024731', wordBreak: 'break-all' }}>{row.credentialId}</div>
          </div>

          {/* Detail tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              ['Issuing Bank', row.issuer || 'Lloyds Bank'],
              ['Issued On', fmt(row.issuedOn)],
              ['Expires', fmt(row.expiresOn)],
              ['TX Hash', txHash],
              ['Phone', row.phone || '—'],
              ['Nationality', row.nationality || '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ background: '#FAFAF7', border: '1px solid #E8E7DD', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: '#9A9A8A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, fontWeight: 700 }}>{label}</div>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: '#1A1A14',
                  fontFamily: /hash|tx|cred/i.test(label) ? 'monospace' : 'inherit',
                  wordBreak: 'break-all',
                }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Cross-network access */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A14', marginBottom: 10 }}>Cross-network access</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {approvedBanks.length === 0 && pendingBanks.length === 0 && (
                <span style={{ fontSize: 12, color: '#9A9A8A', fontStyle: 'italic' }}>Lloyds Bank only — no shares yet</span>
              )}
              {approvedBanks.map((b, j) => (
                <span key={j} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: '#ECFDF5', color: '#065F46', fontWeight: 700, border: '1px solid #A7F3D0' }}>✓ {b}</span>
              ))}
              {pendingBanks.map((b, j) => (
                <span key={j} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: '#FFFBEB', color: '#92400E', fontWeight: 700, border: '1px solid #FDE68A' }}>⏳ {b}</span>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { onLedger(row); onClose(); }} style={{
              flex: 1, padding: '11px', borderRadius: 10,
              background: '#F0FAF4', border: '1.5px solid #A7F3D0',
              color: '#024731', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}>🔍 Ledger trail</button>
            {row.status !== 'Revoked' && (
              <button onClick={() => { onShare(row); onClose(); }} style={{
                flex: 1, padding: '11px', borderRadius: 10,
                background: '#024731', border: 'none',
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}>📤 Share credential</button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =============================================
   BANK PICKER MODAL
   ============================================= */
function BankPickerModal({ row, shareRequests, onPick, onCancel }) {
  const getShareStatus = (bank) => {
    const req = shareRequests.find(r => r.credentialId === row.credentialId && r.targetBank === bank);
    return req ? req.status : null;
  };
  const available = LBG_BANKS.filter(b => {
    const st = getShareStatus(b);
    return st !== 'approved' && st !== 'pending';
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        style={{ background: '#FAFAF7', borderRadius: 20, width: 400, boxShadow: '0 24px 80px rgba(0,0,0,0.25)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ background: 'linear-gradient(135deg,#024731,#036844)', padding: '18px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Share with LBG Bank</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>Choose a bank for {row.customerName}</div>
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {available.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: '#9A9A8A' }}>All LBG banks already have access or pending requests.</div>
          )}
          {available.map(b => (
            <div key={b}
              style={{ padding: '12px 22px', cursor: 'pointer', fontSize: 13, color: '#1A1A14', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F0FAF4'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => onPick(b)}
            >
              <span style={{ fontSize: 18 }}>🏦</span>
              <div style={{ flex: 1, fontWeight: 600 }}>{b}</div>
              <span style={{ fontSize: 11, color: '#9A9A8A' }}>→</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid #E8E7DD' }}>
          <button onClick={onCancel} style={{ width: '100%', padding: '10px', borderRadius: 10, background: '#F0EFE6', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#4A4A40' }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =============================================
   SHARE CONFIRMATION MODAL
   ============================================= */
function ShareRequestModal({ row, bank, onConfirm, onCancel, submitting }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        style={{ background: '#FAFAF7', borderRadius: 20, width: 440, padding: '28px 28px 24px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 32, marginBottom: 10, textAlign: 'center' }}>🏦</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#1A1A14', marginBottom: 8, textAlign: 'center' }}>Send share request?</div>
        <div style={{ fontSize: 13, color: '#4A4A40', marginBottom: 18, textAlign: 'center', lineHeight: 1.6 }}>
          A permission request will be sent to <b>{row.customerName || row.name}</b> asking them to consent
          to sharing their KYC credential with <b>{bank}</b>.
          <br /><span style={{ fontSize: 11, color: '#9A9A8A' }}>The customer must approve before the credential is shared.</span>
        </div>
        <div style={{ background: '#F0FAF4', border: '1px solid #C6E8D4', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 12 }}>
          <div style={{ color: '#9A9A8A', marginBottom: 2 }}>Credential</div>
          <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#024731' }}>{row.credentialId}</div>
          <div style={{ color: '#9A9A8A', marginTop: 8, marginBottom: 2 }}>Target bank</div>
          <div style={{ fontWeight: 700, color: '#1A1A14' }}>{bank}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#F0EFE6', color: '#4A4A40', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={submitting} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#024731', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {submitting ? '⏳ Sending…' : '📤 Send to customer'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =============================================
   MAIN PAGE
   ============================================= */
export default function KycRegistry({ onNavigate, notifications = [] }) {
  const { pushToast } = useStore();
  const [rows, setRows]                   = useState([]);
  const [shareRequests, setShareRequests] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [statusFilter, setStatusFilter]   = useState('All statuses');
  const [search, setSearch]               = useState('');

  // modal states
  const [detailRow, setDetailRow]         = useState(null);
  const [bankPickRow, setBankPickRow]     = useState(null);
  const [pendingShare, setPendingShare]   = useState(null);
  const [submitting, setSubmitting]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [kycData, srData] = await Promise.all([getKycRegistry(), getShareRequests()]);
      setRows((Array.isArray(kycData) ? kycData : []).sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0)).map(d => ({
        ...d,
        av: (d.customerName || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      })));
      setShareRequests(Array.isArray(srData) ? srData : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleConfirmShare = async () => {
    if (!pendingShare) return;
    const { row, bank } = pendingShare;
    setSubmitting(true);
    try {
      await submitShareRequest({
        credentialId:  row.credentialId,
        customerName:  row.customerName || row.name,
        customerEmail: row.email || '',
        targetBank:    bank,
        status:        'pending',
        requestedBy:   'admin',
        source:        'admin_initiated',
      });
      await load();
      pushToast('📤 Share request sent to ' + (row.customerName || row.name) + ' for ' + bank + ' — awaiting approval', 'info');
    } catch { pushToast('Failed to send request', 'error'); }
    setSubmitting(false);
    setPendingShare(null);
  };

  const filtered = rows.filter(r => {
    const matchStatus = statusFilter === 'All statuses' || r.status === statusFilter;
    const q = search.toLowerCase();
    return matchStatus && (!q || (r.customerName || '').toLowerCase().includes(q) || (r.credentialId || '').toLowerCase().includes(q));
  });

  return (
    <div className="main">
      <Navbar crumb="KYC registry" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
      <div className="content">

        {/* ── Lloyds green header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg,#024731 0%,#036844 55%,#045C3B 100%)',
            borderRadius: 20, padding: '28px 32px', marginBottom: 24,
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(2,71,49,0.22)',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.07,
            backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
          <div style={{ position: 'absolute', top: -50, right: -50, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔐</div>
                <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase' }}>Trust Ledger · Lloyds Banking Group</div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 6 }}>KYC Identity Registry</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', maxWidth: 480, lineHeight: 1.6 }}>
                Every verified customer credential — live status, expiry, issuing bank and cross-network access permissions.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Total',    value: rows.length,                                      color: '#fff'    },
                { label: 'Active',   value: rows.filter(r => r.status === 'Active').length,    color: '#6EE7B7' },
                { label: 'Expiring', value: rows.filter(r => r.status === 'Expiring soon').length, color: '#FDE68A' },
                { label: 'Revoked',  value: rows.filter(r => r.status === 'Revoked').length,   color: '#FCA5A5' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: s.color, lineHeight: 1 }}>{loading ? '…' : s.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                </div>
              ))}
              <button onClick={load} style={{ padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                {loading ? '⏳' : '↻ Refresh'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Toolbar ── */}
        <div className="toolbar">
          <div className="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8B7E" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#1A1A14', width: '100%', marginLeft: 6 }}
              placeholder="Search by name or credential ID…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-row">
            {['All statuses', 'Active', 'Expiring soon', 'Revoked'].map(f => (
              <span key={f} className={'filter-chip' + (statusFilter === f ? ' on' : '')}
                style={{ cursor: 'pointer' }} onClick={() => setStatusFilter(f)}>{f}</span>
            ))}
          </div>
        </div>

        {/* ── Cards grid ── */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9A9A8A', fontSize: 14 }}>⏳ Loading credentials…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9A9A8A', fontSize: 14 }}>
            {rows.length === 0
              ? '🔐 No credentials issued yet — approve a KYC request to issue the first one.'
              : 'No credentials match the current filters.'}
          </div>
        ) : (
          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}
            initial="hidden" animate="show" variants={container}
          >
            {filtered.map((r, i) => {
              const clr      = statusColor(r.status);
              const approved = shareRequests.filter(sr => sr.credentialId === r.credentialId && sr.status === 'approved');
              const pending  = shareRequests.filter(sr => sr.credentialId === r.credentialId && sr.status === 'pending');
              return (
                <motion.div key={i} variants={fadeUp}
                  whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(2,71,49,0.16)' }}
                  style={{
                    background: '#fff', border: '1.5px solid #E8E7DD',
                    borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s',
                  }}
                  onClick={() => setDetailRow(r)}
                >
                  {/* Lloyds green top stripe */}
                  <div style={{ height: 4, background: 'linear-gradient(90deg,#024731,#059669)' }} />

                  <div style={{ padding: '18px 18px 14px' }}>
                    {/* Avatar + name + status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{
                          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg,#024731,#059669)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, fontWeight: 800, color: '#fff',
                        }}>{r.av}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1A14' }}>{r.customerName}</div>
                          <div style={{ fontSize: 11, color: '#9A9A8A', marginTop: 2 }}>{r.email || '—'}</div>
                        </div>
                      </div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                        background: clr.bg, color: clr.text, border: '1px solid ' + clr.border,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: clr.dot, display: 'inline-block' }} />
                        {r.status}
                      </span>
                    </div>

                    {/* Credential ID chip */}
                    <div style={{ background: '#F0FAF4', border: '1px solid #D1FAE5', borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 9, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Credential ID</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#024731', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.credentialId}
                      </div>
                    </div>

                    {/* Issuer + Expiry */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, background: '#FAFAF7', borderRadius: 8, padding: '7px 10px', border: '1px solid #E8E7DD' }}>
                        <div style={{ fontSize: 9, color: '#9A9A8A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, fontWeight: 700 }}>Issuer</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A14' }}>{r.issuer || 'Lloyds Bank'}</div>
                      </div>
                      <div style={{ flex: 1, background: '#FAFAF7', borderRadius: 8, padding: '7px 10px', border: '1px solid #E8E7DD' }}>
                        <div style={{ fontSize: 9, color: '#9A9A8A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, fontWeight: 700 }}>Expires</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: r.status === 'Expiring soon' ? '#D97706' : '#1A1A14' }}>{fmt(r.expiresOn)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div
                    style={{ borderTop: '1px solid #F0EFE6', padding: '10px 18px', background: '#FAFAF7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                      {approved.length === 0 && pending.length === 0 && (
                        <span style={{ fontSize: 11, color: '#C0BEAE', fontStyle: 'italic' }}>Lloyds only</span>
                      )}
                      {approved.slice(0, 2).map((sr, j) => (
                        <span key={j} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#ECFDF5', color: '#065F46', fontWeight: 700, border: '1px solid #A7F3D0' }}>
                          ✓ {sr.targetBank}
                        </span>
                      ))}
                      {approved.length > 2 && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#F0FAF4', color: '#024731', fontWeight: 700 }}>
                          +{approved.length - 2} more
                        </span>
                      )}
                      {pending.slice(0, 1).map((sr, j) => (
                        <span key={j} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#FFFBEB', color: '#92400E', fontWeight: 700, border: '1px solid #FDE68A' }}>
                          ⏳ {sr.targetBank}
                        </span>
                      ))}
                    </div>
                    {r.status !== 'Revoked' && (
                      <button
                        onClick={e => { e.stopPropagation(); setBankPickRow(r); }}
                        style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, flexShrink: 0, background: '#024731', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
                      >+ Share</button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── Modals ── */}
        <AnimatePresence>
          {detailRow && (
            <CredentialModal
              key="detail"
              row={detailRow}
              shareRequests={shareRequests}
              onClose={() => setDetailRow(null)}
              onShare={r => { setDetailRow(null); setBankPickRow(r); }}
              onLedger={r => onNavigate('ledger_explorer', { credentialId: r.credentialId, customerName: r.customerName })}
            />
          )}
          {bankPickRow && (
            <BankPickerModal
              key="bankpick"
              row={bankPickRow}
              shareRequests={shareRequests}
              onPick={bank => { setPendingShare({ row: bankPickRow, bank }); setBankPickRow(null); }}
              onCancel={() => setBankPickRow(null)}
            />
          )}
          {pendingShare && (
            <ShareRequestModal
              key="share"
              row={pendingShare.row}
              bank={pendingShare.bank}
              onConfirm={handleConfirmShare}
              onCancel={() => setPendingShare(null)}
              submitting={submitting}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
