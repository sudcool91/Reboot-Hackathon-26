import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import { useStore } from "../store";
import { getKycRegistry, getLoanApplications, getKycRequestsByEmail, getKycRequests, getShareRequestsByEmail, submitShareRequest, decideShareRequest } from "../services/api";

const fadeUp = { hidden:{opacity:0,y:14}, show:{opacity:1,y:0} };
const container = { hidden:{}, show:{transition:{staggerChildren:0.08}} };

const BANKS = ["Lloyds Bank","Halifax","Bank of Scotland","Scottish Widows","MBNA","Black Horse","Lex Autolease","Lloyds Wealth","Lloyds Technology Centre"];

function ShareModal({ kycRecord, customerUser, onClose, onSubmitted }) {
  const [selected, setSelected] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleShare = async () => {
    if (!selected) return;
    setSubmitting(true);
    await submitShareRequest({
      credentialId: kycRecord.credentialId,
      customerName: customerUser?.name || kycRecord.customerName,
      customerEmail: customerUser?.email || "",
      targetBank: selected,
      status: "pending",
    });
    setSubmitting(false);
    setDone(true);
    setTimeout(() => { onSubmitted(); onClose(); }, 1800);
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={onClose}>
      <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9,y:20}}
        transition={{type:"spring",stiffness:280,damping:22}}
        style={{background:"#FAFAF7",borderRadius:20,width:480,maxWidth:"100%",padding:"28px 28px 24px",boxShadow:"0 24px 80px rgba(0,0,0,0.25)",position:"relative"}}
        onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:16,background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#9A9A8A"}}>✕</button>

        {done ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>📬</div>
            <div style={{fontSize:18,fontWeight:800,color:"#024731",marginBottom:6}}>Request sent to admin!</div>
            <div style={{fontSize:13,color:"#4A4A40"}}>Your credential share request with <b>{selected}</b> is pending admin approval.</div>
          </div>
        ) : (
          <>
            <div style={{fontSize:18,fontWeight:800,color:"#1A1A14",marginBottom:4}}>🏦 Share my KYC credentials</div>
            <div style={{fontSize:12,color:"#6A6A5A",marginBottom:16}}>Select the bank you want to share your verified identity with. Admin will approve or reject this request.</div>

            <div style={{background:"#F0FAF4",border:"1px solid #C6E8D4",borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:12}}>
              <div style={{color:"#9A9A8A",marginBottom:2}}>Credential to share</div>
              <div style={{fontFamily:"monospace",fontWeight:700,color:"#024731"}}>{kycRecord.credentialId}</div>
            </div>

            <div style={{fontSize:12,fontWeight:700,color:"#4A4A40",marginBottom:8}}>Select bank</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:260,overflowY:"auto",marginBottom:16}}>
              {BANKS.map(b => (
                <button key={b} onClick={()=>setSelected(b)}
                  style={{padding:"10px 12px",borderRadius:9,border:`2px solid ${selected===b?"#024731":"#E2E0D2"}`,background:selected===b?"#E2EEE7":"#FAFAF7",cursor:"pointer",textAlign:"left",fontSize:12,fontWeight:selected===b?700:400,color:selected===b?"#024731":"#1A1A14",fontFamily:"inherit",transition:"all 0.15s"}}>
                  {b}
                </button>
              ))}
            </div>

            <button onClick={handleShare} disabled={!selected||submitting}
              style={{width:"100%",padding:"12px",borderRadius:10,background:selected?"#024731":"#C8C6B8",color:"#fff",border:"none",fontWeight:700,fontSize:14,cursor:selected?"pointer":"not-allowed",fontFamily:"inherit"}}>
              {submitting?"⏳ Sending request...":"Send share request →"}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function CustomerDashboard({ onNavigate, notifications=[] }) {
  const { currentUser } = useStore();
  const [kycRecord,     setKycRecord]     = useState(null);
  const [applications,  setApplications]  = useState([]);
  const [kycRequests,   setKycRequests]   = useState([]);
  const [shareRequests, setShareRequests] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [shareOpen,     setShareOpen]     = useState(false);
  const [shareDeciding, setShareDeciding] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kycData, loanData, kycReqData, allKycReqData, shareReqData] = await Promise.all([
        getKycRegistry(),
        getLoanApplications(currentUser?.email, currentUser?.name, currentUser?.phone),
        currentUser?.email ? getKycRequestsByEmail(currentUser.email) : Promise.resolve([]),
        getKycRequests().catch(() => []),   // fetch all, filter client-side as fallback
        currentUser?.email ? getShareRequestsByEmail(currentUser.email) : Promise.resolve([]),
      ]);

      const kycList = Array.isArray(kycData) ? kycData : [];
      const myKyc = kycList.find(r =>
        r.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
        r.customerName?.toLowerCase() === currentUser?.name?.toLowerCase()
      );
      setKycRecord(myKyc || null);

      const loanList = Array.isArray(loanData) ? loanData : (loanData?.applications || []);
      // Backend already filters by email/name/phone — just sort by date
      setApplications(loanList.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0)));

      // Merge email-filtered + all-filtered-by-name/email/phone, deduplicate by id
      const emailReqs = Array.isArray(kycReqData) ? kycReqData : [];
      const allReqs   = Array.isArray(allKycReqData) ? allKycReqData : [];
      const myEmail = currentUser?.email?.toLowerCase().trim();
      const myName  = currentUser?.name?.toLowerCase().trim();
      const nameReqs = allReqs.filter(r =>
        (myEmail && r.email?.toLowerCase().trim() === myEmail) ||
        (myName  && r.customerName?.toLowerCase().trim() === myName)
      );
      const merged = [...emailReqs, ...nameReqs.filter(n => !emailReqs.some(e => e.id === n.id))];
      setKycRequests(merged.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

      const shares = Array.isArray(shareReqData) ? shareReqData : [];
      setShareRequests(shares.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-poll every 15s to catch admin decisions without manual refresh
  useEffect(() => {
    const id = setInterval(() => fetchData(), 15000);
    return () => clearInterval(id);
  }, [fetchData]);

  const kycActive = kycRecord?.status === "Active";
  const pendingApps = applications.filter(a => ["Pending docs","Manual review","Pending"].includes(a.status)).length;
  const approvedApps = applications.filter(a => a.status === "Approved").length;

  // Latest KYC request for onboarding banner
  const latestKycReq = kycRequests[0] || null;
  const hasApprovedKyc = kycActive || latestKycReq?.status === "approved";

  // Admin-initiated share requests — customer must approve/reject
  const adminShareRequests = shareRequests.filter(r => r.requestedBy === 'admin' && r.status === 'pending');

  const handleShareDecide = async (req, decision) => {
    setShareDeciding(d => ({...d, [req.id]: decision}));
    try {
      const remark = decision === 'approved'
        ? 'Customer approved credential share with ' + req.targetBank
        : 'Customer declined credential share with ' + req.targetBank;
      await decideShareRequest(req.id, decision, remark, currentUser?.name || 'Customer');
      await fetchData();
    } catch { /* silent */ }
    setShareDeciding(d => { const n = {...d}; delete n[req.id]; return n; });
  };

  const STATUS_COLOR = {
    "Auto-eligible": {bg:"#E2EEE7",color:"#024731"},
    Approved:        {bg:"#E2EEE7",color:"#024731"},
    approved:        {bg:"#E2EEE7",color:"#024731"},
    "Pending docs":  {bg:"#FFF7E6",color:"#854F0B"},
    "Manual review": {bg:"#FFF7E6",color:"#854F0B"},
    pending:         {bg:"#FFF7E6",color:"#854F0B"},
    Pending:         {bg:"#FFF7E6",color:"#854F0B"},
    Rejected:        {bg:"#FCEBEB",color:"#A32D2D"},
    rejected:        {bg:"#FCEBEB",color:"#A32D2D"},
  };

  return (
    <div className="main">
      <Navbar crumb="My dashboard" onFluid={()=>onNavigate("fluid_overview")} notifications={notifications}/>
      <div className="content" style={{maxWidth:1100}}>

        {/* Welcome hero */}
        <motion.div data-tour="cd-hero" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
          style={{background:"linear-gradient(135deg,#024731 0%,#0B5C3F 100%)",borderRadius:18,padding:"28px 32px",marginBottom:28,color:"#F2F0E6",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
          <div>
            <div style={{fontSize:11,color:"#8FCBAE",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6,fontWeight:700}}>Welcome back</div>
            <div style={{fontSize:26,fontWeight:800,marginBottom:8}}>{currentUser?.name||"Customer"}</div>
            <div style={{fontSize:13,color:"#BFD8CC",maxWidth:480}}>Your personal lending &amp; identity dashboard. Check your KYC status, track applications, and apply for new products.</div>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
            <button className="btn-primary" style={{background:"#F2F0E6",color:"#024731",fontSize:13}} onClick={()=>onNavigate("customer_application")}>+ Apply for product</button>
            <button onClick={fetchData} style={{padding:"10px 18px",borderRadius:10,background:"rgba(255,255,255,0.12)",color:"#F2F0E6",border:"1px solid rgba(255,255,255,0.25)",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
              {loading ? "⏳" : "↻ Refresh"}
            </button>
            {!hasApprovedKyc && (
              <button style={{padding:"10px 18px",borderRadius:10,background:"#F0C040",color:"#1A1A14",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}
                onClick={()=>onNavigate("new_customer_upload")}>
                📋 Submit KYC documents
              </button>
            )}
          </div>
        </motion.div>

        {/* ── KYC STATUS BANNERS ── */}
        <AnimatePresence>
          {kycRequests.map(req => {
            if (req.status==="pending") return (
              <motion.div key={req.id} initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                style={{background:"linear-gradient(135deg,#FFF8E6 0%,#FFFBF0 100%)",border:"2px solid #F0D060",borderRadius:16,padding:"20px 24px",marginBottom:16,display:"flex",gap:16,alignItems:"flex-start",boxShadow:"0 4px 20px rgba(240,208,96,0.2)"}}>
                <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#F0C040,#E8A020)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>⏳</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,color:"#7A5A00",marginBottom:4,fontSize:15}}>KYC Verification In Progress</div>
                  <div style={{fontSize:13,color:"#4A4A40",marginBottom:8,lineHeight:1.5}}>
                    Your documents were submitted on <b>{new Date(req.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</b> and are currently under admin review.
                    <br/>You'll be notified here and can hit Refresh to check for updates.
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:11,background:"#FFF0C0",border:"1px solid #F0D060",padding:"3px 10px",borderRadius:20,fontWeight:700,color:"#7A5A00"}}>⏳ Pending review</span>
                    <span style={{fontSize:11,color:"#9A9A8A"}}>ID: #{req.id}</span>
                  </div>
                </div>
              </motion.div>
            );
            if (req.status==="approved") return (
              <motion.div key={req.id} initial={{opacity:0,y:-10,scale:0.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0}}
                style={{background:"linear-gradient(135deg,#E8F7EF 0%,#F0FAF5 100%)",border:"2px solid #4CAF50",borderRadius:16,padding:"20px 24px",marginBottom:16,boxShadow:"0 4px 24px rgba(76,175,80,0.15)"}}>
                <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
                  <motion.div animate={{rotate:[0,8,-8,0]}} transition={{delay:0.3,duration:0.6}}
                    style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#024731,#0B5C3F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:"0 4px 16px rgba(2,71,49,0.3)"}}>
                    🔐
                  </motion.div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,color:"#024731",marginBottom:4,fontSize:15}}>✅ KYC Credential Issued!</div>
                    <div style={{fontSize:13,color:"#4A4A40",marginBottom:12,lineHeight:1.5}}>
                      Your identity has been verified. A reusable KYC credential has been issued to your account.
                      Approved by <b>{req.decidedBy||"Lloyds Admin"}</b> on <b>{req.decidedAt?new Date(req.decidedAt).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):"—"}</b>.
                    </div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      <div style={{background:"#024731",borderRadius:10,padding:"10px 16px",fontSize:12,color:"#fff",display:"flex",alignItems:"center",gap:8}}>
                        <span style={{opacity:0.7,fontSize:10}}>CREDENTIAL ID</span>
                        <b style={{fontFamily:"monospace",fontSize:13,letterSpacing:"0.05em"}}>{req.credentialId}</b>
                      </div>
                      {req.txHash && (
                        <div style={{background:"#F0FAF4",border:"1px solid #C6E8D4",borderRadius:10,padding:"10px 16px",fontSize:11,color:"#024731"}}>
                          <span style={{opacity:0.7}}>Tx: </span>
                          <span style={{fontFamily:"monospace"}}>{req.txHash.slice(0,20)}…</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
            if (req.status==="rejected") return (
              <motion.div key={req.id} initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                style={{background:"linear-gradient(135deg,#FEF0F0 0%,#FFF5F5 100%)",border:"2px solid #F0A0A0",borderRadius:16,padding:"20px 24px",marginBottom:16,display:"flex",gap:16,alignItems:"flex-start"}}>
                <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#A32D2D,#C44444)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>❌</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,color:"#A32D2D",marginBottom:4,fontSize:15}}>KYC Request Rejected</div>
                  <div style={{fontSize:13,color:"#4A4A40",marginBottom:10,lineHeight:1.5}}>
                    Submitted {new Date(req.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'long'})}.
                    {req.adminRemark&&<span> Reason: <b>{req.adminRemark}</b></span>}
                  </div>
                  <button className="btn-ghost" style={{fontSize:12}} onClick={()=>onNavigate("new_customer_upload")}>📋 Resubmit documents →</button>
                </div>
              </motion.div>
            );
            return null;
          })}
        </AnimatePresence>

        {/* ── ADMIN-INITIATED SHARE REQUESTS — customer must approve/reject ── */}
        <AnimatePresence>
          {adminShareRequests.map(req => (
            <motion.div key={req.id} initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{background:"#EBF0FF",border:"1px solid #B3C6FF",borderRadius:12,padding:"14px 18px",marginBottom:12,display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:22,flexShrink:0}}>🏦</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:"#2B3A8A",marginBottom:3}}>Credential share request from Lloyds Admin</div>
                <div style={{fontSize:12,color:"#4A4A40",marginBottom:10}}>
                  Lloyds admin is requesting to share your KYC credential (<b style={{fontFamily:'monospace',fontSize:11}}>{req.credentialId}</b>) with <b>{req.targetBank}</b>.<br/>
                  Please approve or decline this request.
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button disabled={!!shareDeciding[req.id]}
                    onClick={() => handleShareDecide(req,'approved')}
                    style={{padding:'7px 16px',borderRadius:8,background:'#024731',color:'#fff',border:'none',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                    {shareDeciding[req.id]==='approved'?'⏳':'✔ Approve'}
                  </button>
                  <button disabled={!!shareDeciding[req.id]}
                    onClick={() => handleShareDecide(req,'rejected')}
                    style={{padding:'7px 16px',borderRadius:8,background:'#FCEBEB',color:'#A32D2D',border:'1px solid #F0C0C0',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                    {shareDeciding[req.id]==='rejected'?'⏳':'✘ Decline'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── CREDENTIAL SHARE STATUS NOTIFICATIONS ── */}
        <AnimatePresence>
          {shareRequests.filter(r => r.requestedBy !== 'admin' || r.status !== 'pending').map(req => {
            const color = req.status==="approved"?"#024731":req.status==="rejected"?"#A32D2D":"#7A5A00";
            const bg    = req.status==="approved"?"#F0FAF4":req.status==="rejected"?"#FCEBEB":"#FFF7E6";
            const icon  = req.status==="approved"?"✅":req.status==="rejected"?"❌":"⏳";
            return (
              <motion.div key={req.id} initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                style={{background:bg,border:`1px solid ${color}44`,borderRadius:12,padding:"12px 16px",marginBottom:10,display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:18,flexShrink:0}}>{icon}</span>
                <div style={{flex:1,fontSize:12}}>
                  <b>Credential share with {req.targetBank}</b> — <span style={{color}}>{req.status}</span>
                  {req.status==="pending"&&<span style={{color:"#9A9A8A"}}> · awaiting admin approval</span>}
                  {req.adminRemark&&<span style={{color:"#6A6A5A"}}> · {req.adminRemark}</span>}
                  <span style={{color:"#9A9A8A",marginLeft:8,fontSize:11}}>{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Stat cards */}
        <motion.div data-tour="cd-stats" initial="hidden" animate="show" variants={container}
          style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28}}>
          {[
            { label:"KYC status", value:loading?"…":kycRecord?kycRecord.status:(latestKycReq?"Request "+latestKycReq.status:"Not issued"),
              sub:kycRecord?`ID: ${kycRecord.credentialId}`:latestKycReq?`Submitted ${new Date(latestKycReq.createdAt).toLocaleDateString()}`:"Upload documents to get verified",
              accent:kycActive?"#024731":"#854F0B", bg:kycActive?"#E2EEE7":"#FFF7E6", icon:kycActive?"✅":"📋" },
            { label:"Applications", value:loading?"…":String(applications.length), sub:`${approvedApps} approved · ${pendingApps} pending`,
              accent:"#024731", bg:"#F0FAF4", icon:"📄" },
            { label:"Credential shares", value:loading?"…":String(shareRequests.length),
              sub:shareRequests.filter(r=>r.status==="approved").length+" approved · "+shareRequests.filter(r=>r.status==="pending").length+" pending",
              accent:"#2B5EA7", bg:"#EBF0FF", icon:"🏦" },
          ].map((s,i) => (
            <motion.div key={i} variants={fadeUp}
              style={{background:s.bg,border:`1px solid ${s.accent}22`,borderRadius:14,padding:"18px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{fontSize:11.5,fontWeight:700,color:"#4A4A40"}}>{s.label}</div>
                <span style={{fontSize:20}}>{s.icon}</span>
              </div>
              <div style={{fontSize:22,fontWeight:800,color:s.accent,marginBottom:4}}>{s.value}</div>
              <div style={{fontSize:11,color:"#6A6A5A"}}>{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:20}}>

          <section data-tour="cd-activity" className="block" style={{marginBottom:0}}>
            <div className="block-head">
              <div className="block-title"><span className="block-num">01</span>My activity</div>
              <button className="btn-ghost" style={{fontSize:11,padding:"5px 12px"}} onClick={()=>onNavigate("customer_application")}>+ New</button>
            </div>
            <div className="card">
              {loading ? (
                <div style={{padding:"24px",textAlign:"center",opacity:0.4,fontSize:13}}>Loading…</div>
              ) : (() => {
                // Combine all activity types into one list
                const rows = [
                  ...applications.map(a => ({
                    type: 'loan',
                    icon: a.product?.toLowerCase().includes('credit') ? '💰' : a.product?.toLowerCase().includes('home') ? '🏠' : a.product?.toLowerCase().includes('vehicle') ? '🚗' : '💳',
                    title: a.product || a.productType || a.loanType || 'Loan application',
                    sub: a.targetBank || '—',
                    status: a.status || a.applicationStatus || 'Pending',
                    date: a.createdAt,
                    amount: a.amount ? '£' + Number(String(a.amount).replace(/[^0-9]/g,'')).toLocaleString() : '—',
                  })),
                  ...kycRequests.map(r => ({
                    type: 'kyc',
                    icon: '🔐',
                    title: 'KYC verification request',
                    sub: r.credentialId || (r.status === 'approved' ? 'Approved' : 'Pending admin review'),
                    status: r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Pending',
                    date: r.createdAt,
                    amount: '—',
                  })),
                  ...shareRequests.map(r => ({
                    type: 'share',
                    icon: '🏦',
                    title: 'Credential share — ' + r.targetBank,
                    sub: r.credentialId || '—',
                    status: r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Pending',
                    date: r.createdAt,
                    amount: '—',
                  })),
                ].sort((a,b) => new Date(b.date||0) - new Date(a.date||0));

                if (rows.length === 0) return (
                  <div style={{padding:"32px 20px",textAlign:"center"}}>
                    <div style={{fontSize:36,marginBottom:12}}>📋</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#1A1A14",marginBottom:6}}>No activity yet</div>
                    <button className="btn-primary" style={{fontSize:12}} onClick={()=>onNavigate("customer_application")}>Apply now →</button>
                  </div>
                );
                return (
                  <table>
                    <thead><tr><th>Type</th><th>Details</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {rows.map((a,i) => {
                        const sc = STATUS_COLOR[a.status]||{bg:"#F0EFE6",color:"#4A4A40"};
                        return (
                          <tr key={i}>
                            <td><span style={{fontSize:18}}>{a.icon}</span></td>
                            <td><div style={{fontWeight:600,fontSize:13}}>{a.title}</div><div style={{fontSize:11,color:"#9A9A8A"}}>{a.sub}</div></td>
                            <td style={{fontWeight:600}}>{a.amount}</td>
                            <td><span style={{...sc,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{a.status}</span></td>
                            <td style={{fontSize:11,color:"#9A9A8A"}}>{a.date?new Date(a.date).toLocaleDateString():"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </section>

          {/* KYC credential + share + quick actions */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* KYC card */}
            <section data-tour="cd-kyc" className="block" style={{marginBottom:0}}>
              <div className="block-head">
                <div className="block-title"><span className="block-num">02</span>My KYC credential</div>
              </div>
              <AnimatePresence mode="wait">
                {loading ? (
                  <div className="card card-pad" style={{opacity:0.4,fontSize:13}}>Loading…</div>
                ) : kycRecord ? (
                  <motion.div key="found" initial={{opacity:0}} animate={{opacity:1}}
                    style={{background:"linear-gradient(135deg,#024731,#0B5C3F)",borderRadius:14,padding:"20px 22px",color:"#fff"}}>
                    <div style={{fontSize:11,opacity:0.7,marginBottom:4}}>Credential ID</div>
                    <div style={{fontSize:16,fontWeight:800,fontFamily:"monospace",marginBottom:16}}>{kycRecord.credentialId}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                      {[["Status",kycRecord.status],["Issuer",kycRecord.issuer||"Lloyds"],["Expires",kycRecord.expiresOn?new Date(kycRecord.expiresOn).toLocaleDateString("en-GB"):"—"],["Shared with",(kycRecord.sharedWith||[]).join(", ")||"Lloyds only"]].map(([l,v])=>(
                        <div key={l} style={{background:"rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 10px"}}>
                          <div style={{fontSize:9,opacity:0.65,marginBottom:2}}>{l}</div>
                          <div style={{fontSize:12,fontWeight:700}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:8,flexDirection:"column"}}>
                      <button style={{width:"100%",padding:"8px",borderRadius:9,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}
                        onClick={()=>onNavigate("ledger_explorer",{credentialId:kycRecord.credentialId,customerName:kycRecord.customerName})}>
                        View audit trail on ledger →
                      </button>
                      <button style={{width:"100%",padding:"8px",borderRadius:9,background:"#F0C040",border:"none",color:"#1A1A14",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}
                        onClick={()=>setShareOpen(true)}>
                        🏦 Share my credentials
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="none" initial={{opacity:0}} animate={{opacity:1}} className="card card-pad" style={{textAlign:"center"}}>
                    <div style={{fontSize:28,marginBottom:8}}>🔐</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#1A1A14",marginBottom:4}}>
                      {latestKycReq?.status==="pending"?"Verification in progress…":"No KYC credential yet"}
                    </div>
                    <div style={{fontSize:11,color:"#6A6A5A",marginBottom:12}}>
                      {latestKycReq?.status==="pending"
                        ? "Your documents are under admin review. You'll be notified when approved."
                        : "Upload your documents to get your identity verified once — reused across all Lloyds products."}
                    </div>
                    {!latestKycReq&&(
                      <button className="btn-primary" style={{fontSize:12}} onClick={()=>onNavigate("new_customer_upload")}>
                        Upload documents →
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Credential share requests status */}
            {shareRequests.length>0 && (
              <section data-tour="cd-shares" className="block" style={{marginBottom:0}}>
                <div className="block-head"><div className="block-title"><span className="block-num">03</span>Credential share requests</div></div>
                <div className="card">
                  <table>
                    <thead><tr><th>Bank</th><th>Source</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {shareRequests.map((r,i)=>{
                        const sc=r.status==="approved"?{bg:"#E2EEE7",color:"#024731"}:r.status==="rejected"?{bg:"#FCEBEB",color:"#A32D2D"}:{bg:"#FFF7E6",color:"#854F0B"};
                        return(
                          <tr key={i}>
                            <td style={{fontWeight:600}}>{r.targetBank}</td>
                            <td style={{fontSize:11,color:"#6A6A5A"}}>{r.source==="product_application"?"Product app":"Manual"}</td>
                            <td><span style={{...sc,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{r.status}</span></td>
                            <td style={{fontSize:11,color:"#9A9A8A"}}>{new Date(r.createdAt).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Quick actions */}
            <section data-tour="cd-quickactions" className="block" style={{marginBottom:0}}>
              <div className="block-head"><div className="block-title"><span className="block-num">04</span>Quick actions</div></div>
              <div className="card card-pad" style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {icon:"💳",label:"Apply for Personal Loan",sub:"Up to £250,000",action:()=>onNavigate("customer_application")},
                  {icon:"🏠",label:"Apply for Home Loan",sub:"Mortgage & remortgage",action:()=>onNavigate("customer_application")},
                  {icon:"💰",label:"Apply for Credit Card",sub:"Rewards & cashback",action:()=>onNavigate("customer_application")},
                  {icon:"🛡️",label:"View my KYC registry entry",sub:"See who has access to your credential",action:()=>onNavigate("kyc_registry")},
                  ...(!hasApprovedKyc?[{icon:"📋",label:"Upload KYC documents",sub:"Get verified to unlock all products",action:()=>onNavigate("new_customer_upload")}]:[]),
                ].map((item,i)=>(
                  <button key={i} onClick={item.action}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:10,border:"1px solid #E2E0D2",background:"#FAFAF7",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="#F0FAF4";e.currentTarget.style.borderColor="#C6E8D4";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="#FAFAF7";e.currentTarget.style.borderColor="#E2E0D2";}}>
                    <span style={{fontSize:20,flexShrink:0}}>{item.icon}</span>
                    <div>
                      <div style={{fontSize:12.5,fontWeight:700,color:"#1A1A14"}}>{item.label}</div>
                      <div style={{fontSize:11,color:"#6A6A5A"}}>{item.sub}</div>
                    </div>
                    <svg style={{marginLeft:"auto",color:"#9A9A8A"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Share Modal */}
        <AnimatePresence>
          {shareOpen && kycRecord && (
            <ShareModal kycRecord={kycRecord} customerUser={currentUser} onClose={()=>setShareOpen(false)} onSubmitted={fetchData}/>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}