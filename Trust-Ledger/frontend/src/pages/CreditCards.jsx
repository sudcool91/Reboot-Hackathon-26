import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };

const CARDS = [
  {
    tier: 'PLATINUM',
    name: 'LLOYDS PLATINUM',
    num: '4821',
    range: '£30K – £100K',
    score: '750+',
    apr: '14.9%',
    perks: ['Unlimited cashback 1.5%', 'Airport lounge access', 'Zero FX fees', 'Concierge 24/7'],
    grad: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
    chip: '#a8c4e0',
    accent: '#60a5fa',
    glow: 'rgba(96,165,250,0.3)',
  },
  {
    tier: 'GOLD',
    name: 'LLOYDS GOLD',
    num: '7732',
    range: '£10K – £30K',
    score: '700+',
    apr: '19.9%',
    perks: ['Cashback 1%', 'Travel insurance', 'Purchase protection', 'Fraud alerts'],
    grad: 'linear-gradient(135deg, #2d1b00 0%, #5c3500 40%, #8b5e1a 100%)',
    chip: '#fcd34d',
    accent: '#f59e0b',
    glow: 'rgba(245,158,11,0.35)',
  },
  {
    tier: 'CLASSIC',
    name: 'LLOYDS CLASSIC',
    num: '1059',
    range: '£2.5K – £10K',
    score: '650+',
    apr: '24.9%',
    perks: ['0% on purchases 12mo', 'Balance transfer offer', 'Mobile payments', 'Instant freeze'],
    grad: 'linear-gradient(135deg, #024731 0%, #0B5C3F 60%, #1a7a4a 100%)',
    chip: '#6ee7b7',
    accent: '#34d399',
    glow: 'rgba(52,211,153,0.3)',
  },
];

const APPLICATIONS = [
  { initials:'PN', name:'Priya Nair',   tier:'GOLD',     score:801, limit:'£20,000', requested:'£20,000', status:'auto', checks:['KYC valid','Income verified','No defaults on file'] },
  { initials:'AS', name:'Aditya Singh', tier:'PLATINUM', score:738, limit:'Review',  requested:'£80,000', status:'manual', checks:['KYC valid','Income verified'], flag:'Existing exposure flagged' },
];

