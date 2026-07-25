import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { getLedgerExplorer } from '../services/api';

const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const ACTION_META = {
  IssueKYC:       { fn: 'issueKYC()',       color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Credential Issued' },
  ConsentGranted: { fn: 'consentLogged()',  color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Consent Granted'   },
  ConsentRevoked: { fn: 'revokeConsent()',  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Consent Revoked'   },
  VerifyKYC:      { fn: 'verifyKYC()',      color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', label: 'KYC Verified'      },
  LoanGranted:    { fn: 'loanGranted()',    color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Loan Granted'      },
  LoanRejected:   { fn: 'loanRejected()',   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Loan Rejected'     },
};

const ACTION_ICONS = {
  IssueKYC:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/></svg>,
  ConsentGranted: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6"/></svg>,
  ConsentRevoked: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  VerifyKYC:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  LoanGranted:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>,
  LoanRejected:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>,
};

const SEED_TRAIL = [
  { action: 'IssueKYC',       timestamp: '2026-06-12T10:14:00Z', txHash: '0x4a7f...e21b', blockNumber: 44102, actor: 'Lloyds validator',        description: 'Credential hash committed to ledger by Lloyds validator after in-branch identity verification' },
  { action: 'ConsentGranted', timestamp: '2026-06-12T10:15:00Z', txHash: '0x2b81...77ac', blockNumber: 44103, actor: 'Customer consent service', description: 'Customer consented to share this credential with the lending platform and connected partners' },
  { action: 'VerifyKYC',      timestamp: '2026-06-23T09:02:00Z', txHash: '0x7e21...4bcd', blockNumber: 48221, actor: 'Halifax loan engine',       description: 'Queried by the lending platform during application LN20458 — returned valid: true' },
];

function fmt(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function LedgerExplorer({ onNavigate, params, notifications = [] }) {
  const [trail, setTrail]         = useState(SEED_TRAIL);
  const [credential, setCredential] = useState(null);
  const [expanded, setExpanded]   = useState(null);

  const credId       = params?.credentialId || 'KYC-RS-88213';
  const customerName = params?.customerName || null;

  useEffect(() => {
    getLedgerExplorer(credId).then(data => {
      if (data && Array.isArray(data.events) && data.events.length > 0) setTrail(data.events);
      else if (Array.isArray(data) && data.length > 0) setTrail(data);
      if (data && data.credential) setCredential(data.credential);
    });
  }, [credId]);

  const subjectName = credential?.subjectName || customerName || credId;
  const initials    = subjectName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="main">
      <Navbar crumb="Ledger explorer" onFluid={() => onNavigate('fluid_overview')} variant="ledger" notifications={notifications} />
      <div className="content">

        {/* ── Lloyds green hero banner ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg,#024731 0%,#036844 55%,#045C3B 100%)',
            borderRadius: 20, padding: '28px 32px', marginBottom: 24,
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(2,71,49,0.22)',
          }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.07, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {/* Avatar */}
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  Trust Ledger · Credential Audit Trail
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{subjectName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.12)', padding: '3px 10px', borderRadius: 6 }}>
                    {credId}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(110,231,183,0.2)', border: '1px solid rgba(110,231,183,0.4)', color: '#6EE7B7', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6EE7B7', display: 'inline-block' }} />
                    Active · not revoked
                  </span>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Events',   value: trail.length },
                { label: 'Issuer',   value: 'Lloyds' },
                { label: 'Expires',  value: credential?.expiresOn ? new Date(credential.expiresOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '12 Jun 2027' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                </div>
              ))}
              <button onClick={() => onNavigate('kyc_registry')} style={{ padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                ← Back to registry
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Identity info cards ── */}
        <motion.div initial="hidden" animate="show" variants={stagger}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Subject DID',   value: credential?.did || `did:lloyds:0x${credId.replace('KYC-', '').toLowerCase()}..`, mono: true },
            { label: 'Issuing Bank',  value: 'Lloyds Banking Group', sub: '✓ Signature verified', subGood: true },
            { label: 'Issued On',     value: credential?.issuedOn ? new Date(credential.issuedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '12 Jun 2026' },
            { label: 'Expires',       value: credential?.expiresOn ? new Date(credential.expiresOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '12 Jun 2027' },
          ].map((c, i) => (
            <motion.div key={i} variants={fadeUp} style={{ background: '#fff', border: '1.5px solid #E8E7DD', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg,#024731,#059669)', borderRadius: 2, marginBottom: 12, width: 32 }} />
              <div style={{ fontSize: 10, color: '#9A9A8A', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A14', wordBreak: 'break-all', fontFamily: c.mono ? 'monospace' : 'inherit' }}>{c.value}</div>
              {c.sub && <div style={{ fontSize: 11, marginTop: 4, color: c.subGood ? '#059669' : '#9A9A8A', fontWeight: 600 }}>{c.sub}</div>}
            </motion.div>
          ))}
        </motion.div>

        {/* ── On-chain event timeline ── */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">01</span>On-chain event history</div>
            <div className="block-note">{trail.length} transaction{trail.length !== 1 ? 's' : ''} on ledger</div>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ position: 'relative' }}>
            {trail.map((ev, i) => {
              const meta    = ACTION_META[ev.action] || ACTION_META.IssueKYC;
              const icon    = ACTION_ICONS[ev.action] || ACTION_ICONS.IssueKYC;
              const isOpen  = expanded === i;
              const isLast  = i === trail.length - 1;

              return (
                <div key={i} style={{ display: 'flex', gap: 0, position: 'relative' }}>
                  {/* Timeline spine */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 52, flexShrink: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: meta.bg, border: `2px solid ${meta.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: meta.color, zIndex: 1,
                      boxShadow: `0 0 0 4px ${meta.bg}`,
                    }}>{icon}</div>
                    {!isLast && <div style={{ width: 2, flex: 1, minHeight: 24, background: 'linear-gradient(180deg,#E8E7DD,#E8E7DD)', marginTop: 4 }} />}
                  </div>

                  {/* Event card */}
                  <div style={{ flex: 1, marginBottom: isLast ? 0 : 12, marginLeft: 8 }}>
                    <motion.div
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{
                        background: '#fff', border: `1.5px solid ${isOpen ? meta.border : '#E8E7DD'}`,
                        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                        boxShadow: isOpen ? `0 4px 20px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => setExpanded(isOpen ? null : i)}
                    >
                      {/* Card header */}
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                          background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                          fontFamily: 'monospace', whiteSpace: 'nowrap',
                        }}>{meta.fn}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A14', flex: 1 }}>{meta.label}</span>
                        <span style={{ fontSize: 11, color: '#9A9A8A', whiteSpace: 'nowrap' }}>{fmt(ev.timestamp)}</span>
                        <span style={{ fontSize: 13, color: isOpen ? meta.color : '#C0BEAE', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                      </div>

                      {/* Description always visible */}
                      <div style={{ padding: '0 18px 14px', fontSize: 13, color: '#4A4A40', lineHeight: 1.6 }}>
                        {ev.description}
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                            <div style={{ borderTop: `1px solid ${meta.border}`, padding: '14px 18px', background: meta.bg, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                              {[
                                ['Actor',        ev.actor],
                                ['TX Hash',      ev.txHash],
                                ['Block',        ev.blockNumber ? `#${Number(ev.blockNumber).toLocaleString()}` : null],
                                ['Confirmations','4 / 4'],
                                ['Timestamp',    fmt(ev.timestamp)],
                              ].filter(([, v]) => v).map(([label, val]) => (
                                <div key={label} style={{ background: '#fff', borderRadius: 8, padding: '8px 12px', border: `1px solid ${meta.border}` }}>
                                  <div style={{ fontSize: 9, color: '#9A9A8A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, fontFamily: /hash|tx|block/i.test(label) ? 'monospace' : 'inherit' }}>{val}</div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </section>

        {/* ── Bottom row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Cross-institution reuse */}
          <section className="block" style={{ marginBottom: 0 }}>
            <div className="block-head">
              <div className="block-title"><span className="block-num">02</span>Cross-institution reuse</div>
            </div>
            <div style={{ background: '#fff', border: '1.5px solid #E8E7DD', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', background: '#F0FAF4', borderBottom: '1px solid #D1FAE5', fontSize: 12, color: '#4A4A40', lineHeight: 1.6 }}>
                One credential verified once — trusted across every connected institution. Zero repeated paperwork.
              </div>
              {[
                { name: 'Lloyds Banking Group', tag: 'Issuer',        tagCls: 'tag-go',   icon: '🏛️' },
                { name: 'Halifax',              tag: 'Verified',      tagCls: 'tag-go',   icon: '🏦' },
                { name: 'Bank of Scotland',     tag: 'Pending share', tagCls: 'tag-warn', icon: '🏦' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: i < 2 ? '1px solid #F0EFE6' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A14' }}>{r.name}</span>
                  </div>
                  <span className={`tag ${r.tagCls}`}>{r.tag}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy architecture */}
          <section className="block" style={{ marginBottom: 0 }}>
            <div className="block-head">
              <div className="block-title"><span className="block-num">03</span>Privacy architecture</div>
            </div>
            <div style={{ background: '#fff', border: '1.5px solid #E8E7DD', borderRadius: 16, overflow: 'hidden' }}>
              {[
                { icon: '🔒', title: 'Hashes only on-chain',     desc: 'Document hashes are written to the ledger — never the documents themselves' },
                { icon: '🛡️', title: 'AES-256 encrypted storage', desc: 'Source documents in encrypted S3, access-controlled per role' },
                { icon: '🙈', title: 'Zero PII on-chain',         desc: 'No personally identifiable information is ever committed to Hyperledger Fabric' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderBottom: i < 2 ? '1px solid #F0EFE6' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FAF4', border: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A14', marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#6A6A5A', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
  

