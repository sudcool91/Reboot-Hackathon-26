import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useStore } from '../store';
import { getKycRegistry, updateConsent } from '../services/api';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const STATUS_SEED = [
  { av: 'RS', name: 'Rohan Sharma', credentialId: 'KYC-RS-88213', issuer: 'Lloyds', sharedWith: ['Lloyds'], expiresOn: '12 Jun 2027', status: 'Active' },
  { av: 'PN', name: 'Priya Nair', credentialId: 'KYC-PN-44021', issuer: 'Partner bank', sharedWith: ['Lloyds', 'Halifax'], expiresOn: '03 Apr 2027', status: 'Active' },
  { av: 'ST', name: 'Sara Thomas', credentialId: 'KYC-ST-30187', issuer: 'Lloyds', sharedWith: ['Lloyds'], expiresOn: '19 Aug 2026', status: 'Expiring soon' },
  { av: 'VD', name: 'Vikram Desai', credentialId: 'KYC-VD-19042', issuer: 'Lloyds', sharedWith: [], expiresOn: '—', status: 'Revoked' },
  { av: 'MI', name: 'Meera Iyer', credentialId: 'KYC-MI-55301', issuer: 'Lloyds', sharedWith: ['Lloyds', 'Halifax', 'Credit bureau'], expiresOn: '15 Jan 2028', status: 'Active' },
];

const BANKS = ['Lloyds', 'Halifax', 'Bank of Scotland', 'MBNA', 'Credit bureau'];

function statusCls(s) {
  if (s === 'Active') return 'tag-go';
  if (s === 'Expiring soon') return 'tag-warn';
  return 'tag-stop';
}

export default function KycRegistry({ onNavigate, notifications = [] }) {
  const { pushToast } = useStore();
  const [rows, setRows] = useState(STATUS_SEED);
  const [shareOpen, setShareOpen] = useState(null); // credentialId of open dropdown

  useEffect(() => {
    getKycRegistry().then(data => {
      if (data && Array.isArray(data)) {
        // merge avatar initials from seed since backend doesn't send them
        const merged = data.map(d => {
          const seed = STATUS_SEED.find(s => s.credentialId === d.credentialId);
          return { ...seed, ...d, av: seed?.av ?? d.avatar ?? d.customerName?.split(' ').map(n => n[0]).join('') };
        });
        setRows(merged);
      }
    });
  }, []);

  const handleConsent = async (credentialId, bank, action) => {
    setShareOpen(null);
    const res = await updateConsent(credentialId, bank, action);
    setRows(prev => prev.map(r => {
      if (r.credentialId !== credentialId) return r;
      const shared = action === 'share'
        ? [...(r.sharedWith || []), bank]
        : (r.sharedWith || []).filter(b => b !== bank);
      return { ...r, sharedWith: shared };
    }));
    const label = action === 'share' ? `Shared with ${bank}` : `Revoked from ${bank}`;
    pushToast(`${label} — consent written on-chain`, action === 'share' ? 'success' : 'info', res?.txHash);
  };

  return (
    <div className="main">
      <Navbar crumb="KYC registry" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
      <div className="content">
        <div className="page-title">KYC registry</div>
        <div className="page-sub">Every customer's on-chain identity credential, where it was issued, and which products it has been used to unlock — one record, reused everywhere.</div>

        <motion.div className="stat-grid" initial="hidden" animate="show" variants={container}>
          {[
            { label: 'Total credentials issued', value: rows.length > 0 ? rows.length.toLocaleString() : '12,884' },
            { label: 'Active', value: rows.filter(r => r.status === 'Active').length || '12,401' },
            { label: 'Expiring within 90 days', value: rows.filter(r => r.status === 'Expiring soon').length || '312' },
            { label: 'Revoked', value: rows.filter(r => r.status === 'Revoked').length || '171' },
          ].map((s, i) => (
            <motion.div key={i} className="stat" variants={fadeUp}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="toolbar">
          <div className="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8B7E" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            Search by name, credential ID, or DID
          </div>
          <div className="filter-row">
            <span className="filter-chip on">All statuses</span>
            <span className="filter-chip">Active</span>
            <span className="filter-chip">Expiring soon</span>
            <span className="filter-chip">Revoked</span>
          </div>
        </div>

        <motion.div className="card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
          <table>
            <thead><tr><th>Customer</th><th>Credential ID</th><th>Issuer</th><th>Shared with</th><th>Expires</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td><div className="person"><div className="av">{r.av}</div>{r.customerName || r.name}</div></td>
                  <td><span className="mono-sm">{r.credentialId}</span></td>
                  <td><span className="issuer-chip">{r.issuer}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                      {(r.sharedWith || []).map((bank, j) => (
                        <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px', borderRadius: 999, background: '#e2eee7', color: '#024731', fontWeight: 600 }}>
                          {bank}
                          {r.status !== 'Revoked' && (
                            <span style={{ cursor: 'pointer', opacity: 0.6, fontSize: 12 }} onClick={() => handleConsent(r.credentialId, bank, 'revoke')}>✕</span>
                          )}
                        </span>
                      ))}
                      {r.status !== 'Revoked' && (
                        <div style={{ position: 'relative' }}>
                          <span style={{ cursor: 'pointer', fontSize: 11, color: '#0b5c3f', fontWeight: 700 }} onClick={() => setShareOpen(shareOpen === r.credentialId ? null : r.credentialId)}>+ Share</span>
                          {shareOpen === r.credentialId && (
                            <div style={{ position: 'absolute', top: 22, left: 0, background: '#fff', border: '1px solid #e2e0d2', borderRadius: 9, padding: '6px 0', zIndex: 50, minWidth: 160, boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}>
                              {BANKS.filter(b => !(r.sharedWith || []).includes(b)).map(b => (
                                <div key={b} style={{ padding: '7px 14px', fontSize: 13, cursor: 'pointer' }} onClick={() => handleConsent(r.credentialId, b, 'share')}>{b}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{r.expiresOn || r.expires}</td>
                  <td><span className={`tag ${statusCls(r.status)}`}>{r.status}</span></td>
                  <td><span className="row-link" onClick={() => onNavigate('ledger_explorer', { credentialId: r.credentialId, customerName: r.customerName || r.name })}>View trail →</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
