import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function Dashboard({ onNavigate }) {
  return (
    <div className="main">
      <Navbar crumb="Dashboard" onFluid={() => onNavigate('fluid_overview')} />
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
              <button className="hbtn hbtn-o" onClick={() => onNavigate('ledger_explorer')}>Inspect the ledger</button>
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
              <span><b style={{color:'#8FCBAE'}}>31 of 47</b> applications skipped re-upload today</span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">01</span>Today across all products</div>
            <div className="block-note">Auto-refreshes every 30 seconds</div>
          </div>
          <motion.div className="stat-grid" initial="hidden" animate="show" variants={container}>
            {[
              { label: 'Applications received', value: '47', foot: '↑ 12% vs yesterday', cls: 'up' },
              { label: 'Fast-tracked via on-chain KYC', value: '31', bar: 66, foot: '66% of total volume', cls: 'flat' },
              { label: 'Avg. time to decision', value: '4.2 min', foot: '↓ from 48 hrs baseline', cls: 'up' },
              { label: 'Credentials live on ledger', value: '12,884', foot: 'across 3 institutions', cls: 'flat' },
            ].map((s, i) => (
              <motion.div key={i} className="stat dash-stat" variants={fadeUp}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                {s.bar && <div className="ptrack"><div className="pfill" style={{width:`${s.bar}%`}}></div></div>}
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
              <span className="mono-sm">Block #48,221</span>
              <span style={{color:'#0B5C3F',fontWeight:700}}>4/4 in sync</span>
            </div>
          </div>
        </section>

        {/* Recent activity table */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">03</span>Recent activity across products</div>
            <span className="block-link" onClick={() => onNavigate('loan_applications')}>Open loan queue →</span>
          </div>
          <div className="card">
            <table>
              <thead><tr><th>Applicant</th><th>Product</th><th>Amount</th><th>KYC source</th><th>Status</th><th></th></tr></thead>
              <tbody>
                <tr>
                  <td><div className="person"><div className="av">RS</div>Rohan Sharma</div></td>
                  <td>Personal loan</td><td>£300,000</td>
                  <td><span className="chain-ref"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/></svg>On-chain</span></td>
                  <td><span className="tag tag-go">Auto-eligible</span></td>
                  <td><span className="block-link" onClick={() => onNavigate('loan_applications')}>Review →</span></td>
                </tr>
                <tr>
                  <td><div className="person"><div className="av">PN</div>Priya Nair</div></td>
                  <td>Credit card</td><td>£20,000 limit</td>
                  <td><span className="chain-ref"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/></svg>On-chain</span></td>
                  <td><span className="tag tag-go">Auto-eligible</span></td>
                  <td><span className="block-link" onClick={() => onNavigate('credit_cards')}>Review →</span></td>
                </tr>
                <tr>
                  <td><div className="person"><div className="av">VD</div>Vikram Desai</div></td>
                  <td>Home loan</td><td>£450,000</td>
                  <td><span className="mono-sm">New · uploading</span></td>
                  <td><span className="tag tag-warn">Pending docs</span></td>
                  <td><span className="mono-sm">awaiting</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Live Activity */}
        <section className="block" style={{marginBottom:0}}>
          <div className="block-head"><div className="block-title"><span className="block-num">04</span>Live activity</div></div>
          <div className="card card-pad">
            {[
              { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E6E4B" strokeWidth="2.3"><path d="M20 6L9 17l-5-5"/></svg>, text: <><b>Anita accepted LN20458</b> for Rohan Sharma — <span className="mono-sm">2 min ago</span></> },
              { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2.3"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, text: <><b>Compliance flagged</b> credential KYC-VD-19042 — <span className="mono-sm">38 min ago</span></> },
              { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E6E4B" strokeWidth="2.3"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/></svg>, text: <><b>New credential issued</b> for Meera Iyer · block #48,201 — <span className="mono-sm">1 hr ago</span></> },
              { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A4A40" strokeWidth="2.3"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>, text: <><b>Partner bank verified</b> a credential via verifyKYC() — <span className="mono-sm">3 hrs ago</span></> },
              { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A4A40" strokeWidth="2.3"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, text: <><b>Regulator node synced</b> to block #48,221 — <span className="mono-sm">3 hrs ago</span></> },
            ].map((a, i) => (
              <div key={i} className="activity-row">{a.icon}<div>{a.text}</div></div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
