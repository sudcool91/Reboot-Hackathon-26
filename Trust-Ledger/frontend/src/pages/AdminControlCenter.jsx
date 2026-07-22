import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };

const Check = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>;
const Dash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/></svg>;

export default function AdminControlCenter({ onNavigate }) {
  return (
    <div className="main">
      <Navbar crumb="Admin control center" onFluid={() => onNavigate('fluid_overview')} variant="admin" />
      <div className="content">
        <div className="page-title">Admin control center</div>
        <div className="page-sub">Who can see what, decide what, and write to the ledger — and the rules the policy engine runs automatically before any human looks at a file.</div>

        {/* Role hierarchy */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">01</span>Role hierarchy</div>
            <div className="block-note">4 access tiers · 24 active users · 2 external observer nodes</div>
          </div>
          <motion.div className="role-rank" initial="hidden" animate="show" variants={container}>
            <motion.div className="role-card" variants={fadeUp}>
              <div className="tier-bar tier-1"></div>
              <div className="role-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#024731" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
              <div className="role-name">Loan officer</div>
              <div className="role-desc">Reviews and decisions applications up to £50,000. Escalates larger or flagged cases upward.</div>
              <div className="role-foot"><span>14 users</span><span>Tier 1</span></div>
            </motion.div>
            <motion.div className="role-card mine" variants={fadeUp}>
              <div className="tier-bar tier-2"></div>
              <div className="role-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#024731" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/></svg></div>
              <div className="role-name">Senior admin <span className="mine-tag">You</span></div>
              <div className="role-desc">Unlimited decision authority, manages the policy engine, can issue and revoke on-chain credentials.</div>
              <div className="role-foot"><span>5 users</span><span>Tier 2</span></div>
            </motion.div>
            <motion.div className="role-card" variants={fadeUp}>
              <div className="tier-bar tier-2"></div>
              <div className="role-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#024731" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <div className="role-name">Compliance officer</div>
              <div className="role-desc">Independent audit access. Can flag or revoke any credential network-wide regardless of issuer.</div>
              <div className="role-foot"><span>3 users</span><span>Tier 2</span></div>
            </motion.div>
            <motion.div className="role-card" variants={fadeUp}>
              <div className="tier-bar tier-3"></div>
              <div className="role-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#024731" strokeWidth="2"><path d="M14 13V8a4 4 0 0 0-8 0v5"/><rect x="2" y="13" width="14" height="8" rx="1"/></svg></div>
              <div className="role-name">Regulator observer</div>
              <div className="role-desc">External read-only validator node. Sees anonymized application data and the full audit trail.</div>
              <div className="role-foot"><span>2 nodes</span><span>External</span></div>
            </motion.div>
          </motion.div>
        </section>

        {/* Permission matrix */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">02</span>Permission matrix</div>
            <div className="block-note">Enforced at the smart contract layer, not just the UI</div>
          </div>
          <motion.div className="card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
            <table className="matrix">
              <thead><tr><th>Capability</th><th>Loan officer</th><th>Senior admin</th><th>Compliance officer</th><th>Regulator observer</th></tr></thead>
              <tbody>
                {[
                  ['View applications','See applicant details and loan requests', <Check/>, <Check/>, <Check/>, <span className="partial">Anonymized</span>],
                  ['Accept / reject loans','Final decision authority on applications', <span className="partial">Up to £50K</span>, <Check/>, <Dash/>, <Dash/>],
                  ['Query verifyKYC()','Inspect credential validity and tx history on-chain', <Check/>, <Check/>, <Check/>, <Check/>],
                  ['Call issueKYC()','Commit a new credential attestation on-chain', <Dash/>, <Check/>, <Dash/>, <Dash/>],
                  ['Call revokeKYC()','Invalidate a credential network-wide', <Dash/>, <Check/>, <Check/>, <Dash/>],
                  ['Configure policy engine','Set auto-eligibility thresholds and risk rules', <Dash/>, <Check/>, <Dash/>, <Dash/>],
                  ['Access raw KYC documents','View encrypted off-chain PII in S3', <span className="partial">Assigned only</span>, <Check/>, <Check/>, <Dash/>],
                  ['Export full audit trail','Download ledger event history for any credential', <Dash/>, <Check/>, <Check/>, <Check/>],
                ].map(([name, desc, ...perms], i) => (
                  <tr key={i}>
                    <td><div className="perm-name">{name}</div><div className="perm-desc">{desc}</div></td>
                    {perms.map((p, j) => <td key={j} className={p.type === Check ? 'yes' : 'no'}>{p}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </section>

        <div className="grid2">
          <section className="block" style={{marginBottom:0}}>
            <div className="block-head"><div className="block-title"><span className="block-num">03</span>Policy engine rules</div></div>
            <div className="card card-pad">
              {[
                { name: 'Auto-eligible threshold', rule: 'amount ≤ 50,000 AND credit_score ≥ 700 AND kyc.valid = true' },
                { name: 'Manual review trigger', rule: 'credit_score < 700 OR amount > 50,000' },
                { name: 'Revocation cascade', rule: 'on revokeKYC() → flag all open applications using credential' },
                { name: 'Cross-bank credential trust', rule: 'accept verifyKYC() from any network-validated issuer' },
              ].map((p, i) => (
                <div key={i} className="policy-row">
                  <div><div className="policy-name">{p.name}</div><div className="policy-rule">{p.rule}</div></div>
                  <div className="toggle"></div>
                </div>
              ))}
            </div>
          </section>

          <section className="block" style={{marginBottom:0}}>
            <div className="block-head"><div className="block-title"><span className="block-num">04</span>Personal loans queue</div></div>
            <div className="card card-pad">
              <div className="qm-row">
                <div className="qm"><div className="qm-label">Auto-eligible</div><div className="qm-value">12</div></div>
                <div className="qm"><div className="qm-label">Manual review</div><div className="qm-value">4</div></div>
                <div className="qm"><div className="qm-label">Pending docs</div><div className="qm-value">2</div></div>
              </div>
              <table>
                <thead><tr><th>Applicant</th><th>Amount</th><th>Credit score</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td>Rohan Sharma</td><td>£300,000</td><td>782</td><td><span className="tag tag-go">Auto-eligible</span></td></tr>
                  <tr><td>Sara Thomas</td><td>£22,000</td><td>688</td><td><span className="tag tag-stop">Manual review</span></td></tr>
                  <tr><td>Vikram Desai</td><td>£50,000</td><td>—</td><td><span className="tag tag-warn">Pending docs</span></td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
