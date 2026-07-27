import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FluidButton from './FluidButton';
import { useStore } from '../store';

const ACTION_ICON = {
  IssueKYC:       '🛡️',
  ConsentGranted: '📋',
  ConsentRevoked: '❌',
  VerifyKYC:      '🔍',
  LoanGranted:    '✅',
  LoanRejected:   '🚫',
};

function CryptoWalletModal({ user, onClose }) {
  const addr = user?.walletAddress || ('0x' + (user?.email || 'demo').split('').map(c=>c.charCodeAt(0).toString(16)).join('').slice(0,40).padEnd(40,'0'));
  const shortAddr = addr.slice(0,6)+'...'+addr.slice(-4);
  const [copied, setCopied] = useState(false);
  const [tick, setTick] = useState(0);

  // Live "block" counter for immersion
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2800);
    return () => clearInterval(id);
  }, []);

  const assets = [
    { name:'KYC Credential NFT', symbol:'KYC',  balance: user?.credentialId ? '1' : '0', color:'#4DFF9A', icon:'🔐', sub: user?.credentialId || 'Not issued' },
    { name:'Tokenised Deposit', symbol:'TD',   balance:'100.00', color:'#60AAFF', icon:'🏦', sub:'UK Digital Asset' },
    { name:'Gilt-backed TD',    symbol:'GBTD', balance:'5.00',   color:'#FFB347', icon:'🏛', sub:'Govt-backed token' },
  ];

  const copyAddr = () => {
    navigator.clipboard?.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
      onClick={onClose}>
      <motion.div initial={{scale:0.88,y:28,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.88,y:28,opacity:0}}
        transition={{type:'spring',stiffness:300,damping:26}}
        style={{
          background:'linear-gradient(160deg,#060B18 0%,#0C1A2E 55%,#071A12 100%)',
          borderRadius:28, width:420, maxWidth:'100%',
          padding:'32px 28px 28px',
          boxShadow:'0 0 0 1px rgba(77,255,154,0.12), 0 32px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
          position:'relative', overflow:'hidden',
        }}
        onClick={e=>e.stopPropagation()}>

        {/* Animated background grid */}
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.04,pointerEvents:'none'}} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#4DFF9A" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>

        {/* Glowing orb */}
        <div style={{position:'absolute',top:-80,right:-80,width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(77,255,154,0.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-60,left:-60,width:180,height:180,borderRadius:'50%',background:'radial-gradient(circle,rgba(96,170,255,0.06) 0%,transparent 70%)',pointerEvents:'none'}}/>

        <button onClick={onClose} style={{position:'absolute',top:16,right:18,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,cursor:'pointer',fontSize:14,color:'rgba(255,255,255,0.5)',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>✕</button>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:28,position:'relative'}}>
          <motion.div animate={{boxShadow:['0 0 12px rgba(77,255,154,0.4)','0 0 28px rgba(77,255,154,0.7)','0 0 12px rgba(77,255,154,0.4)']}} transition={{duration:2.4,repeat:Infinity}}
            style={{width:52,height:52,borderRadius:16,background:'linear-gradient(135deg,#024731 0%,#0B5C3F 50%,#2B5EA7 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>
            💳
          </motion.div>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:900,color:'#fff',letterSpacing:'-0.01em'}}>Crypto Wallet</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:1}}>
              {user?.name || 'User'} · Non-custodial
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
            <motion.div animate={{opacity:[0.7,1,0.7]}} transition={{duration:1.8,repeat:Infinity}}
              style={{background:'rgba(77,255,154,0.12)',border:'1px solid rgba(77,255,154,0.3)',borderRadius:20,padding:'3px 10px',fontSize:10,color:'#4DFF9A',fontWeight:800,letterSpacing:'0.05em'}}>
              ● LIVE
            </motion.div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',fontFamily:'monospace'}}>
              blk #{(48221+tick).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Wallet address */}
        <div style={{background:'rgba(77,255,154,0.05)',borderRadius:14,padding:'14px 16px',marginBottom:20,border:'1px solid rgba(77,255,154,0.12)',position:'relative'}}>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.35)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700}}>Wallet address · Hyperledger Fabric</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
            <div style={{fontFamily:'monospace',fontSize:13,color:'#4DFF9A',fontWeight:700,letterSpacing:'0.02em'}}>{shortAddr}</div>
            <motion.button onClick={copyAddr} whileTap={{scale:0.9}}
              style={{background:copied?'rgba(77,255,154,0.15)':'rgba(255,255,255,0.06)',border:`1px solid ${copied?'rgba(77,255,154,0.4)':'rgba(255,255,255,0.1)'}`,borderRadius:8,cursor:'pointer',color:copied?'#4DFF9A':'rgba(255,255,255,0.5)',fontSize:11,padding:'5px 10px',fontFamily:'inherit',fontWeight:600,transition:'all 0.2s'}}>
              {copied?'✓ Copied':'Copy'}
            </motion.button>
          </div>
          <div style={{marginTop:10,display:'flex',gap:4,flexWrap:'wrap'}}>
            {addr.match(/.{1,8}/g)?.map((seg,i)=>(
              <span key={i} style={{fontFamily:'monospace',fontSize:9,color:'rgba(77,255,154,0.25)',letterSpacing:'0.04em'}}>{seg}</span>
            ))}
          </div>
        </div>

        {/* Assets */}
        <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700}}>Digital assets on-chain</div>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
          {assets.map((a,i)=>(
            <motion.div key={a.symbol} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:0.1+i*0.07}}
              style={{background:'rgba(255,255,255,0.03)',borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:12,border:'1px solid rgba(255,255,255,0.06)',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,borderRadius:'3px 0 0 3px',background:a.color,opacity:0.6}}/>
              <span style={{fontSize:22,flexShrink:0}}>{a.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:'#fff'}}>{a.name}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.sub}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:15,fontWeight:900,color:a.balance==='0'?'rgba(255,255,255,0.2)':a.color}}>{a.balance}</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.25)'}}>{a.symbol}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Network status */}
        <div style={{background:'rgba(255,255,255,0.02)',borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:10,border:'1px solid rgba(255,255,255,0.05)',marginBottom:16}}>
          <motion.div animate={{opacity:[1,0.4,1]}} transition={{duration:1.6,repeat:Infinity}}
            style={{width:8,height:8,borderRadius:'50%',background:'#4DFF9A',boxShadow:'0 0 10px #4DFF9A',flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',fontWeight:600}}>Connected · <span style={{color:'#4DFF9A'}}>Hyperledger Fabric</span> · kycchannel</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:2}}>4/4 validators in sync · RAFT consensus</div>
          </div>
        </div>

        <div style={{textAlign:'center',fontSize:10,color:'rgba(255,255,255,0.15)',fontFamily:'monospace'}}>🔒 Non-custodial · End-to-end encrypted · Coming in v2.0</div>
      </motion.div>
    </motion.div>
  );
}