function CardVisual({ card, flipped, onClick }) {
  return (
    <motion.div
      style={{ perspective: 1000, cursor: 'pointer', width: '100%', maxWidth: 360 }}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <motion.div
        style={{ position: 'relative', width: '100%', paddingBottom: '60%', transformStyle: 'preserve-3d', transition: 'transform 0.6s cubic-bezier(0.4,0.2,0.2,1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front */}
        <div style={{
          position:'absolute',inset:0,borderRadius:20,background:card.grad,padding:'24px 28px',
          boxShadow:`0 20px 60px ${card.glow}, 0 4px 20px rgba(0,0,0,0.4)`,
          backfaceVisibility:'hidden',display:'flex',flexDirection:'column',justifyContent:'space-between',
          border:'1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{fontSize:10,letterSpacing:'0.2em',color:'rgba(255,255,255,0.5)',fontWeight:700}}>{card.tier}</div>
              <div style={{fontSize:16,fontWeight:900,color:'#fff',letterSpacing:'0.05em',marginTop:2}}>{card.name}</div>
            </div>
            <svg width="44" height="28" viewBox="0 0 44 28"><circle cx="16" cy="14" r="13" fill="rgba(255,255,255,0.15)"/><circle cx="28" cy="14" r="13" fill={card.accent} fillOpacity="0.35"/></svg>
          </div>
          {/* Chip */}
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:30,borderRadius:6,background:card.chip,opacity:0.9,border:'1px solid rgba(255,255,255,0.2)',
              backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 4px,rgba(0,0,0,0.08) 4px,rgba(0,0,0,0.08) 5px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(0,0,0,0.08) 8px,rgba(0,0,0,0.08) 9px)`
            }}/>
            <div style={{fontSize:18,letterSpacing:'0.18em',color:'rgba(255,255,255,0.9)',fontFamily:'monospace',fontWeight:600}}>
              •••• •••• •••• {card.num}
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
            <div>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',marginBottom:2}}>LIMIT RANGE</div>
              <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>{card.range}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',marginBottom:2}}>MIN SCORE</div>
              <div style={{fontSize:14,fontWeight:800,color:card.accent}}>{card.score}</div>
            </div>
          </div>
        </div>
        {/* Back */}
        <div style={{
          position:'absolute',inset:0,borderRadius:20,background:card.grad,
          boxShadow:`0 20px 60px ${card.glow}, 0 4px 20px rgba(0,0,0,0.4)`,
          backfaceVisibility:'hidden',transform:'rotateY(180deg)',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'20px 28px',
          border:'1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{height:36,background:'rgba(0,0,0,0.4)',margin:'0 -28px',marginTop:4}}/>
          <div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.15em',marginBottom:8}}>CARD PERKS</div>
            {card.perks.map((p,i)=>(
              <div key={i} style={{fontSize:12,color:'rgba(255,255,255,0.85)',marginBottom:5,display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:card.accent,display:'inline-block',flexShrink:0}}/>
                {p}
              </div>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'rgba(255,255,255,0.5)'}}>
            <span>Rep. APR {card.apr}</span>
            <span style={{fontSize:9,opacity:0.4}}>Click to flip</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CreditCards({ onNavigate, notifications = [] }) {
  const [flipped, setFlipped] = useState({});
  const [selected, setSelected] = useState(null);

  return (
    <div className="main">
      <Navbar crumb="Credit cards" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
      <div className="content">
        <div className="page-title">Credit cards</div>
        <div className="page-sub">Card applications and limit decisioning, powered by the same on-chain KYC credential used across every Lloyds product.</div>

        <motion.div className="stat-grid" initial="hidden" animate="show" variants={container}>
          {[
            { label: 'Applications today', value: '23', icon:'💳', grad:'linear-gradient(135deg,#024731,#0B5C3F)' },
            { label: 'Auto-approved', value: '16', icon:'⚡', grad:'linear-gradient(135deg,#2B5EA7,#4A80CC)' },
            { label: 'Manual underwriting', value: '5', icon:'🔍', grad:'linear-gradient(135deg,#854F0B,#B87333)' },
            { label: 'Avg. approved limit', value: '£24K', icon:'💰', grad:'linear-gradient(135deg,#5A2D82,#7B4FAA)' },
          ].map((s, i) => (
            <motion.div key={i} variants={fadeUp}
              style={{background:s.grad,borderRadius:16,padding:'20px 18px',color:'#fff',position:'relative',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.15)'}}>
              <div style={{position:'absolute',top:-14,right:-14,fontSize:52,opacity:0.12}}>{s.icon}</div>
              <div style={{fontSize:11,opacity:0.75,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>{s.label}</div>
              <div style={{fontSize:30,fontWeight:900,lineHeight:1}}>{s.value}</div>
            </motion.div>
          ))}
        </motion.div>

        <section className="block">
          <div className="block-head">
            <div className="block-title">Card products</div>
            <div className="block-note">Click a card to reveal perks &amp; APR</div>
          </div>
          <motion.div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:24,marginBottom:8}}
            initial="hidden" animate="show" variants={container}>
            {CARDS.map((card, i) => (
              <motion.div key={i} variants={fadeUp}>
                <CardVisual card={card} flipped={!!flipped[i]} onClick={()=>setFlipped(f=>({...f,[i]:!f[i]}))} />
                <div style={{marginTop:12,textAlign:'center',fontSize:11,color:'#9A9A8A'}}>
                  {flipped[i] ? 'Click card to see front' : 'Click card to see perks'}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="block" style={{marginBottom:0}}>
          <div className="block-head"><div className="block-title">Active applications</div></div>
          <div className="review-grid">
            {APPLICATIONS.map((app, i) => {
              const card = CARDS.find(c=>c.tier===app.tier)||CARDS[0];
              return (
                <motion.div className="review-card" key={i} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.15+i*0.1}}>
                  <div className="review-top">
                    <div className="person">
                      <div className="av" style={{width:38,height:38,fontSize:13,background:card.grad}}>{app.initials}</div>
                      <div><div style={{fontWeight:700,fontSize:14}}>{app.name}</div><div style={{fontSize:11.5,color:'#4A4A40'}}>Lloyds {app.tier} · requested</div></div>
                    </div>
                    {app.status==='auto'
                      ? <span className="tag tag-go">Auto-eligible</span>
                      : <span className="tag" style={{background:'#FCEBEB',color:'#A32D2D'}}>Manual review</span>}
                  </div>
                  <div className="check-pill-row">
                    {app.checks.map((c,j)=>(
                      <span key={j} className="check-pill"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>{c}</span>
                    ))}
                    {app.flag && <span className="check-pill" style={{background:'#FAEEDA',color:'#854F0B'}}>{app.flag}</span>}
                  </div>
                  <div className="limit-row"><span>Credit score</span><b>{app.score}</b></div>
                  <div className="limit-row"><span>Requested limit</span><b>{app.requested}</b></div>
                  <div className="limit-row"><span>Policy-recommended limit</span>
                    <b style={{color:app.status==='auto'?'#0B5C3F':'#854F0B'}}>{app.limit}</b>
                  </div>
                  <div className="verdict-trace">
                    verifyKYC(on-chain) → valid: true<br/>
                    policyEngine.cardLimit(score={app.score}, tier={app.tier}) → {app.limit}
                  </div>
                  <div className="action-row">
                    <button className="btn btn-go"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>Approve limit</button>
                    <button className="btn btn-stop"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>Decline</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
