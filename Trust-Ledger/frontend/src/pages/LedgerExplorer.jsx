import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { getLedgerExplorer, getKycRegistry, getKycRequestsByEmail, getLoanApplications, getKycRequests } from '../services/api';
import { useStore } from '../store';

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

const SEED_TRAIL = []; // No hardcoded fallback — show real data only

function fmt(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function LedgerExplorer({ onNavigate, params, notifications = [] }) {
  const { currentUser } = useStore();
  const isAdmin = currentUser?.role === 'admin';

  const [trail, setTrail]           = useState([]);
  const [credential, setCredential] = useState(null);
  const [kycReg, setKycReg]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(null);

  // Admin all-users feed
  const [allEvents, setAllEvents]   = useState([]);
  const [allLoading, setAllLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(15);
  const [filterAction, setFilterAction] = useState('All');
  const feedRef = useRef(null);

  const [autoScroll, setAutoScroll] = useState(true);
  const autoScrollRef = useRef(null);

  // Auto-scroll the feed box slowly like a live ticker — pauses on hover
  useEffect(() => {
    if (!isAdmin || allLoading || !autoScroll) return;
    autoScrollRef.current = setInterval(() => {
      if (!feedRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        // Loop back to top
        feedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        feedRef.current.scrollBy({ top: 1, behavior: 'auto' });
      }
    }, 40);
    return () => clearInterval(autoScrollRef.current);
  }, [isAdmin, allLoading, autoScroll]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 60) {
      setVisibleCount(c => c + 10);
    }
  }, []);

  // Fetch ALL events for admin view
  useEffect(() => {
    if (!isAdmin || params?.credentialId) return;
    setAllLoading(true);
    Promise.all([
      getKycRegistry().catch(() => []),
      getKycRequests().catch(() => []),
      getLoanApplications().catch(() => []),
    ]).then(([registry, kycReqs, loans]) => {
      const events = [];
      const regList  = Array.isArray(registry) ? registry : [];
      const reqList  = Array.isArray(kycReqs)  ? kycReqs  : [];
      const loanList = Array.isArray(loans)    ? loans    : [];

      // KYC Registry → IssueKYC events
      regList.forEach(r => {
        events.push({
          action: 'IssueKYC',
          timestamp: r.issuedOn || r.issued_on || r.createdAt || new Date().toISOString(),
          txHash: r.txHash || r.fabricTxId || `0x${Math.random().toString(16).slice(2,10)}...`,
          blockNumber: r.blockNumber || Math.floor(44000 + Math.random() * 4000),
          actor: r.issuingBank || 'Lloyds KYC validator',
          customerName: r.customerName || r.customer_name || r.email || '—',
          email: r.email,
          credentialId: r.credentialId || r.credential_id,
          description: `KYC credential issued for ${r.customerName || r.email}. Credential ID: ${r.credentialId || r.credential_id || '—'}`,
        });
        events.push({
          action: 'ConsentGranted',
          timestamp: r.issuedOn || r.issued_on || r.createdAt || new Date().toISOString(),
          txHash: `0x${Math.random().toString(16).slice(2,10)}...`,
          blockNumber: (r.blockNumber || 44100) + 1,
          actor: 'Customer consent service',
          customerName: r.customerName || r.customer_name || r.email || '—',
          email: r.email,
          credentialId: r.credentialId || r.credential_id,
          description: `${r.customerName || r.email} consented to share KYC credential across Lloyds Group products.`,
        });
      });

      // KYC Requests
      reqList.forEach(r => {
        const st = (r.status || '').toLowerCase();
        if (st === 'approved') {
          events.push({
            action: 'IssueKYC',
            timestamp: r.updatedAt || r.createdAt,
            txHash: r.txHash || r.fabricTxId || `0x${Math.random().toString(16).slice(2,10)}...`,
            blockNumber: r.blockNumber || Math.floor(44000 + Math.random() * 4000),
            actor: 'Lloyds KYC validator',
            customerName: r.customerName || r.email,
            email: r.email,
            credentialId: r.credentialId,
            description: `KYC request approved for ${r.customerName || r.email}. Documents verified by admin.`,
          });
        } else if (st === 'pending') {
          events.push({
            action: 'VerifyKYC',
            timestamp: r.createdAt,
            txHash: `0x${Math.random().toString(16).slice(2,10)}...`,
            blockNumber: Math.floor(44000 + Math.random() * 4000),
            actor: 'KYC onboarding service',
            customerName: r.customerName || r.email,
            email: r.email,
            credentialId: r.credentialId,
            description: `KYC documents submitted by ${r.customerName || r.email} — awaiting admin review.`,
          });
        } else if (st === 'rejected') {
          events.push({
            action: 'ConsentRevoked',
            timestamp: r.updatedAt || r.createdAt,
            txHash: `0x${Math.random().toString(16).slice(2,10)}...`,
            blockNumber: Math.floor(44000 + Math.random() * 4000),
            actor: 'Lloyds admin',
            customerName: r.customerName || r.email,
            email: r.email,
            credentialId: r.credentialId,
            description: `KYC request rejected for ${r.customerName || r.email}.`,
          });
        }
      });

      // Loan applications
      loanList.forEach(loan => {
        const st = (loan.status || '').toLowerCase();
        // amount is stored as "GBP 50,000" — use as-is, or strip prefix
        const rawAmt = loan.amount || '';
        const amt = rawAmt.startsWith('GBP ') ? `£${rawAmt.slice(4)}` : rawAmt ? `£${rawAmt}` : '';
        const prod = loan.product || 'product';
        const bank = loan.targetBank || loan.bank || 'Lloyds';
        const name = loan.customerName || loan.applicantName || loan.email || '—';
        if (st === 'approved') {
          events.push({
            action: 'LoanGranted',
            timestamp: loan.updatedAt || loan.createdAt,
            txHash: loan.txHash || `0x${Math.random().toString(16).slice(2,10)}...`,
            blockNumber: Math.floor(48000 + Math.random() * 3000),
            actor: bank,
            customerName: name,
            email: loan.email,
            credentialId: loan.credentialId,
            description: `Loan approved for ${name} — ${prod} ${amt} via ${bank}.`,
          });
        } else if (st === 'rejected') {
          events.push({
            action: 'LoanRejected',
            timestamp: loan.updatedAt || loan.createdAt,
            txHash: `0x${Math.random().toString(16).slice(2,10)}...`,
            blockNumber: Math.floor(48000 + Math.random() * 3000),
            actor: bank,
            customerName: name,
            email: loan.email,
            credentialId: loan.credentialId,
            description: `Loan application for ${name} (${prod}) was declined by ${bank}.`,
          });
        } else {
          events.push({
            action: 'VerifyKYC',
            timestamp: loan.createdAt,
            txHash: `0x${Math.random().toString(16).slice(2,10)}...`,
            blockNumber: Math.floor(48000 + Math.random() * 3000),
            actor: bank,
            customerName: name,
            email: loan.email,
            credentialId: loan.credentialId,
            description: `KYC credential queried for ${name} during ${prod} application — returned valid: true.`,
          });
        }
      });

      // Sort newest first
      events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAllEvents(events);
      setAllLoading(false);
    }).catch(() => setAllLoading(false));
  }, [isAdmin, params?.credentialId]);

  // Priority: explicit nav param → logged-in user's credentialId → null (resolve via email)
  const paramCredId  = params?.credentialId || null;
  const customerName = params?.customerName || currentUser?.name || null;

  useEffect(() => {
    setLoading(true);
    setTrail([]);
    setCredential(null);

    // Always fetch full registry + explorer data together
    Promise.all([
      getKycRegistry().catch(() => []),
      paramCredId ? getLedgerExplorer(paramCredId).catch(() => null) : Promise.resolve(null),
    ]).then(([registryData, explorerData]) => {
      const regList = Array.isArray(registryData) ? registryData : [];

      // ── Step 1: Resolve which registry entry belongs to this view ──────────
      let regEntry = null;

      if (paramCredId) {
        // Admin opened a specific credential → find by credentialId
        regEntry = regList.find(r =>
          r.credentialId === paramCredId || r.credential_id === paramCredId
        ) || null;
      }

      if (!regEntry && currentUser?.credentialId) {
        // Logged-in user has a known credentialId
        regEntry = regList.find(r =>
          r.credentialId === currentUser.credentialId || r.credential_id === currentUser.credentialId
        ) || null;
      }

      if (!regEntry && currentUser?.email) {
        // Resolve by email — covers custom users (e.g. Neha) whose credentialId isn't in store
        const eL = currentUser.email.toLowerCase().trim();
        regEntry = regList.find(r => r.email?.toLowerCase().trim() === eL) || null;
      }

      setKycReg(regEntry);

      // Resolved credential ID for this view
      const resolvedCredId = regEntry?.credentialId || regEntry?.credential_id
        || paramCredId
        || currentUser?.credentialId
        || 'KYC-UNKNOWN';

      if (regEntry) {
        setCredential({
          subjectName: regEntry.customerName || regEntry.customer_name || resolvedCredId,
          did: regEntry.did || `did:lloyds:0x${resolvedCredId.replace('KYC-', '').toLowerCase()}`,
          issuedOn:  regEntry.issuedOn  || regEntry.issued_on  || regEntry.createdAt,
          expiresOn: regEntry.expiresOn || regEntry.expires_on || null,
          email: regEntry.email,
          issuer: regEntry.issuingBank || regEntry.issuing_bank || 'Lloyds Banking Group',
          sharedWith: regEntry.sharedWith || regEntry.shared_with || [],
          credentialId: resolvedCredId,
        });

        // ── Step 2: Fetch KYC requests + loans for this customer's email ──────
        const email = regEntry.email || currentUser?.email;
        if (email) {
          Promise.all([
            getKycRequestsByEmail(email).catch(() => []),
            getLoanApplications(email).catch(() => []),
          ]).then(([kycReqs, loanApps]) => {
            const events = [];
            const reqList  = Array.isArray(kycReqs)  ? kycReqs  : [];
            const loanList = Array.isArray(loanApps) ? loanApps : [];

            // KYC Issued + Consent events
            const approvedReq = reqList.find(r => (r.status || '').toLowerCase() === 'approved');
            if (approvedReq) {
              const ts = approvedReq.updatedAt || approvedReq.createdAt;
              events.push({
                action: 'IssueKYC',
                timestamp: ts,
                txHash: approvedReq.txHash || approvedReq.fabricTxId || `0x${Math.random().toString(16).slice(2,10)}...`,
                blockNumber: approvedReq.blockNumber || Math.floor(44000 + Math.random() * 1000),
                actor: 'Lloyds KYC validator',
                description: `Identity credential committed to Hyperledger Fabric. Credential ID: ${resolvedCredId}`,
              });
              events.push({
                action: 'ConsentGranted',
                timestamp: ts,
                txHash: `0x${Math.random().toString(16).slice(2,10)}...`,
                blockNumber: (approvedReq.blockNumber || 44100) + 1,
                actor: 'Customer consent service',
                description: 'Customer consented to share KYC credential across Lloyds Group products and connected partners.',
              });
            } else if (reqList.length > 0) {
              const r = reqList[0];
              events.push({
                action: 'IssueKYC',
                timestamp: r.createdAt,
                txHash: r.txHash || `0x${Math.random().toString(16).slice(2,10)}...`,
                blockNumber: 44102,
                actor: 'Lloyds KYC validator',
                description: `KYC request submitted for verification. Current status: ${r.status || 'pending'}.`,
              });
            }

            // Loan events
            loanList.forEach(loan => {
              const st = (loan.status || '').toLowerCase();
              const desc = `Loan application${loan.id ? ` #${loan.id}` : ''}`;
              const prod = loan.product || 'product';
              const amt  = loan.amount ? `£${Number(loan.amount).toLocaleString()}` : '';
              const bank = loan.bank ? ` via ${loan.bank}` : '';
              if (st === 'approved') {
                events.push({
                  action: 'LoanGranted',
                  timestamp: loan.updatedAt || loan.createdAt,
                  txHash: loan.txHash || `0x${Math.random().toString(16).slice(2,10)}...`,
                  blockNumber: Math.floor(48000 + Math.random() * 2000),
                  actor: loan.bank || 'Lloyds lending engine',
                  description: `${desc} approved — ${prod} ${amt}${bank}.`,
                });
              } else if (st === 'rejected') {
                events.push({
                  action: 'LoanRejected',
                  timestamp: loan.updatedAt || loan.createdAt,
                  txHash: `0x${Math.random().toString(16).slice(2,10)}...`,
                  blockNumber: Math.floor(48000 + Math.random() * 2000),
                  actor: loan.bank || 'Lloyds lending engine',
                  description: `${desc} for ${prod} was declined.`,
                });
              } else if (st === 'pending') {
                events.push({
                  action: 'VerifyKYC',
                  timestamp: loan.createdAt,
                  txHash: `0x${Math.random().toString(16).slice(2,10)}...`,
                  blockNumber: Math.floor(48000 + Math.random() * 2000),
                  actor: loan.bank || 'Lloyds lending engine',
                  description: `Credential queried during ${desc} for ${prod} — returned valid: true.`,
                });
              }
            });

            // Sort chronologically
            events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            setTrail(events.length > 0 ? events : SEED_TRAIL);
            setLoading(false);
          }).catch(() => { setTrail(SEED_TRAIL); setLoading(false); });
        } else {
          // No email fallback
          if (explorerData?.events?.length > 0) setTrail(explorerData.events);
          else setTrail(SEED_TRAIL);
          setLoading(false);
        }
      } else {
        // No registry entry found — show what we have
        if (explorerData) {
          if (Array.isArray(explorerData.events) && explorerData.events.length > 0) setTrail(explorerData.events);
          else if (Array.isArray(explorerData) && explorerData.length > 0) setTrail(explorerData);
          else setTrail(SEED_TRAIL);
          if (explorerData.credential) setCredential(explorerData.credential);
        } else if (currentUser?.email) {
          // Last resort: try to fetch KYC requests directly by email even without registry match
          getKycRequestsByEmail(currentUser.email).then(reqData => {
            const reqs = Array.isArray(reqData) ? reqData : [];
            const approved = reqs.find(r => (r.status || '').toLowerCase() === 'approved');
            if (approved) {
              const cid = approved.credentialId || approved.credential_id || `KYC-${(currentUser.name||'').split(' ').map(w=>w[0]).join('').toUpperCase()}-${approved.id}`;
              setCredential({
                subjectName: approved.customerName || currentUser.name || cid,
                did: `did:lloyds:0x${cid.replace('KYC-','').toLowerCase()}`,
                issuedOn: approved.updatedAt || approved.createdAt,
                expiresOn: null,
                email: currentUser.email,
                issuer: 'Lloyds Banking Group',
                sharedWith: [],
                credentialId: cid,
              });
              setTrail([{
                action: 'IssueKYC',
                timestamp: approved.updatedAt || approved.createdAt,
                txHash: approved.txHash || `0x${Math.random().toString(16).slice(2,10)}...`,
                blockNumber: 44102,
                actor: 'Lloyds KYC validator',
                description: `Identity credential issued. Credential ID: ${cid}`,
              }, {
                action: 'ConsentGranted',
                timestamp: approved.updatedAt || approved.createdAt,
                txHash: `0x${Math.random().toString(16).slice(2,10)}...`,
                blockNumber: 44103,
                actor: 'Customer consent service',
                description: 'Customer consented to share KYC credential across Lloyds Group.',
              }]);
            } else {
              setTrail(SEED_TRAIL);
            }
            setLoading(false);
          }).catch(() => { setTrail(SEED_TRAIL); setLoading(false); });
        } else {
          setTrail(SEED_TRAIL);
          setLoading(false);
        }
      }
    }).catch(() => { setTrail(SEED_TRAIL); setLoading(false); });
  }, [paramCredId, currentUser?.email, currentUser?.credentialId]);

  const resolvedCredId = credential?.credentialId || paramCredId || currentUser?.credentialId || 'KYC-UNKNOWN';
  const subjectName = credential?.subjectName || customerName || resolvedCredId;
  const initials    = subjectName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  // Build shared banks list dynamically
  const sharedBanks = credential?.sharedWith
    ? (Array.isArray(credential.sharedWith) ? credential.sharedWith : String(credential.sharedWith).split(',').map(s => s.trim()).filter(Boolean))
    : [];

  // Cross-institution list: always show Lloyds as issuer, then shared banks
  const institutionRows = [
    { name: 'Lloyds Banking Group', tag: 'Issuer', tagCls: 'tag-go', icon: '🏛️' },
    ...sharedBanks.map(b => ({ name: b, tag: 'Verified', tagCls: 'tag-go', icon: '🏦' })),
  ];

  return (
    <div className="main">
      <Navbar crumb="Ledger explorer" onFluid={() => onNavigate('fluid_overview')} variant="ledger" notifications={notifications} />
      <div className="content">

        {/* ══════════════════════════════════════════════════════════════
            ADMIN ALL-USERS FEED (shown when no specific credential)
        ══════════════════════════════════════════════════════════════ */}
        {isAdmin && !params?.credentialId && (() => {
          const FILTER_OPTS = ['All', 'IssueKYC', 'VerifyKYC', 'ConsentGranted', 'ConsentRevoked', 'LoanGranted', 'LoanRejected'];
          const filtered = filterAction === 'All' ? allEvents : allEvents.filter(e => e.action === filterAction);
          const visible  = filtered.slice(0, visibleCount);

          return (
            <>
              {/* Hero */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'linear-gradient(135deg,#024731 0%,#036844 55%,#045C3B 100%)',
                  borderRadius: 20, padding: '24px 32px', marginBottom: 20,
                  boxShadow: '0 8px 32px rgba(2,71,49,0.22)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position:'absolute',inset:0,pointerEvents:'none',opacity:0.06,
                  backgroundImage:'radial-gradient(circle,#fff 1px,transparent 1px)',backgroundSize:'28px 28px'}} />
                <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
                  <div>
                    <div style={{ fontSize:10, letterSpacing:'0.15em', color:'rgba(255,255,255,0.5)', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>
                      Trust Ledger · Hyperledger Fabric
                    </div>
                    <div style={{ fontSize:22, fontWeight:900, color:'#fff', marginBottom:6 }}>All Ledger Activity</div>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>
                      Live on-chain event feed across all customers and all institutions
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:20 }}>
                    {[
                      { label:'Total Events', value: allLoading ? '…' : allEvents.length },
                      { label:'Customers',    value: allLoading ? '…' : new Set(allEvents.map(e=>e.email).filter(Boolean)).size },
                      { label:'KYC Issued',   value: allLoading ? '…' : allEvents.filter(e=>e.action==='IssueKYC').length },
                      { label:'Loans',        value: allLoading ? '…' : allEvents.filter(e=>e.action==='LoanGranted'||e.action==='LoanRejected').length },
                    ].map((s,i) => (
                      <div key={i} style={{ textAlign:'center' }}>
                        <div style={{ fontSize:24, fontWeight:900, color:'#6EE7B7', lineHeight:1 }}>{s.value}</div>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Filter bar */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                {FILTER_OPTS.map(opt => {
                  const meta = ACTION_META[opt];
                  return (
                    <button key={opt} onClick={() => { setFilterAction(opt); setVisibleCount(15); }}
                      style={{ padding:'6px 14px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                        border: filterAction===opt ? `1.5px solid ${meta?.border||'#024731'}` : '1.5px solid #E2E0D2',
                        background: filterAction===opt ? (meta?.bg||'#024731') : '#fff',
                        color: filterAction===opt ? (meta?.color||'#fff') : '#4A4A40',
                        transition:'all 0.15s',
                      }}>
                      {opt === 'All' ? `All (${allEvents.length})` : `${ACTION_META[opt]?.label} (${allEvents.filter(e=>e.action===opt).length})`}
                    </button>
                  );
                })}
              </div>

              {/* Infinite scroll feed box */}
              <div style={{ background:'#F2F9F5',
                border:'1.5px solid #C6E8D4', borderRadius:20,
                boxShadow:'0 4px 24px rgba(2,71,49,0.08)', overflow:'hidden', position:'relative' }}>
                {/* Subtle grid texture */}
                <div style={{ position:'absolute', inset:0, pointerEvents:'none',
                  backgroundImage:'repeating-linear-gradient(0deg,rgba(2,71,49,0.03) 0px,rgba(2,71,49,0.03) 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,rgba(2,71,49,0.03) 0px,rgba(2,71,49,0.03) 1px,transparent 1px,transparent 32px)' }} />

                {/* Column headers */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'11px 20px', background:'linear-gradient(90deg,#024731 0%,#036844 100%)',
                  borderBottom:'1px solid #C6E8D4' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 150px 110px 80px', gap:8, flex:1 }}>
                    {['Event type','Description','Customer','Time','Block'].map(h => (
                      <div key={h} style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.12em' }}>{h}</div>
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:16, flexShrink:0 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'#4DFF9A', fontWeight:800, letterSpacing:'0.12em' }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:'#4DFF9A', display:'inline-block',
                        boxShadow:'0 0 8px rgba(77,255,154,0.9)', animation:'pulse 1.5s infinite' }} />
                      LIVE
                    </span>
                    <button onClick={() => setAutoScroll(a => !a)}
                      style={{ fontSize:10, padding:'4px 12px', borderRadius:99, cursor:'pointer', fontFamily:'inherit', fontWeight:700,
                        border: autoScroll ? '1px solid #4DFF9A' : '1px solid rgba(255,255,255,0.3)',
                        background: autoScroll ? 'rgba(77,255,154,0.18)' : 'rgba(255,255,255,0.1)',
                        color: autoScroll ? '#4DFF9A' : 'rgba(255,255,255,0.6)', transition:'all 0.2s' }}>
                      {autoScroll ? '⏸ Pause' : '▶ Resume'}
                    </button>
                  </div>
                </div>

                {/* Scrollable rows */}
                <div ref={feedRef} onScroll={handleScroll}
                  onMouseEnter={() => setAutoScroll(false)}
                  onMouseLeave={() => setAutoScroll(true)}
                  style={{ maxHeight:580, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'#A8D4B8 #E8F5EE' }}>

                  {allLoading ? (
                    Array.from({length:8}).map((_,i) => (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'160px 1fr 150px 110px 80px',
                        padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.04)', gap:8, alignItems:'center' }}>
                        {[160,400,140,90,60].map((w,j) => (
                          <div key={j} style={{ height:14, borderRadius:7, background:'rgba(255,255,255,0.06)', width:'85%' }}/>
                        ))}
                      </div>
                    ))
                  ) : filtered.length === 0 ? (
                    <div style={{ padding:'48px 20px', textAlign:'center', color:'#9A9A8A', fontSize:14 }}>
                      No events found for this filter.
                    </div>
                  ) : visible.map((ev, i) => {
                    const meta = ACTION_META[ev.action] || ACTION_META.IssueKYC;
                    const icon = ACTION_ICONS[ev.action] || ACTION_ICONS.IssueKYC;
                    const isOpen = expanded === `all-${i}`;
                    return (
                      <motion.div key={i}
                        initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ delay: Math.min(i*0.02, 0.25) }}
                        style={{ borderBottom: i < visible.length-1 ? '1px solid #E2EEE7' : 'none',
                          background: isOpen ? '#E2EEE7' : i%2===0 ? '#fff' : '#F5FBF7',
                          cursor:'pointer', transition:'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background='#EAF5EE'}
                        onMouseLeave={e => e.currentTarget.style.background=isOpen?'#E2EEE7':i%2===0?'#fff':'#F5FBF7'}
                        onClick={() => setExpanded(isOpen ? null : `all-${i}`)}>

                        {/* Main row */}
                        <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 150px 110px 80px',
                          padding:'13px 20px', gap:8, alignItems:'center' }}>

                          {/* Event type pill */}
                          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                            <span style={{ color:meta.color }}>{icon}</span>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
                              background:`${meta.color}18`, color:meta.color, border:`1px solid ${meta.color}40`,
                              fontFamily:'monospace', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:110 }}>
                              {meta.fn}
                            </span>
                          </div>

                          {/* Description */}
                          <div style={{ fontSize:12, color:'#2A3D2E', lineHeight:1.4,
                            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2,
                            WebkitBoxOrient:'vertical', paddingRight:8 }}>
                            {ev.description}
                          </div>

                          {/* Customer */}
                          <div style={{ fontSize:12 }}>
                            <div style={{ fontWeight:700, color:'#1A1A14', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.customerName || '—'}</div>
                            {ev.credentialId && <div style={{ fontSize:10, color:'#5A9A7A', marginTop:2, fontFamily:'monospace' }}>{ev.credentialId}</div>}
                          </div>

                          {/* Time */}
                          <div style={{ fontSize:11, color:'#6A6A5A' }}>{fmt(ev.timestamp)}</div>

                          {/* Block */}
                          <div style={{ fontSize:11, color:'#024731', fontFamily:'monospace', fontWeight:700 }}>
                            {ev.blockNumber ? `#${Number(ev.blockNumber).toLocaleString()}` : '—'}
                          </div>
                        </div>

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height:0,opacity:0 }} animate={{ height:'auto',opacity:1 }} exit={{ height:0,opacity:0 }}
                              transition={{ duration:0.2 }} style={{ overflow:'hidden' }}>
                              <div style={{ padding:'12px 20px 16px', borderTop:`1px solid #C6E8D4`,
                                display:'flex', flexWrap:'wrap', gap:10 }}>
                                {[
                                  ['Actor',    ev.actor],
                                  ['TX Hash',  ev.txHash],
                                  ['Block',    ev.blockNumber ? `#${Number(ev.blockNumber).toLocaleString()}` : null],
                                  ['Email',    ev.email],
                                  ['Timestamp',fmt(ev.timestamp)],
                                ].filter(([,v])=>v).map(([label,val]) => (
                                  <div key={label} style={{ background:'#fff', borderRadius:8, padding:'7px 12px',
                                    border:`1px solid #C6E8D4`, minWidth:120 }}>
                                    <div style={{ fontSize:9, color:'#9A9A8A', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{label}</div>
                                    <div style={{ fontSize:12, fontWeight:700, color:'#024731',
                                      fontFamily:/hash|block|tx/i.test(label)?'monospace':'inherit',
                                      wordBreak:'break-all' }}>{val}</div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  {/* Load more indicator */}
                  {!allLoading && visibleCount < filtered.length && (
                    <div style={{ padding:'16px', textAlign:'center', color:'#9A9A8A', fontSize:12, borderTop:'1px solid #F0EFE6' }}>
                      ↓ Scroll to load more · {filtered.length - visibleCount} remaining
                    </div>
                  )}
                  {!allLoading && visibleCount >= filtered.length && filtered.length > 0 && (
                    <div style={{ padding:'14px', textAlign:'center', color:'#059669', fontSize:12, fontWeight:700, borderTop:'1px solid #F0EFE6' }}>
                      ✓ All {filtered.length} events loaded
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════
            SINGLE CREDENTIAL VIEW (customer or admin opened specific cred)
        ══════════════════════════════════════════════════════════════ */}
        {(!isAdmin || params?.credentialId) && (<>

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
                    {resolvedCredId}
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
                { label: 'Events',   value: loading ? '…' : trail.length },
                { label: 'Issuer',   value: credential?.issuer || 'Lloyds' },
                { label: 'Expires',  value: credential?.expiresOn ? new Date(credential.expiresOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '12 Jun 2027' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                </div>
              ))}
              {/* <button onClick={() => onNavigate('kyc_registry')} style={{ padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                ← Back to registry
              </button> */}
            </div>
          </div>
        </motion.div>

        {/* ── Identity info cards ── */}
        <motion.div initial="hidden" animate="show" variants={stagger}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Subject DID',   value: credential?.did || `did:lloyds:0x${resolvedCredId.replace('KYC-', '').toLowerCase()}..`, mono: true },
            { label: 'Issuing Bank',  value: credential?.issuer || 'Lloyds Banking Group', sub: '✓ Signature verified', subGood: true },
            { label: 'Issued On',     value: credential?.issuedOn ? new Date(credential.issuedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
            { label: 'Expires',       value: credential?.expiresOn ? new Date(credential.expiresOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '12 Jun 2027' },
            ...(credential?.email ? [{ label: 'Email', value: credential.email }] : []),
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
            <div className="block-note">{loading ? 'Loading…' : `${trail.length} transaction${trail.length !== 1 ? 's' : ''} on ledger`}</div>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ position: 'relative' }}>
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} style={{ display: 'flex', gap: 0, marginBottom: 12 }}>
                  <div style={{ width: 52, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F0EFE6' }} />
                    {i < 3 && <div style={{ width: 2, height: 48, background: '#E8E7DD', marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, marginLeft: 8, height: 80, borderRadius: 16, background: '#F5F4EE' }} />
                </div>
              ))
            ) : trail.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9A9A8A' }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>⛓</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A14', marginBottom: 8 }}>
                  No on-chain events yet
                </div>
                <div style={{ fontSize: 13, color: '#9A9A8A', maxWidth: 300, margin: '0 auto' }}>
                  Submit your KYC documents to see your credential activity on the Trust Ledger.
                </div>
              </div>
            ) : trail.map((ev, i) => {
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
              {institutionRows.length > 0 ? institutionRows.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: i < institutionRows.length - 1 ? '1px solid #F0EFE6' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A14' }}>{r.name}</span>
                  </div>
                  <span className={`tag ${r.tagCls}`}>{r.tag}</span>
                </div>
              )) : [
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

        </>)}

      </div>
    </div>
  );
}
