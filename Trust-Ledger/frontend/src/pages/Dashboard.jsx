import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { getDashboardSummary, getDashboardActivity, getLoanApplications, getKycRegistry } from '../services/api';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const STATUS_CLS = {
  'Auto-eligible': 'tag-go', 'Approved': 'tag-go',
  'Manual review': 'tag-warn', 'Pending docs': 'tag-warn',
  'Rejected': 'tag-bad', 'Revoked': 'tag-bad',
};

const ACTION_ICON = {
  IssueKYC:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E6E4B" strokeWidth="2.3"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/></svg>,
  ConsentGranted: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E6E4B" strokeWidth="2.3"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6"/></svg>,
  ConsentRevoked: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2.3"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  VerifyKYC:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E6E4B" strokeWidth="2.3"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>,
  LoanGranted:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E6E4B" strokeWidth="2.3"><path d="M20 6L9 17l-5-5"/></svg>,
  LoanRejected:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A32D2D" strokeWidth="2.3"><path d="M18 6L6 18M6 6l12 12"/></svg>,
};
const DEFAULT_ICON = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A4A40" strokeWidth="2.3"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;

export default function Dashboard({ onNavigate, notifications = [] }) {
  const [summary, setSummary]         = useState(null);
  const [activity, setActivity]       = useState([]);
  const [loans, setLoans]             = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchAll = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [s, a, l] = await Promise.all([
        getDashboardSummary(),
        getDashboardActivity(),
        getLoanApplications(),
      ]);
      if (s) setSummary(s);
      if (a) setActivity(a.activities || a || []);
      if (l) {
        const arr = l.applications || l || [];
        setLoans([...arr].reverse()); // newest first
      }
      setLastRefresh(new Date());
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(true); }, [fetchAll]);
  useEffect(() => {
    const id = setInterval(() => fetchAll(false), 15000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const recentLoans = loans.slice(0, 5);
  return (
    <div className="main">
      <Navbar crumb="Dashboard" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
      <div className="content">

        {/* Hero */}
        <motion.div className="dash-hero" initial="hidden" animate="show" variants={container}>
          <div className="hero-l">
            <motion.div variants={fadeUp} className="hero-eyebrow">Why this platform exists</motion.div>
            <motion.div variants={fadeUp} className="hero-h">
              One verified identity, <em>reused</em> across every lender on the network.
            </motion.div>
            <motion.div variants={fadeUp} className="hero-sub">
              Customers verify KYC once. The credential is hashed and committed on-chain, then trusted instantly by Lloyds and every connected institution.
            </motion.div>
            <motion.div variants={fadeUp} className="hero-btns">
              <button className="hbtn hbtn-l" onClick={() => onNavigate('loan_applications')}>Walk through an application →</button>
              <button className="hbtn hbtn-o" onClick={async () => {
                const data = await getKycRegistry();
                const list = Array.isArray(data) ? data : [];
                const latest = list[list.length - 1];
                onNavigate('ledger_explorer', latest?.credentialId
                  ? { credentialId: latest.credentialId, customerName: latest.customerName }
                  : {});
              }}>Inspect the ledger</button>
            </motion.div>
          </div>
          <div className="hero-r">
            <div className="compare">
              <div className="compare-b"><div className="compare-l">Legacy KYC re-check</div><div className="compare-v m">48 hrs</div></div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8FCBAE" strokeWidth="2"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>
              <div className="compare-b"><div className="compare-l">On-chain reuse</div><div className="compare-v">4.2 min</div></div>
            </div>
            <div className="ticker">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8FCBAE" strokeWidth="2"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
              <span>
                <b style={{color:'#8FCBAE'}}>{summary?.fastTracked ?? '—'} of {summary?.totalApplications ?? '—'}</b> applications skipped re-upload today
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">01</span>Today across all products</div>
            <div className="block-note" style={{display:'flex',alignItems:'center',gap:8}}>
              {refreshing && <span style={{width:8,height:8,borderRadius:'50%',background:'#0E6E4B',display:'inline-block'}}/>}
              Auto-refreshes every 15s
              {lastRefresh && <span style={{opacity:0.5,fontSize:11}}>· {lastRefresh.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>}
            </div>
          </div>
          <motion.div className="stat-grid" initial="hidden" animate="show" variants={container}>
            {[
              { label: 'Applications received',         value: summary?.totalApplications   ?? '—', foot: 'Total in system',                                                             cls: 'flat' },
              { label: 'Fast-tracked via on-chain KYC', value: summary?.fastTracked          ?? '—', bar: summary?.fastTrackedPct, foot: `${summary?.fastTrackedPct ?? 0}% of total`,   cls: 'up' },
              { label: 'Avg. time to decision',         value: summary?.avgDecisionTime      ?? '—', foot: '↓ from 48 hrs baseline',                                                     cls: 'up' },
              { label: 'Credentials live on ledger',    value: summary?.credentialsOnLedger  ?? '—', foot: `${summary?.activeCredentials ?? 0} active · block #${summary?.blockHeight ?? '—'}`, cls: 'flat' },
            ].map((s, i) => (
              <motion.div key={i} className="stat dash-stat" variants={fadeUp}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                {s.bar != null && <div className="ptrack"><div className="pfill" style={{width:`${s.bar}%`}}></div></div>}
                <div className={`stat-foot ${s.cls}`}>{s.foot}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Network */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">02</span>Permissioned network topology</div>
            <div className="block-note">Live block height, consensus, and validator sync</div>
          </div>
          <div className="card card-pad">
            <div className="net-canvas">
              <svg width="100%" height="100%" viewBox="0 0 920 260" style={{position:'absolute',top:0,left:0}}>
                <line x1="460" y1="130" x2="460" y2="42" stroke="#D8D6CC" strokeWidth="1.5"/>
                <line x1="460" y1="130" x2="724" y2="84" stroke="#D8D6CC" strokeWidth="1.5"/>
                <line x1="460" y1="130" x2="724" y2="196" stroke="#D8D6CC" strokeWidth="1.5"/>
                <line x1="460" y1="130" x2="196" y2="196" stroke="#D8D6CC" strokeWidth="1.5"/>
                <line x1="460" y1="130" x2="196" y2="84" stroke="#D8D6CC" strokeWidth="1.5" strokeDasharray="4 3"/>
                <circle r="3.5" fill="#0E6E4B"><animateMotion dur="2.6s" repeatCount="indefinite" path="M460,130 L460,42"/></circle>
                <circle r="3.5" fill="#0E6E4B"><animateMotion dur="2.6s" begin="0.5s" repeatCount="indefinite" path="M460,130 L724,84"/></circle>
                <circle r="3.5" fill="#0E6E4B"><animateMotion dur="2.6s" begin="1s" repeatCount="indefinite" path="M460,130 L724,196"/></circle>
                <circle r="3.5" fill="#0E6E4B"><animateMotion dur="2.6s" begin="1.5s" repeatCount="indefinite" path="M460,130 L196,196"/></circle>
                <circle r="3" fill="#8C8B7E"><animateMotion dur="2.6s" begin="2s" repeatCount="indefinite" path="M460,130 L196,84"/></circle>
                <circle cx="460" cy="130" r="15" fill="#0E6E4B" stroke="#E2EEE7" strokeWidth="4"/>
                <text x="460" y="168" textAnchor="middle" fontSize="13" fontWeight="700" fill="#16160F" fontFamily="-apple-system,sans-serif">Lloyds</text>
                <text x="460" y="184" textAnchor="middle" fontSize="13" fontWeight="700" fill="#16160F" fontFamily="-apple-system,sans-serif">validator</text>
                <circle cx="460" cy="42" r="10" fill="#0E6E4B" stroke="#E2EEE7" strokeWidth="3"/>
                <text x="460" y="20" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4A4A40" fontFamily="-apple-system,sans-serif">Partner bank</text>
                <text x="460" y="34" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4A4A40" fontFamily="-apple-system,sans-serif">validator</text>
                <circle cx="724" cy="84" r="10" fill="#0E6E4B" stroke="#E2EEE7" strokeWidth="3"/>
                <text x="724" y="62" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4A4A40" fontFamily="-apple-system,sans-serif">Credit bureau</text>
                <text x="724" y="76" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4A4A40" fontFamily="-apple-system,sans-serif">validator</text>
                <circle cx="724" cy="196" r="10" fill="#0E6E4B" stroke="#E2EEE7" strokeWidth="3"/>
                <text x="724" y="222" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4A4A40" fontFamily="-apple-system,sans-serif">Backup</text>
                <text x="724" y="236" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4A4A40" fontFamily="-apple-system,sans-serif">validator</text>
                <circle cx="196" cy="196" r="10" fill="#8C8B7E" stroke="#E2EEE7" strokeWidth="3"/>
                <text x="196" y="222" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4A4A40" fontFamily="-apple-system,sans-serif">Regulator</text>
                <text x="196" y="236" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4A4A40" fontFamily="-apple-system,sans-serif">observer</text>
                <circle cx="196" cy="84" r="10" fill="#0E6E4B" stroke="#E2EEE7" strokeWidth="3"/>
                <text x="196" y="62" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4A4A40" fontFamily="-apple-system,sans-serif">Reserve</text>
                <text x="196" y="76" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4A4A40" fontFamily="-apple-system,sans-serif">validator</text>
              </svg>
            </div>
            <div className="net-foot">
              <span className="mono-sm">Consensus: RAFT</span>
              <span className="mono-sm">Block #{summary?.blockHeight ?? '48,221'}</span>
              <span style={{color:'#0B5C3F',fontWeight:700}}>{summary?.validatorSync ?? '4/4'} in sync</span>
            </div>
          </div>
        </section>

        {/* Recent applications — LIVE */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">03</span>Recent activity across products</div>
            <span className="block-link" onClick={() => onNavigate('loan_applications')}>Open loan queue →</span>
          </div>
          <div className="card">
            <table>
              <thead><tr><th>Applicant</th><th>Product</th><th>Amount</th><th>KYC source</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {recentLoans.length === 0 && (
                  <tr><td colSpan={6} style={{textAlign:'center',opacity:0.4,padding:'20px 0'}}>Loading…</td></tr>
                )}
                {recentLoans.map((r, i) => (
                  <tr key={i}>
                    <td><div className="person"><div className="av">{r.avatar || (r.applicantName||'?').slice(0,2)}</div>{r.applicantName}</div></td>
                    <td>{r.product}</td>
                    <td>{(r.amount||'').replace('GBP','£')}</td>
                    <td>
                      {(r.kycSource||'').includes('chain')
                        ? <span className="chain-ref"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/></svg>{r.kycSource}</span>
                        : <span className="mono-sm">{r.kycSource}</span>}
                    </td>
                    <td><span className={`tag ${STATUS_CLS[r.status] || 'tag-warn'}`}>{r.status}</span></td>
                    <td>{r.credentialId ? <span className="block-link" onClick={() => onNavigate('loan_applications')}>Review →</span> : <span className="mono-sm">awaiting</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live activity feed — LIVE from ledger_events */}
        <section className="block" style={{marginBottom:0}}>
          <div className="block-head">
            <div className="block-title"><span className="block-num">04</span>Live activity</div>
            <div className="block-note">Real-time ledger events</div>
          </div>
          <div className="card card-pad">
            <AnimatePresence initial={false}>
              {activity.length === 0 && (
                <div style={{opacity:0.4,fontSize:13,padding:'8px 0'}}>No activity yet — issue a credential or make a loan decision to see events here.</div>
              )}
              {activity.map((a, i) => (
                <motion.div
                  key={`${a.credentialId}-${a.timestamp}-${i}`}
                  className="activity-row"
                  initial={{opacity:0, x:-8}}
                  animate={{opacity:1, x:0}}
                  transition={{delay: i * 0.04}}
                >
                  {ACTION_ICON[a.type] || DEFAULT_ICON}
                  <div>
                    <b>{a.text}</b>
                    {a.blockNumber && <span className="mono-sm" style={{marginLeft:6}}>· block #{a.blockNumber}</span>}
                    {a.at && <span className="mono-sm" style={{marginLeft:6}}>— {a.at}</span>}
                    {a.description && <div style={{fontSize:12,opacity:0.55,marginTop:2}}>{a.description}</div>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}
