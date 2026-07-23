import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { getLedgerExplorer } from '../services/api';

const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

const ACTION_ICONS = {
  IssueKYC: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0B5C3F" strokeWidth="2"><path d="M12 1l3 6 6 .75-4.5 4.5L18 19l-6-3-6 3 1.5-6.75L3 7.75 9 7z"/></svg>,
  ConsentGranted: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0B5C3F" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6"/></svg>,
  ConsentRevoked: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A32D2D" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  VerifyKYC: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0B5C3F" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  LoanGranted: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0B5C3F" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>,
  LoanRejected: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A32D2D" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>,
};

const SEED_TRAIL = [
  { action: 'IssueKYC', timestamp: '2026-06-12T10:14:00Z', txHash: '0x4a7f...e21b', blockNumber: 44102, actor: 'Lloyds validator', description: 'Credential hash committed to ledger by Lloyds validator after in-branch identity verification' },
  { action: 'ConsentGranted', timestamp: '2026-06-12T10:15:00Z', txHash: '0x2b81...77ac', blockNumber: 44103, actor: 'Customer consent service', description: 'Customer consented to share this credential with the lending platform and connected partners' },
  { action: 'VerifyKYC', timestamp: '2026-06-23T09:02:00Z', txHash: '0x7e21...4bcd', blockNumber: 48221, actor: 'Halifax loan engine', description: 'Queried by the lending platform during application LN20458 — returned valid: true' },
];

export default function LedgerExplorer({ onNavigate }) {
  const [trail, setTrail] = useState(SEED_TRAIL);

  useEffect(() => {
    getLedgerExplorer('KYC-RS-88213').then(data => {
      if (data && Array.isArray(data.events) && data.events.length > 0) setTrail(data.events);
      else if (Array.isArray(data) && data.length > 0) setTrail(data);
    });
  }, []);

  return (
    <div className="main">
      <Navbar crumb="Credential audit trail" onFluid={() => onNavigate('fluid_overview')} variant="ledger" />
      <div className="content">
        <div className="page-title-row">
          <div>
            <div className="page-title">Credential audit trail</div>
            <div className="page-sub">Every smart contract call this credential has ever triggered — issuance, consent, verification, and (if it ever happens) revocation.</div>
          </div>
          <span className="pill-dark-inline">Credential ID: KYC-RS-88213</span>
        </div>

        <motion.div className="id-row" initial="hidden" animate="show" variants={{ hidden:{}, show:{ transition:{staggerChildren:0.08} } }}>
          <motion.div className="id-card" variants={fadeUp}>
            <div className="id-label">Subject</div>
            <div className="id-value">Rohan Sharma</div>
            <div className="id-sub">DID: did:lloyds:0x88213a..</div>
          </motion.div>
          <motion.div className="id-card" variants={fadeUp}>
            <div className="id-label">Issuer</div>
            <div className="id-value">Lloyds Banking Group</div>
            <div className="id-sub good">✓ Signature verified</div>
          </motion.div>
          <motion.div className="id-card" variants={fadeUp}>
            <div className="id-label">Status</div>
            <div className="id-value" style={{color:'#0B5C3F'}}>Active · not revoked</div>
            <div className="id-sub">Expires 12 Jun 2027</div>
          </motion.div>
        </motion.div>

        <section className="block">
          <div className="block-head"><div className="block-title"><span className="block-num">01</span>On-chain event history</div></div>
          <motion.div className="trail" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.15}}>
            {trail.map((ev, i) => {
              const muted = ev.action === 'ConsentRevoked' || ev.action === 'LoanRejected';
              const fnName = {
                IssueKYC: 'issueKYC()', ConsentGranted: 'consentLogged()',
                ConsentRevoked: 'revokeConsent()', VerifyKYC: 'verifyKYC()',
                LoanGranted: 'loanGranted()', LoanRejected: 'loanRejected()',
              }[ev.action] || ev.action;
              const time = ev.timestamp ? new Date(ev.timestamp).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
              const tx = ev.txHash ? `tx ${ev.txHash} · block #${(ev.blockNumber||'').toLocaleString()} · confirmed 4/4` : null;
              return (
                <div key={i} className="trail-row">
                  <div className="node-wrap">
                    <div className={`node-circle${muted?' muted':''}`}>{ACTION_ICONS[ev.action] || ACTION_ICONS.IssueKYC}</div>
                    {i < trail.length - 1 && <div className="node-line"></div>}
                  </div>
                  <div className="trail-content">
                    <div className="trail-top">
                      <span className={`trail-fn${muted?' muted':''}`}>{fnName}</span>
                      <span className="trail-time">{time}</span>
                    </div>
                    <div className="trail-desc">{ev.description}</div>
                    {tx && <div className="trail-tx">{tx}</div>}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </section>

        <div className="bottom-row">
          <section className="block" style={{marginBottom:0}}>
            <div className="block-head"><div className="block-title"><span className="block-num">02</span>Cross-institution reuse</div></div>
            <div className="card-pad-standalone">
              <p style={{fontSize:12,color:'#4A4A40',marginBottom:'0.9rem'}}>This is the actual thesis of the platform: one credential, checked twice, zero repeated paperwork.</p>
              <div className="reuse-row"><span style={{fontSize:13,fontWeight:700}}>Lloyds Banking Group</span><span className="tag tag-go">Issuer</span></div>
              <div className="reuse-row"><span style={{fontSize:13,fontWeight:700}}>Partner bank node</span><span className="tag tag-mute">Verified 23 Jun</span></div>
            </div>
          </section>
          <section className="block" style={{marginBottom:0}}>
            <div className="block-head"><div className="block-title"><span className="block-num">03</span>Privacy architecture</div></div>
            <div className="card-pad-standalone">
              {[
                <>Only document <b>hashes</b> are written to the ledger — never the documents themselves</>,
                <>Source documents live in AES-256 encrypted S3, access-controlled per role</>,
                <>No personally identifiable information is ever committed on-chain</>,
              ].map((text, i) => (
                <div key={i} className="privacy-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E6E4B" strokeWidth="2.3"><path d="M20 6L9 17l-5-5"/></svg>
                  {text}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
