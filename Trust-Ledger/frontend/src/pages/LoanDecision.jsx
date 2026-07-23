import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useStore } from '../store';
import { decideLoan } from '../services/api';

export default function LoanDecision({ onNavigate }) {
  const { pushToast } = useStore();
  const [remark, setRemark] = useState('');
  const [decision, setDecision] = useState(null); // 'grant' | 'reject'
  const [loading, setLoading] = useState(false);

  const handleDecide = async (action) => {
    if (decision) return;
    setLoading(true);
    const res = await decideLoan('LN20458', action, remark, 'Senior Admin');
    setLoading(false);
    setDecision(action);
    if (action === 'grant') {
      pushToast('Loan GRANTED for Rohan Sharma — recorded on-chain', 'success', res?.txHash);
    } else {
      pushToast('Loan declined for Rohan Sharma', 'error');
    }
  };

  return (
    <div className="main">
      <Navbar crumb="Loan decision" onFluid={() => onNavigate('fluid_overview')} variant="admin" />
      <div className="ld-content">
        <div className="ld-title-row">
          <div>
            <div className="ld-title">Loan decision</div>
            <div className="ld-sub">Existing customer, KYC already verified on-chain — this is the fast path. Review the policy engine's recommendation and grant or decline.</div>
          </div>
          <span className="pill-dark-inline">Application #LN20458</span>
        </div>

        <motion.div className="ld-banner" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#024731" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/><path d="M14.47 14.48L20 20"/><path d="M8.12 8.12L12 12"/></svg>
          <div><b>This customer's identity is already verified on-chain.</b> No documents to chase, no waiting — the policy engine has already done the first pass.</div>
        </motion.div>

        <div className="ld-layout">
          {/* Main column */}
          <motion.div initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:0.1}}>
            <div className="ld-card">
              <div className="ld-applicant-row">
                <div className="ld-applicant-left">
                  <div className="ld-av">RS</div>
                  <div>
                    <div className="ld-applicant-name">Rohan Sharma</div>
                    <div className="ld-applicant-meta">Customer since March 2021 · Savings account holder</div>
                  </div>
                </div>
                <span className="ld-tag-existing">Existing customer</span>
              </div>

              <div className="ld-check-row">
                {['Photo ID verified','Identity check passed','Address verified','Video KYC done','Credential not expired'].map((c,i) => (
                  <div key={i} className="ld-check">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#024731" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                    {c}
                  </div>
                ))}
              </div>

              <div className="ld-divider"></div>

              <div className="ld-detail-grid">
                <div><div className="ld-detail-label">Requested amount</div><div className="ld-detail-value">£300,000</div></div>
                <div><div className="ld-detail-label">Tenure</div><div className="ld-detail-value">24 months</div></div>
                <div><div className="ld-detail-label">Purpose</div><div className="ld-detail-value">Home renovation</div></div>
                <div><div className="ld-detail-label">Estimated EMI</div><div className="ld-detail-value">£1,420/mo</div></div>
              </div>

              <div className="ld-divider"></div>

              <div className="ld-trace-label">Smart contract verdict</div>
              <div className="ld-trace">
                verifyKYC(0x88213a) → valid: true, expiry: 2027-06-12, issuer: Lloyds<br/>
                policyEngine.evaluate(amount=300000, credit_score=782) → <b style={{color:'#0B5C3F'}}>eligible: true</b>
              </div>
            </div>
          </motion.div>

          {/* Side column */}
          <motion.div initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} transition={{delay:0.15}}>
            <div className="ld-card ld-score-card">
              <div className="ld-gauge-wrap">
                <svg width="84" height="84" viewBox="0 0 84 84">
                  <circle cx="42" cy="42" r="36" fill="none" stroke="#E2E0D2" strokeWidth="8"/>
                  <circle cx="42" cy="42" r="36" fill="none" stroke="#0B5C3F" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray="226" strokeDashoffset="38" transform="rotate(-90 42 42)"/>
                  <text x="42" y="47" textAnchor="middle" fontSize="19" fontWeight="700" fill="#16160F" fontFamily="-apple-system,sans-serif">782</text>
                </svg>
              </div>
              <div className="ld-score-label">Credit score</div>
              <div className="ld-score-tag">Good · low risk</div>
            </div>

            <div className="ld-card">
              <div className="ld-ledger-label">Ledger reference</div>
              <div className="ld-ledger-mono">tx 0x7e21...4bcd</div>
              <div className="ld-ledger-mono">block #48,221 · 4/4 confirmed</div>
            </div>

            <div className="ld-card">
              <textarea className="ld-remark" placeholder="Add a remark for the audit trail (optional)" value={remark} onChange={e => setRemark(e.target.value)} disabled={!!decision}></textarea>
              {decision && (
                <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: decision === 'grant' ? '#e2eee7' : '#fcebeb', color: decision === 'grant' ? '#024731' : '#a32d2d', fontWeight: 700, fontSize: 13 }}>
                  {decision === 'grant' ? '✅ Loan Granted — written on-chain' : '❌ Loan Declined'}
                </div>
              )}
              <div className="ld-action-row">
                <button className="ld-btn-grant" onClick={() => handleDecide('grant')} disabled={!!decision || loading}
                  style={{ opacity: decision === 'reject' ? 0.4 : 1 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                  {loading && !decision ? 'Processing...' : 'Grant loan'}
                </button>
                <button className="ld-btn-reject" onClick={() => handleDecide('reject')} disabled={!!decision || loading}
                  style={{ opacity: decision === 'grant' ? 0.4 : 1 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  Reject
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
