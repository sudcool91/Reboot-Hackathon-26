import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };

export default function CreditCards({ onNavigate }) {
  return (
    <div className="main">
      <Navbar crumb="Credit cards" onFluid={() => onNavigate('fluid_overview')} />
      <div className="content">
        <div className="page-title">Credit cards</div>
        <div className="page-sub">Card applications and limit decisioning, powered by the same on-chain KYC credential used across every Lloyds product.</div>

        <motion.div className="stat-grid" initial="hidden" animate="show" variants={container}>
          {[
            { label: 'Applications today', value: '23' },
            { label: 'Auto-approved limits', value: '16' },
            { label: 'Manual underwriting', value: '5' },
            { label: 'Avg. approved limit', value: '£24,000' },
          ].map((s, i) => (
            <motion.div key={i} className="stat" variants={fadeUp}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </motion.div>
          ))}
        </motion.div>

        <section className="block">
          <div className="block-head">
            <div className="block-title">Card products</div>
            <div className="block-note">Limit tiers driven by the policy engine</div>
          </div>
          <motion.div className="card-grid" initial="hidden" animate="show" variants={container}>
            {[
              { cls: 'cc-platinum', name: 'LLOYDS PLATINUM', num: '•••• •••• •••• 4821', range: '£30K – £100K', score: '750+' },
              { cls: 'cc-gold', name: 'LLOYDS GOLD', num: '•••• •••• •••• 7732', range: '£10K – £30K', score: '700+' },
              { cls: 'cc-classic', name: 'LLOYDS CLASSIC', num: '•••• •••• •••• 1059', range: '£2.5K – £10K', score: '650+' },
            ].map((c, i) => (
              <motion.div key={i} className={`credit-card-tile ${c.cls}`} variants={fadeUp}>
                <div className="cc-top"><span className="cc-name">{c.name}</span><div className="cc-chip"></div></div>
                <div className="cc-number">{c.num}</div>
                <div className="cc-foot">
                  <div><div>Limit range</div><div>{c.range}</div></div>
                  <div><div>Requires credit score</div><div>{c.score}</div></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="block" style={{marginBottom:0}}>
          <div className="block-head"><div className="block-title">Active applications</div></div>
          <div className="review-grid">
            {/* Card 1 */}
            <motion.div className="review-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.15}}>
              <div className="review-top">
                <div className="person"><div className="av" style={{width:38,height:38,fontSize:13}}>PN</div>
                  <div><div style={{fontWeight:700,fontSize:14}}>Priya Nair</div><div style={{fontSize:11.5,color:'#4A4A40'}}>Lloyds Gold · requested</div></div>
                </div>
                <span className="tag tag-go">Auto-eligible</span>
              </div>
              <div className="check-pill-row">
                <span className="check-pill"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>KYC valid</span>
                <span className="check-pill"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>Income verified</span>
                <span className="check-pill"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>No defaults on file</span>
              </div>
              <div className="limit-row"><span>Credit score</span><b>801</b></div>
              <div className="limit-row"><span>Requested limit</span><b>£20,000</b></div>
              <div className="limit-row"><span>Policy-recommended limit</span><b style={{color:'#0B5C3F'}}>£20,000</b></div>
              <div className="verdict-trace">verifyKYC(0x55a1) → valid: true<br/>policyEngine.cardLimit(credit_score=801, tier=GOLD) → £20,000</div>
              <div className="action-row">
                <button className="btn btn-go"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>Approve limit</button>
                <button className="btn btn-stop"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>Decline</button>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div className="review-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.25}}>
              <div className="review-top">
                <div className="person"><div className="av" style={{width:38,height:38,fontSize:13}}>AS</div>
                  <div><div style={{fontWeight:700,fontSize:14}}>Aditya Singh</div><div style={{fontSize:11.5,color:'#4A4A40'}}>Lloyds Platinum · requested</div></div>
                </div>
                <span className="tag" style={{background:'#FCEBEB',color:'#A32D2D'}}>Manual review</span>
              </div>
              <div className="check-pill-row">
                <span className="check-pill"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>KYC valid</span>
                <span className="check-pill"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>Income verified</span>
                <span className="check-pill" style={{background:'#FAEEDA',color:'#854F0B'}}>Existing exposure flagged</span>
              </div>
              <div className="limit-row"><span>Credit score</span><b>738</b></div>
              <div className="limit-row"><span>Requested limit</span><b>£80,000</b></div>
              <div className="limit-row"><span>Policy-recommended limit</span><b style={{color:'#854F0B'}}>Review required</b></div>
              <div className="verdict-trace">verifyKYC(0x91c4) → valid: true<br/>policyEngine.cardLimit(credit_score=738, tier=PLATINUM, exposure=high) → flagged</div>
              <div className="action-row">
                <button className="btn btn-go"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>Approve limit</button>
                <button className="btn btn-stop"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>Decline</button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