// ── Customer chain stats (shown on all customer pages) ──────────────────────
function CustomerChainStats() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(id);
  }, []);
  const block = (48221 + tick).toLocaleString();
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <motion.div key={block} initial={{y:-5,opacity:0}} animate={{y:0,opacity:1}} transition={{type:'spring',stiffness:400,damping:28}}
        style={{ display:'flex', alignItems:'center', gap:7,
          background:'linear-gradient(135deg,#012820,#024731)',
          border:'1.5px solid rgba(77,255,154,0.25)', borderRadius:10, padding:'5px 11px',
          boxShadow:'0 0 8px rgba(77,255,154,0.08)' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4DFF9A" strokeWidth="2.5">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        </svg>
        <span style={{fontSize:11,fontWeight:800,color:'#4DFF9A',fontFamily:'monospace'}}>#{block}</span>
      </motion.div>
      <div style={{ display:'flex', alignItems:'center', gap:6,
        background:'rgba(1,28,18,0.85)', border:'1.5px solid rgba(77,255,154,0.2)',
        borderRadius:99, padding:'5px 10px' }}>
        <motion.div animate={{opacity:[1,0.3,1]}} transition={{duration:1.4,repeat:Infinity}}
          style={{width:6,height:6,borderRadius:'50%',background:'#4DFF9A',boxShadow:'0 0 6px #4DFF9A'}}/>
        <span style={{fontSize:10,fontWeight:800,color:'#4DFF9A',letterSpacing:'0.05em'}}>Network healthy</span>
      </div>
    </div>
  );
}

// ── Admin chain stats (shown in navbar on all admin pages) ───────────────────
function AdminChainStats() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3200);
    return () => clearInterval(id);
  }, []);
  const block = (48221 + tick).toLocaleString();

  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>

      {/* Role badge */}
      <div style={{
        display:'flex', alignItems:'center', gap:7,
        background:'linear-gradient(135deg,#012820,#024731)',
        border:'1.5px solid rgba(77,255,154,0.3)',
        borderRadius:10, padding:'6px 12px',
        boxShadow:'0 0 10px rgba(77,255,154,0.1)',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4DFF9A" strokeWidth="2.2">
          <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/>
        </svg>
        <div>
          <div style={{fontSize:8,color:'rgba(77,255,154,0.5)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',lineHeight:1}}>Role</div>
          <div style={{fontSize:11,fontWeight:900,color:'#4DFF9A',lineHeight:1.2,whiteSpace:'nowrap'}}>Tier 2 · Senior admin</div>
        </div>
      </div>

      {/* Block height */}
      <motion.div key={block} initial={{y:-6,opacity:0}} animate={{y:0,opacity:1}} transition={{type:'spring',stiffness:400,damping:28}}
        style={{
          display:'flex', alignItems:'center', gap:7,
          background:'linear-gradient(135deg,#0D1B3E,#1a2a5e)',
          border:'1.5px solid rgba(96,170,255,0.3)',
          borderRadius:10, padding:'6px 12px',
          boxShadow:'0 0 10px rgba(96,170,255,0.1)',
        }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60AAFF" strokeWidth="2.5">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        </svg>
        <div>
          <div style={{fontSize:8,color:'rgba(96,170,255,0.5)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',lineHeight:1}}>Block</div>
          <div style={{fontSize:11,fontWeight:900,color:'#60AAFF',fontFamily:'monospace',lineHeight:1.2}}>#{block}</div>
        </div>
      </motion.div>

      {/* Channel */}
      <div style={{
        display:'flex', alignItems:'center', gap:7,
        background:'linear-gradient(135deg,#1A0A2E,#2D1565)',
        border:'1.5px solid rgba(167,139,250,0.3)',
        borderRadius:10, padding:'6px 12px',
        boxShadow:'0 0 10px rgba(167,139,250,0.08)',
      }}>
        <div style={{display:'flex',gap:2.5,alignItems:'center'}}>
          {[0,1,2,3].map(i=>(
            <motion.div key={i} animate={{opacity:[0.4,1,0.4]}} transition={{duration:1.8,repeat:Infinity,delay:i*0.35}}
              style={{width:4,height:4,borderRadius:'50%',background:'#A78BFA',boxShadow:'0 0 4px #A78BFA'}}/>
          ))}
        </div>
        <div>
          <div style={{fontSize:8,color:'rgba(167,139,250,0.5)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',lineHeight:1}}>Channel</div>
          <div style={{fontSize:11,fontWeight:900,color:'#A78BFA',lineHeight:1.2}}>kycchannel</div>
        </div>
      </div>

      {/* Live */}
      <motion.div animate={{boxShadow:['0 0 0 0 rgba(77,255,154,0.35)','0 0 0 5px rgba(77,255,154,0)']}} transition={{duration:2,repeat:Infinity}}
        style={{display:'flex',alignItems:'center',gap:5,
          background:'rgba(1,28,18,0.85)',border:'1.5px solid rgba(77,255,154,0.25)',
          borderRadius:99,padding:'5px 10px'}}>
        <motion.div animate={{opacity:[1,0.3,1]}} transition={{duration:1.2,repeat:Infinity}}
          style={{width:6,height:6,borderRadius:'50%',background:'#4DFF9A',boxShadow:'0 0 8px #4DFF9A'}}/>
        <span style={{fontSize:10,fontWeight:800,color:'#4DFF9A',letterSpacing:'0.05em'}}>LIVE</span>
      </motion.div>
    </div>
  );
}

// ── Ledger Stats bar (shown in navbar on Ledger Explorer) ───────────────────
function LedgerStats({ blockHeight }) {
  const [tick, setTick] = useState(0);
  const [tps, setTps] = useState(3);
  const [latency, setLatency] = useState(142);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setTps(Math.floor(2 + Math.random() * 5));
      setLatency(Math.floor(120 + Math.random() * 60));
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const block = (parseInt((blockHeight || '48221').toString().replace(',','')) + tick).toLocaleString();

  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>

      {/* Block counter */}
      <motion.div
        key={block}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{
          display:'flex', alignItems:'center', gap:7,
          background:'linear-gradient(135deg,#012820,#024731)',
          border:'1.5px solid rgba(77,255,154,0.35)',
          borderRadius:10, padding:'6px 12px',
          boxShadow:'0 0 12px rgba(77,255,154,0.12)',
        }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4DFF9A" strokeWidth="2.5">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        </svg>
        <div>
          <div style={{fontSize:8,color:'rgba(77,255,154,0.5)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',lineHeight:1}}>Block</div>
          <div style={{fontSize:12,fontWeight:900,color:'#4DFF9A',fontFamily:'monospace',lineHeight:1.2}}>#{block}</div>
        </div>
      </motion.div>

      {/* Validators */}
      <div style={{
        display:'flex', alignItems:'center', gap:7,
        background:'linear-gradient(135deg,#0D1B3E,#1a2a5e)',
        border:'1.5px solid rgba(96,170,255,0.35)',
        borderRadius:10, padding:'6px 12px',
        boxShadow:'0 0 12px rgba(96,170,255,0.1)',
      }}>
        <div style={{display:'flex',gap:3,alignItems:'center'}}>
          {[0,1,2,3].map(i => (
            <motion.div key={i}
              animate={{opacity:[0.5,1,0.5]}}
              transition={{duration:1.6,repeat:Infinity,delay:i*0.3}}
              style={{width:5,height:5,borderRadius:'50%',background:'#60AAFF',boxShadow:'0 0 4px #60AAFF'}}/>
          ))}
        </div>
        <div>
          <div style={{fontSize:8,color:'rgba(96,170,255,0.55)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',lineHeight:1}}>Validators</div>
          <div style={{fontSize:12,fontWeight:900,color:'#60AAFF',lineHeight:1.2}}>4/4 <span style={{fontSize:9,fontWeight:500,opacity:0.7}}>RAFT</span></div>
        </div>
      </div>

      {/* TPS */}
      <div style={{
        display:'flex', alignItems:'center', gap:7,
        background:'linear-gradient(135deg,#1A0A2E,#2D1565)',
        border:'1.5px solid rgba(167,139,250,0.35)',
        borderRadius:10, padding:'6px 12px',
        boxShadow:'0 0 12px rgba(167,139,250,0.1)',
      }}>
        <motion.svg animate={{rotate:[0,360]}} transition={{duration:3,repeat:Infinity,ease:'linear'}}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
        </motion.svg>
        <div>
          <div style={{fontSize:8,color:'rgba(167,139,250,0.55)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',lineHeight:1}}>TPS</div>
          <div style={{fontSize:12,fontWeight:900,color:'#A78BFA',fontFamily:'monospace',lineHeight:1.2}}>{tps}.0</div>
        </div>
      </div>

      {/* Latency */}
      <div style={{
        display:'flex', alignItems:'center', gap:7,
        background:'linear-gradient(135deg,#1A0F00,#3D2200)',
        border:'1.5px solid rgba(251,191,36,0.35)',
        borderRadius:10, padding:'6px 12px',
        boxShadow:'0 0 12px rgba(251,191,36,0.08)',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FBB824" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        <div>
          <div style={{fontSize:8,color:'rgba(251,191,36,0.55)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',lineHeight:1}}>Latency</div>
          <div style={{fontSize:12,fontWeight:900,color:'#FBB824',fontFamily:'monospace',lineHeight:1.2}}>{latency}ms</div>
        </div>
      </div>

      {/* Live pulse */}
      <motion.div
        animate={{boxShadow:['0 0 0 0 rgba(77,255,154,0.4)','0 0 0 6px rgba(77,255,154,0)']}}
        transition={{duration:1.8,repeat:Infinity}}
        style={{display:'flex',alignItems:'center',gap:5,
          background:'rgba(1,28,18,0.85)',border:'1.5px solid rgba(77,255,154,0.25)',
          borderRadius:99,padding:'5px 10px'}}>
        <motion.div animate={{opacity:[1,0.3,1]}} transition={{duration:1.2,repeat:Infinity}}
          style={{width:6,height:6,borderRadius:'50%',background:'#4DFF9A',boxShadow:'0 0 8px #4DFF9A'}}/>
        <span style={{fontSize:10,fontWeight:800,color:'#4DFF9A',letterSpacing:'0.05em'}}>LIVE</span>
      </motion.div>
    </div>
  );
}

export default function Navbar({ crumb, onFluid, variant = 'default', notifications = [], blockHeight }) {
  const { currentUser, logout } = useStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const unread = notifications.length;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="navbar">
      <div className="navbar-crumbs">
        Lloyds DLT Platform / <b>{crumb}</b>
      </div>
      <div className="navbar-right">
        <FluidButton onClick={onFluid} />
        {variant === 'admin' ? (
          <AdminChainStats />
        ) : variant === 'ledger' ? (
          <LedgerStats blockHeight={blockHeight} />
        ) : (
          <CustomerChainStats />
        )}

        {/* Notification Bell */}
        <div data-tour="nav-bell" style={{ position: 'relative' }}>
          <motion.div
            className="icon-btn"
            onClick={() => setNotifOpen(o => !o)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            style={{
              position: 'relative', cursor: 'pointer',
              width: 38, height: 38, borderRadius: 12,
              background: notifOpen ? 'linear-gradient(135deg,#024731,#0B5C3F)' : 'rgba(2,71,49,0.07)',
              border: `1.5px solid ${notifOpen ? 'transparent' : 'rgba(2,71,49,0.12)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s, border 0.2s',
              boxShadow: notifOpen ? '0 4px 16px rgba(2,71,49,0.25)' : 'none',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={notifOpen ? '#fff' : '#4A4A40'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && (
              <motion.span initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:400,damping:18}}
                style={{
                  position: 'absolute', top: -4, right: -4,
                  background: 'linear-gradient(135deg,#A32D2D,#CC4444)',
                  color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1,
                  minWidth: 17, height: 17, borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px', border: '2px solid #FAFAF7',
                  boxShadow: '0 2px 8px rgba(163,45,45,0.5)',
                }}>
                {unread > 99 ? '99+' : unread}
              </motion.span>
            )}
          </motion.div>

          <AnimatePresence>
            {notifOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                  onClick={() => setNotifOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  style={{
                    position: 'absolute', top: 36, right: 0, width: 360,
                    background: '#FAFAF7', borderRadius: 14, zIndex: 999,
                    boxShadow: '0 16px 60px rgba(0,0,0,0.18)', border: '1px solid #E2E0D2',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #E2E0D2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A14' }}>Recent activity</div>
                    <div style={{ fontSize: 11, color: '#9A9A8A' }}>{unread} events</div>
                  </div>
                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {notifications.length === 0 && (
                      <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: '#9A9A8A' }}>No recent activity</div>
                    )}
                    {notifications.map((n, i) => (
                      <div key={i} style={{
                        padding: '10px 16px', borderBottom: i < notifications.length - 1 ? '1px solid #F0EEE4' : 'none',
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                      }}>
                        <span style={{ fontSize: 16, marginTop: 1 }}>{ACTION_ICON[n.type] || '📌'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A14', lineBreak: 'anywhere' }}>{n.msg || n.text || '—'}</div>
                          {n.description && <div style={{ fontSize: 11, color: '#6A6A5A', marginTop: 2 }}>{n.description}</div>}
                          <div style={{ fontSize: 10, color: '#9A9A8A', marginTop: 3 }}>
                            {n.blockNumber && <span>block #{n.blockNumber} · </span>}
                            {n.at || (n.time ? new Date(n.time).toLocaleDateString('en-GB', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px 16px', borderTop: '1px solid #E2E0D2', textAlign: 'center' }}>
                    <span style={{ fontSize: 11, color: '#0B5C3F', fontWeight: 600, cursor: 'pointer' }} onClick={() => setNotifOpen(false)}>
                      Close
                    </span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <motion.div data-tour="nav-wallet" className="nav-av" onClick={()=>setWalletOpen(true)} title="Open crypto wallet"
          whileHover={{ scale: 1.1, boxShadow: isAdmin ? '0 0 0 3px rgba(2,71,49,0.3), 0 4px 16px rgba(2,71,49,0.4)' : '0 0 0 3px rgba(43,94,167,0.3), 0 4px 16px rgba(43,94,167,0.4)' }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: isAdmin
              ? 'linear-gradient(135deg,#024731,#0B5C3F)'
              : 'linear-gradient(135deg,#2B5EA7,#4A80CC)',
            color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer',
            userSelect: 'none', border: 'none',
            boxShadow: isAdmin ? '0 4px 14px rgba(2,71,49,0.35)' : '0 4px 14px rgba(43,94,167,0.35)',
          }}>
          {currentUser?.initials || 'U'}
        </motion.div>

        {/* Crypto Wallet Modal */}
        <AnimatePresence>
          {walletOpen && <CryptoWalletModal user={currentUser} onClose={()=>setWalletOpen(false)}/>}
        </AnimatePresence>

        {/* Logout button */}
        <motion.button
          onClick={logout}
          title="Sign out"
          whileHover={{ scale: 1.04, background: '#A32D2D', color: '#fff', borderColor: '#A32D2D' }}
          whileTap={{ scale: 0.96 }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: '#FCEBEB', border: '1.5px solid #F0C0C0', color: '#A32D2D', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.2s' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </motion.button>
      </div>
    </div>
  );
}

