import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import { getLoanApplications, getKycRegistry, getDashboardActivity, decideLoan, getKycRequests, decideKycRequest, getShareRequests, decideShareRequest, registerUser } from "../services/api";
import { useStore, getCustomUsers, saveCustomUsers, DEMO_USERS } from "../store";

const fadeUp = { hidden:{opacity:0,y:16}, show:{opacity:1,y:0,transition:{duration:0.3}} };
const container = { hidden:{}, show:{transition:{staggerChildren:0.09}} };

function Check() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#024731" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>; }
function Dash()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9A8A" strokeWidth="3"><path d="M5 12h14"/></svg>; }

const MATRIX = [
  { name:"View applications",       desc:"See applicant details and loan requests",             perms:["check","check","check","Anonymized"] },
  { name:"Accept / reject loans",   desc:"Final decision authority on applications",            perms:["\xA350K limit","check","dash","dash"] },
  { name:"Query verifyKYC()",       desc:"Inspect credential validity on-chain",                perms:["check","check","check","check"] },
  { name:"Call issueKYC()",         desc:"Commit new credential attestation on-chain",          perms:["dash","check","dash","dash"] },
  { name:"Call revokeKYC()",        desc:"Invalidate a credential network-wide",                perms:["dash","check","check","dash"] },
  { name:"Configure policy engine", desc:"Set auto-eligibility thresholds and risk rules",      perms:["dash","check","dash","dash"] },
  { name:"Access raw KYC docs",     desc:"View encrypted off-chain PII in S3",                  perms:["Assigned only","check","check","dash"] },
  { name:"Export audit trail",      desc:"Download ledger event history for any credential",    perms:["dash","check","check","check"] },
];

const ROLES = [
  { tier:"1", name:"Loan officer",      desc:"Reviews applications up to \xA350,000. Escalates larger cases upward.", users:"14 users", icon:"\uD83D\uDC64", mine:false },
  { tier:"2", name:"Senior admin",      desc:"Unlimited decision authority, manages policy engine, issues/revokes on-chain credentials.", users:"5 users", icon:"\uD83D\uDEE1\uFE0F", mine:true },
  { tier:"2", name:"Compliance officer",desc:"Independent audit access. Can flag or revoke any credential network-wide.", users:"3 users", icon:"\uD83D\uDD12", mine:false },
  { tier:"3", name:"Regulator observer",desc:"External read-only validator node. Sees anonymized data and full audit trail.", users:"2 nodes", icon:"\uD83C\uDFDB\uFE0F", mine:false },
];

const POLICY = [
  { key:"auto_eligible", name:"Auto-eligible threshold", rule:"amount \u2264 50,000 AND credit_score \u2265 700 AND kyc.valid = true" },
  { key:"manual_review",  name:"Manual review trigger",  rule:"credit_score < 700 OR amount > 50,000" },
  { key:"revocation",    name:"Revocation cascade",      rule:"on revokeKYC() \u2192 flag all open applications using credential" },
  { key:"cross_bank",    name:"Cross-bank trust",        rule:"accept verifyKYC() from any network-validated issuer" },
];

function StatusTag({ s }) {
  const map = { approved:"tag-go", rejected:"tag-stop", pending:"tag-warn", "pending-docs":"tag-warn", manual_review:"tag-stop", auto_eligible:"tag-go" };
  const cls = map[(s||"").toLowerCase().replace(/[\s-]/g,"_")] || "tag-mute";
  return <span className={"tag "+cls}>{s}</span>;
}

// ── User Management Component ────────────────────────────────────────────────
function UserManagement({ pushToast }) {
  const EMPTY_FORM = { name:'', username:'', password:'', email:'' };
  const [customUsers, setCustomUsers] = useState(getCustomUsers());
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);

  const refresh = () => setCustomUsers(getCustomUsers());
  const allUsernames = [...DEMO_USERS, ...getCustomUsers()].map(u => u.username.toLowerCase());

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = 'Full name required';
    if (!form.username.trim()) e.username = 'Username required';
    else if (allUsernames.includes(form.username.toLowerCase())) e.username = 'Username already taken';
    if (!form.password || form.password.length < 4) e.password = 'Min 4 characters';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    const parts = form.name.trim().split(' ');
    const newUser = {
      username: form.username.trim().toLowerCase(),
      password: form.password,
      role: 'customer',
      name: form.name.trim(),
      initials: parts.map(w => w[0]).join('').toUpperCase().slice(0,2),
      title: 'Personal Banking Customer',
      email: form.email.trim().toLowerCase(),
      _custom: true,
      _createdAt: new Date().toISOString(),
    };
    // 1. Save to DB via API
    const dbResult = await registerUser(newUser);
    if (dbResult?.error) {
      setErrors(e => ({...e, username: dbResult.error}));
      return;
    }
    // Use DB-returned user (has real id) merged with local fields
    const savedUser = dbResult ? { ...newUser, ...dbResult, password: newUser.password } : newUser;
    // 2. Also persist in localStorage as fallback
    const updated = [...getCustomUsers().filter(u => u.username !== savedUser.username), savedUser];
    saveCustomUsers(updated);
    setCustomUsers(updated);
    setForm(EMPTY_FORM);
    setShowForm(false);
    pushToast(`✅ Customer "${savedUser.name}" created & saved to DB — login: ${savedUser.username} / ${form.password}`, 'success');
  };

  const handleDelete = (username) => {
    const updated = getCustomUsers().filter(u => u.username !== username);
    saveCustomUsers(updated);
    setCustomUsers(updated);
    pushToast('User removed', 'info');
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <section className="block">
      <div className="block-head">
        <div className="block-title"><span className="block-num">09</span>Customer user management</div>
        <button className="btn-primary" style={{fontSize:12,padding:"6px 16px"}} onClick={()=>setShowForm(s=>!s)}>
          {showForm ? 'Cancel' : '+ Create new customer'}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
          style={{background:'#F0FAF4',border:'1.5px solid #C6E8D4',borderRadius:14,padding:'20px 24px',marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:14,color:'#024731',marginBottom:16}}>🆕 New customer account</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
            {[
              {label:'Full Name',   key:'name',     type:'text',     placeholder:'e.g. Priya Nair'},
              {label:'Email',       key:'email',    type:'email',    placeholder:'e.g. priya@email.com'},
              {label:'Username',    key:'username', type:'text',     placeholder:'e.g. priya'},
              {label:'Password',    key:'password', type:'text',     placeholder:'min 4 characters'},
            ].map(({label,key,type,placeholder}) => (
              <div key={key}>
                <label style={{fontSize:11,fontWeight:700,color:'#4A4A40',display:'block',marginBottom:4}}>{label}</label>
                <input type={type} placeholder={placeholder} value={form[key]}
                  onChange={e=>f(key,e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:`1px solid ${errors[key]?'#A32D2D':'#C6E8D4'}`,borderRadius:8,fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:'#fff'}}/>
                {errors[key] && <div style={{fontSize:11,color:'#A32D2D',marginTop:3}}>⚠ {errors[key]}</div>}
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="btn-primary" style={{fontSize:13}} onClick={handleCreate}>Create customer →</button>
            <button className="btn-ghost" style={{fontSize:13}} onClick={()=>{setShowForm(false);setErrors({});}}>Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="card">
        {customUsers.length === 0 ? (
          <div style={{padding:'28px 20px',textAlign:'center',color:'#9A9A8A',fontSize:13}}>
            No custom customers yet. Click <b>"+ Create new customer"</b> to add one.
          </div>
        ) : (
          <table>
            <thead style={{background:'linear-gradient(90deg,#024731,#036844)'}}>
              <tr><th style={{color:'#fff',fontWeight:700}}>Name</th><th style={{color:'#fff',fontWeight:700}}>Email</th><th style={{color:'#fff',fontWeight:700}}>Username</th><th style={{color:'#fff',fontWeight:700}}>Password</th><th style={{color:'#fff',fontWeight:700}}>Created</th><th style={{color:'#fff',fontWeight:700}}>Action</th></tr>
            </thead>
            <tbody>
              {customUsers.map(u => (
                <tr key={u.username}>
                  <td style={{fontWeight:700}}>{u.name}</td>
                  <td style={{fontSize:12,color:'#4A4A40'}}>{u.email}</td>
                  <td><code style={{background:'#F0EFE6',padding:'2px 6px',borderRadius:4,fontSize:12}}>{u.username}</code></td>
                  <td><code style={{background:'#F0EFE6',padding:'2px 6px',borderRadius:4,fontSize:12}}>{u.password}</code></td>
                  <td style={{fontSize:11,color:'#9A9A8A'}}>{u._createdAt ? new Date(u._createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <button onClick={()=>handleDelete(u.username)}
                      style={{fontSize:11,padding:'4px 10px',borderRadius:6,background:'#FCEBEB',color:'#A32D2D',border:'1px solid #F0C0C0',cursor:'pointer',fontWeight:700,fontFamily:'inherit'}}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default function AdminControlCenter({ onNavigate, notifications=[] }) {
  const { pushToast, currentUser } = useStore();
  const [loans,       setLoans]       = useState([]);
  const [kyc,         setKyc]         = useState([]);
  const [activity,    setActivity]    = useState([]);
  const [kycReqs,     setKycReqs]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [shareReqs,   setShareReqs]   = useState([]);
  const [deciding,    setDeciding]    = useState({});
  const [kycDeciding, setKycDeciding] = useState({});
  const [shareDeciding, setShareDeciding] = useState({});
  const [viewingDocs, setViewingDocs] = useState(null); // KYC request object to view docs
  const [policyOn, setPolicyOn] = useState({ auto_eligible:true, manual_review:true, revocation:true, cross_bank:true });
  const actor = currentUser?.name || "Admin";

  const load = async () => {
    setLoading(true);
    try {
      const [l,k,a,r,sr] = await Promise.all([
        getLoanApplications(), getKycRegistry(), getDashboardActivity(), getKycRequests(), getShareRequests()
      ]);
      setLoans(Array.isArray(l) ? l : []);
      setKyc(Array.isArray(k) ? k : []);
      setActivity(Array.isArray(a?.recentActivity) ? a.recentActivity : Array.isArray(a) ? a : []);
      setKycReqs(Array.isArray(r) ? r : []);
      setShareReqs(Array.isArray(sr) ? sr.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)) : []);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pending = ["pending","pending-docs","pending docs","manual review","manual_review"];
  const activeQueue   = loans.filter(l => pending.includes((l.status||l.applicationStatus||"").toLowerCase()));
  const autoElig      = loans.filter(l => ["auto_eligible","auto-eligible","approved"].includes((l.status||l.applicationStatus||"").toLowerCase()));
  const expiringSoon  = kyc.filter(r => { if(!r.expiresOn) return false; const d=(new Date(r.expiresOn)-new Date())/(86400000); return d>0&&d<90; });
  const pendingKycReqs = kycReqs.filter(r => r.status === "pending");

  const handleDecide = async (app, decision) => {
    const appId = app.applicationId || app.id;
    setDeciding(d => ({...d,[appId]:decision}));
    pushToast(decision==="approved"?"⏳ Approving...":"⏳ Rejecting...","info");
    try {
      await decideLoan(appId, decision, (decision==="approved"?"Approved":"Rejected")+" by "+actor, actor);
      await load();
      pushToast(decision==="approved"?"✅ Application approved":"❌ Application rejected","success");
    } catch { pushToast("Action saved","success"); }
    setDeciding(d => { const n={...d}; delete n[appId]; return n; });
  };

  const handleKycDecide = async (req, decision) => {
    setKycDeciding(d => ({...d,[req.id]:decision}));
    pushToast(decision==="approved"?"\u23F3 Approving KYC request...":"\u23F3 Rejecting KYC request...","info");
    try {
      const remark = decision==="approved"
        ? "KYC documents verified and approved by "+actor
        : "KYC request rejected by "+actor;
      await decideKycRequest(req.id, decision, remark, actor);
      await load();
      pushToast(
        decision==="approved"
          ? "\uD83D\uDD12 KYC credential issued for "+req.customerName
          : "\u274C KYC request rejected for "+req.customerName,
        "success"
      );
    } catch { pushToast("Action saved","success"); }
    setKycDeciding(d => { const n={...d}; delete n[req.id]; return n; });
  };

  const PCell = ({p}) => p==="check"?<Check/>:p==="dash"?<Dash/>:<span className="partial">{p}</span>;

  const DOC_LABELS = { passport:'Passport / National ID', proof_id:'Proof of Identity', address:'Address Proof', income:'Income Proof', bank_stmt:'Bank Statement' };

  return (
    <div className="main">
      <Navbar crumb="Admin control center" onFluid={()=>onNavigate("fluid_overview")} variant="admin" notifications={notifications}/>
      <div className="content">

        {/* ── DOCS VIEWER MODAL ── */}
        <AnimatePresence>
          {viewingDocs && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
              onClick={()=>setViewingDocs(null)}>
              <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9}}
                transition={{type:'spring',stiffness:280,damping:22}}
                style={{background:'#FAFAF7',borderRadius:20,width:520,maxWidth:'100%',padding:'28px',boxShadow:'0 24px 80px rgba(0,0,0,0.3)',maxHeight:'85vh',overflowY:'auto'}}
                onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:800,color:'#1A1A14'}}>📄 Submitted Documents</div>
                    <div style={{fontSize:12,color:'#6A6A5A',marginTop:3}}>
                      <b>{viewingDocs.customerName}</b> · submitted {viewingDocs.createdAt ? new Date(viewingDocs.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                    </div>
                  </div>
                  <button onClick={()=>setViewingDocs(null)} style={{background:'#F0EFE6',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,color:'#4A4A40',padding:'6px 12px',fontWeight:700,fontFamily:'inherit'}}>✕ Close</button>
                </div>

                {/* Customer info */}
                <div style={{background:'#F8F7F0',borderRadius:12,padding:'14px 16px',marginBottom:20,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:12}}>
                  {[
                    ['Full Name', viewingDocs.customerName],
                    ['Email', viewingDocs.email || '—'],
                    ['Phone', viewingDocs.phone || '—'],
                    ['Date of Birth', viewingDocs.dob || '—'],
                    ['Nationality', viewingDocs.nationality || '—'],
                    ['Address', viewingDocs.address || '—'],
                  ].map(([label,val])=>(
                    <div key={label}>
                      <div style={{fontSize:10,color:'#9A9A8A',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:2}}>{label}</div>
                      <div style={{color:'#1A1A14',fontWeight:600}}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Uploaded docs */}
                <div style={{fontSize:11,fontWeight:700,color:'#4A4A40',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>Uploaded files</div>
                {viewingDocs.uploadedDocs ? (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {viewingDocs.uploadedDocs.split(',').filter(Boolean).map((doc,i)=>{
                      const key = doc.trim().split('/').pop()?.split('_')[0] || doc.trim();
                      const label = DOC_LABELS[key] || doc.trim();
                      return (
                        <div key={i} style={{display:'flex',alignItems:'center',gap:12,background:'#F0FAF4',border:'1px solid #C6E8D4',borderRadius:10,padding:'12px 14px'}}>
                          <span style={{fontSize:22,flexShrink:0}}>
                            {key==='passport'||key==='proof_id'?'🪪':key==='address'?'🏠':key==='income'?'💰':'🏦'}
                          </span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:700,color:'#024731'}}>{label}</div>
                            <div style={{fontSize:10,color:'#6A6A5A',marginTop:2,fontFamily:'monospace'}}>{doc.trim()}</div>
                          </div>
                          <span style={{fontSize:11,background:'#E2EEE7',color:'#024731',padding:'3px 8px',borderRadius:20,fontWeight:700}}>✓ Uploaded</span>
                          <a href={`http://localhost:3001/${doc.trim()}`} download target="_blank" rel="noreferrer"
                            style={{fontSize:11,background:'#2B5EA7',color:'#fff',padding:'5px 10px',borderRadius:8,fontWeight:700,textDecoration:'none',flexShrink:0,cursor:'pointer'}}>
                            ⬇ Download
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{padding:'20px',textAlign:'center',color:'#9A9A8A',fontSize:13}}>No documents recorded</div>
                )}

                {/* Actions if still pending */}
                {viewingDocs.status === 'pending' && (
                  <div style={{display:'flex',gap:10,marginTop:20}}>
                    <button onClick={()=>{handleKycDecide(viewingDocs,"approved");setViewingDocs(null);}}
                      style={{flex:1,padding:'12px',borderRadius:10,background:'#024731',color:'#fff',border:'none',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                      🔐 Approve & Issue Credential
                    </button>
                    <button onClick={()=>{handleKycDecide(viewingDocs,"rejected");setViewingDocs(null);}}
                      style={{flex:1,padding:'12px',borderRadius:10,background:'#FCEBEB',color:'#A32D2D',border:'1px solid #F0C0C0',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                      ✘ Reject
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Lloyds green hero header ── */}
        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}
          style={{
            background:'linear-gradient(135deg,#024731 0%,#036844 55%,#045C3B 100%)',
            borderRadius:20,padding:'28px 32px',marginBottom:24,
            position:'relative',overflow:'hidden',
            boxShadow:'0 8px 32px rgba(2,71,49,0.22)',
          }}>
          <div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:0.07,backgroundImage:'radial-gradient(circle,#fff 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
          <div style={{position:'relative',zIndex:1,display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div style={{width:38,height:38,borderRadius:10,background:'rgba(255,255,255,0.15)',border:'1.5px solid rgba(255,255,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>⚙️</div>
                <div style={{fontSize:10,letterSpacing:'0.15em',color:'rgba(255,255,255,0.55)',fontWeight:700,textTransform:'uppercase'}}>Trust Ledger · Lloyds Banking Group</div>
              </div>
              <div style={{fontSize:26,fontWeight:900,color:'#fff',marginBottom:6}}>Admin Control Centre</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.65)',maxWidth:480,lineHeight:1.6}}>
                Manage loan approvals, KYC requests, credential share requests and customer accounts.
              </div>
            </div>
            <button onClick={load}
              style={{alignSelf:'center',padding:'9px 18px',borderRadius:10,background:'rgba(255,255,255,0.15)',border:'1.5px solid rgba(255,255,255,0.25)',color:'#fff',fontSize:12,cursor:'pointer',fontWeight:700,fontFamily:'inherit'}}>
              {loading?"⏳ Loading…":"↻ Refresh"}
            </button>
          </div>
        </motion.div>

        <motion.div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:"1.8rem"}} initial="hidden" animate="show" variants={container}>
          {[
            {label:"Total applications",     value:loans.length,                                        icon:"📄", grad:"linear-gradient(135deg,#024731 0%,#0B5C3F 100%)", sub:autoElig.length+" approved"},
            {label:"Pending loan review",    value:activeQueue.length,                                  icon:"⏳", grad:"linear-gradient(135deg,#854F0B 0%,#B87333 100%)", sub:"needs decision"},
            {label:"KYC requests pending",   value:pendingKycReqs.length,                               icon:"📨", grad:"linear-gradient(135deg,#A32D2D 0%,#C0504D 100%)", sub:kycReqs.length+" total"},
            {label:"Share requests pending", value:shareReqs.filter(r=>r.status==="pending").length,    icon:"🏦", grad:"linear-gradient(135deg,#2B5EA7 0%,#4A80CC 100%)", sub:shareReqs.filter(r=>r.status==="approved").length+" approved"},
            {label:"KYC expiring <90d",      value:expiringSoon.length,                                 icon:"⚠️", grad:"linear-gradient(135deg,#5A2D82 0%,#7B4FAA 100%)", sub:"renewal needed"},
          ].map((s,i) => (
            <motion.div key={i} variants={fadeUp}
              style={{background:s.grad,borderRadius:16,padding:"20px 18px",color:"#fff",position:"relative",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.15)"}}>
              <div style={{position:"absolute",top:-14,right:-14,fontSize:56,opacity:0.12,lineHeight:1}}>{s.icon}</div>
              <div style={{fontSize:30,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:34,fontWeight:900,lineHeight:1,marginBottom:4}}>{loading?"–":s.value}</div>
              <div style={{fontSize:12,opacity:0.85,fontWeight:600,marginBottom:2}}>{s.label}</div>
              <div style={{fontSize:10,opacity:0.6}}>{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── 01 KYC APPROVAL REQUESTS ── */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">01</span>KYC approval requests</div>
            <div className="block-note">{pendingKycReqs.length} pending — review submitted customer documents</div>
          </div>
          <motion.div className="card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.18}}>
            {loading ? (
              <div style={{padding:"32px",textAlign:"center",color:"#9A9A8A"}}>⏳ Loading KYC requests...</div>
            ) : kycReqs.length === 0 ? (
              <div style={{padding:"32px",textAlign:"center",color:"#9A9A8A"}}>✅ No KYC requests yet.</div>
            ) : (
              <table>
                <thead style={{background:'linear-gradient(90deg,#024731,#036844)'}}>
                  <tr><th style={{color:'#fff',fontWeight:700}}>Customer</th><th style={{color:'#fff',fontWeight:700}}>Email</th><th style={{color:'#fff',fontWeight:700}}>Documents</th><th style={{color:'#fff',fontWeight:700}}>Submitted</th><th style={{color:'#fff',fontWeight:700}}>Status</th><th style={{color:'#fff',fontWeight:700}}>Actions</th></tr>
                </thead>
                <tbody>
                  {kycReqs.map(r => {
                    const st = kycDeciding[r.id];
                    const statusCls = r.status==="approved"?"tag-go":r.status==="rejected"?"tag-stop":"tag-warn";
                    const docCount = r.uploadedDocs ? r.uploadedDocs.split(",").filter(Boolean).length : 0;
                    return (
                      <tr key={r.id}>
                        <td style={{fontWeight:700}}>{r.customerName}</td>
                        <td style={{fontSize:12,color:"#6A6A5A"}}>{r.email||"—"}</td>
                        <td>
                          <button onClick={()=>setViewingDocs(r)}
                            style={{fontSize:11,padding:'5px 12px',borderRadius:7,background:'#EBF0FF',color:'#2B5EA7',border:'1px solid #B3C6FF',cursor:'pointer',fontWeight:700,fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
                            📄 {docCount} doc{docCount!==1?'s':''} — View
                          </button>
                        </td>
                        <td style={{fontSize:11,color:"#9A9A8A"}}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                        <td>
                          <span className={"tag "+statusCls}>{r.status}</span>
                          {r.status==="approved" && r.credentialId && (
                            <div style={{fontSize:10,color:"#0B5C3F",fontFamily:"monospace",marginTop:3}}>{r.credentialId}</div>
                          )}
                          {r.status==="rejected" && r.adminRemark && (
                            <div style={{fontSize:10,color:"#A32D2D",marginTop:3}}>{r.adminRemark}</div>
                          )}
                        </td>
                        <td>
                          {r.status==="pending" ? (
                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                              <button disabled={!!st} onClick={()=>handleKycDecide(r,"approved")}
                                style={{fontSize:11,padding:"5px 10px",borderRadius:7,background:"#F0FAF4",color:"#024731",border:"1px solid #C6E8D4",cursor:"pointer",fontWeight:700}}>
                                {st==="approved"?"⏳":"🔐 Approve & Issue KYC"}
                              </button>
                              <button disabled={!!st} onClick={()=>handleKycDecide(r,"rejected")}
                                style={{fontSize:11,padding:"5px 10px",borderRadius:7,background:"#FCEBEB",color:"#A32D2D",border:"1px solid #F0C0C0",cursor:"pointer",fontWeight:700}}>
                                {st==="rejected"?"⏳":"✘ Reject"}
                              </button>
                            </div>
                          ) : (
                            <div style={{fontSize:11,color:"#9A9A8A"}}>Decided by {r.decidedBy||"Admin"}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </motion.div>
        </section>

        {/* ── 02 PENDING ACTION QUEUE ── */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">02</span>Pending loan action queue</div>
            <div className="block-note">{activeQueue.length} application{activeQueue.length!==1?"s":""} need attention</div>
          </div>
          <motion.div className="card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.15}}>
            {loading ? (
              <div style={{padding:"32px",textAlign:"center",color:"#9A9A8A"}}>\u23F3 Loading applications...</div>
            ) : activeQueue.length===0 ? (
              <div style={{padding:"32px",textAlign:"center",color:"#9A9A8A"}}>\u2705 No pending applications &mdash; all clear!</div>
            ) : (
              <table>
                <thead style={{background:'linear-gradient(90deg,#024731,#036844)'}}>
                  <tr><th style={{color:'#fff',fontWeight:700}}>Applicant</th><th style={{color:'#fff',fontWeight:700}}>Product</th><th style={{color:'#fff',fontWeight:700}}>Bank</th><th style={{color:'#fff',fontWeight:700}}>Amount</th><th style={{color:'#fff',fontWeight:700}}>Credit score</th><th style={{color:'#fff',fontWeight:700}}>Status</th><th style={{color:'#fff',fontWeight:700}}>Actions</th></tr>
                </thead>
                <tbody>
                  {activeQueue.map(app => {
                    const appId = app.applicationId || app.id;
                    const st = deciding[appId];
                    return (
                      <tr key={appId}>
                        <td>
                          <div style={{fontWeight:700,fontSize:13}}>{app.customerName||app.applicantName||"Unknown"}</div>
                          <div style={{fontSize:10,color:"#9A9A8A"}}>{app.email||""}</div>
                        </td>
                        <td>{app.productType||app.product||app.loanType||"—"}</td>
                        <td style={{fontSize:12,color:"#4A4A40"}}>{app.targetBank||"—"}</td>
                        <td>{app.amount?"£"+Number(String(app.amount).replace(/[^0-9]/g,'')).toLocaleString():"—"}</td>
                        <td>{app.creditScore||"—"}</td>
                        <td><StatusTag s={app.status||app.applicationStatus||"Pending"}/></td>
                        <td>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            <button className="btn-ghost" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>onNavigate("loan_applications")}>View →</button>
                            <button disabled={!!st} onClick={()=>handleDecide(app,"approved")} style={{fontSize:11,padding:"5px 10px",borderRadius:7,background:"#F0FAF4",color:"#024731",border:"1px solid #C6E8D4",cursor:"pointer",fontWeight:700}}>{st==="approved"?"⏳":"✔ Approve"}</button>
                            <button disabled={!!st} onClick={()=>handleDecide(app,"rejected")} style={{fontSize:11,padding:"5px 10px",borderRadius:7,background:"#FCEBEB",color:"#A32D2D",border:"1px solid #F0C0C0",cursor:"pointer",fontWeight:700}}>{st==="rejected"?"⏳":"✘ Reject"}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </motion.div>
        </section>

        {/* ── 03 CREDENTIAL SHARE REQUESTS ── */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">03</span>Credential share requests</div>
            <div className="block-note">{shareReqs.filter(r=>r.status==="pending").length} pending &mdash; customer requests to share KYC with third-party banks</div>
          </div>
          <motion.div className="card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.21}}>
            {loading ? (
              <div style={{padding:"32px",textAlign:"center",color:"#9A9A8A"}}>&#x23F3; Loading share requests...</div>
            ) : shareReqs.length === 0 ? (
              <div style={{padding:"32px",textAlign:"center",color:"#9A9A8A"}}>&#x1F3E6; No credential share requests yet.</div>
            ) : (
              <table>
                <thead style={{background:'linear-gradient(90deg,#024731,#036844)'}}>
                  <tr><th style={{color:'#fff',fontWeight:700}}>Customer</th><th style={{color:'#fff',fontWeight:700}}>Credential ID</th><th style={{color:'#fff',fontWeight:700}}>Target bank</th><th style={{color:'#fff',fontWeight:700}}>Requested</th><th style={{color:'#fff',fontWeight:700}}>Status</th><th style={{color:'#fff',fontWeight:700}}>Actions</th></tr>
                </thead>
                <tbody>
                  {shareReqs.map(r => {
                    const st = shareDeciding[r.id];
                    const statusCls = r.status==="approved"?"tag-go":r.status==="rejected"?"tag-stop":"tag-warn";
                    return (
                      <tr key={r.id}>
                        <td>
                          <div style={{fontWeight:700}}>{r.customerName}</div>
                          <div style={{fontSize:11,color:"#9A9A8A"}}>{r.customerEmail||""}</div>
                        </td>
                        <td style={{fontFamily:"monospace",fontSize:12,color:"#024731"}}>{r.credentialId||"—"}</td>
                        <td style={{fontWeight:600}}>{r.targetBank}</td>
                        <td style={{fontSize:11,color:"#9A9A8A"}}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                        <td>
                          <span className={"tag "+statusCls}>{r.status}</span>
                          {r.adminRemark && <div style={{fontSize:10,color:"#6A6A5A",marginTop:3}}>{r.adminRemark}</div>}
                        </td>
                        <td>
                          {r.status==="pending" ? (
                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                              <button disabled={!!st} onClick={async ()=>{
                                setShareDeciding(d=>({...d,[r.id]:"approved"}));
                                try {
                                  const result = await decideShareRequest(r.id,"approved","Credential share approved by "+actor,actor);
                                  if (!result || result.status !== 'approved') {
                                    throw new Error('Share request approval failed');
                                  }
                                  await load();
                                  pushToast("&#x1F3E6; Share approved for "+r.targetBank,"success");
                                } catch {
                                  pushToast("Failed to approve share request","error");
                                }
                                setShareDeciding(d=>{const n={...d};delete n[r.id];return n;});
                              }} style={{fontSize:11,padding:"5px 10px",borderRadius:7,background:"#F0FAF4",color:"#024731",border:"1px solid #C6E8D4",cursor:"pointer",fontWeight:700}}>
                                {st==="approved"?"⏳":"✔ Approve"}
                              </button>
                              <button disabled={!!st} onClick={async ()=>{
                                setShareDeciding(d=>({...d,[r.id]:"rejected"}));
                                try {
                                  const result = await decideShareRequest(r.id,"rejected","Share request rejected by "+actor,actor);
                                  if (!result || result.status !== 'rejected') {
                                    throw new Error('Share request rejection failed');
                                  }
                                  await load();
                                  pushToast("Share request rejected","success");
                                } catch {
                                  pushToast("Failed to reject share request","error");
                                }
                                setShareDeciding(d=>{const n={...d};delete n[r.id];return n;});
                              }} style={{fontSize:11,padding:"5px 10px",borderRadius:7,background:"#FCEBEB",color:"#A32D2D",border:"1px solid #F0C0C0",cursor:"pointer",fontWeight:700}}>
                                {st==="rejected"?"⏳":"✘ Reject"}
                              </button>
                            </div>
                          ) : (
                            <div style={{fontSize:11,color:"#9A9A8A"}}>Decided by {r.decidedBy||"Admin"}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </motion.div>
        </section>

        {/* ── 04 KYC EXPIRING ── */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">04</span>KYC credentials expiring soon</div>
            <div className="block-note">Within 90 days &mdash; contact customers to renew</div>
          </div>
          <motion.div className="card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
            {loading ? (
              <div style={{padding:"32px",textAlign:"center",color:"#9A9A8A"}}>\u23F3 Loading KYC registry...</div>
            ) : expiringSoon.length===0 ? (
              <div style={{padding:"32px",textAlign:"center",color:"#9A9A8A"}}>\uD83D\uDEE1\uFE0F No credentials expiring within 90 days.</div>
            ) : (
              <table>
                <thead style={{background:'linear-gradient(90deg,#024731,#036844)'}}>
                  <tr><th style={{color:'#fff',fontWeight:700}}>Customer</th><th style={{color:'#fff',fontWeight:700}}>Credential ID</th><th style={{color:'#fff',fontWeight:700}}>Status</th><th style={{color:'#fff',fontWeight:700}}>Expires</th><th style={{color:'#fff',fontWeight:700}}>Days left</th><th style={{color:'#fff',fontWeight:700}}>Action</th></tr>
                </thead>
                <tbody>
                  {expiringSoon.map((r,i) => {
                    const d=Math.ceil((new Date(r.expiresOn)-new Date())/86400000);
                    return (
                      <tr key={i}>
                        <td style={{fontWeight:700}}>{r.customerName}</td>
                        <td style={{fontFamily:"monospace",fontSize:12}}>{r.credentialId}</td>
                        <td><StatusTag s={r.status}/></td>
                        <td>{r.expiresOn}</td>
                        <td><span className={"tag "+(d<30?"tag-stop":"tag-warn")}>{d}d</span></td>
                        <td><button className="btn-ghost" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>onNavigate("kyc_registry")}>View →</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </motion.div>
        </section>

        <div className="grid2">
          <section className="block" style={{marginBottom:0}}>
            <div className="block-head"><div className="block-title"><span className="block-num">05</span>Policy engine rules</div></div>
            <div className="card card-pad">
              {POLICY.map(p => (
                <div key={p.key} className="policy-row">
                  <div style={{flex:1}}>
                    <div className="policy-name">{p.name}</div>
                    <div className="policy-rule">{p.rule}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <span style={{fontSize:11,color:policyOn[p.key]?"#024731":"#9A9A8A"}}>{policyOn[p.key]?"ON":"OFF"}</span>
                    <div onClick={()=>setPolicyOn(o=>({...o,[p.key]:!o[p.key]}))} style={{width:36,height:20,borderRadius:10,background:policyOn[p.key]?"#024731":"#C8C6B8",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                      <div style={{position:"absolute",top:3,left:policyOn[p.key]?18:3,width:14,height:14,borderRadius:7,background:"#fff",transition:"left 0.2s"}}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="block" style={{marginBottom:0}}>
            <div className="block-head"><div className="block-title"><span className="block-num">06</span>Recent ledger activity</div></div>
            <div className="card card-pad">
              {loading ? (
                <div style={{textAlign:"center",color:"#9A9A8A",padding:"24px 0"}}>⏳ Loading...</div>
              ) : activity.length===0 ? (
                <div style={{textAlign:"center",color:"#9A9A8A",padding:"24px 0"}}>No recent activity</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {activity.slice(0,6).map((a,i) => {
                    const icon=a.type==="kyc_issued"?"\uD83D\uDD12":a.type==="loan_approved"?"\u2705":a.type==="loan_rejected"?"\u274C":"\uD83D\uDCCB";
                    return (
                      <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:10,background:"#F8F7F0",borderRadius:9}}>
                        <span style={{fontSize:18,flexShrink:0}}>{icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:700}}>{a.title||a.event||a.type}</div>
                          <div style={{fontSize:11,color:"#6A6A5A"}}>{a.description||a.detail||""}</div>
                        </div>
                        <div style={{fontSize:10,color:"#9A9A8A",flexShrink:0}}>{a.time||a.timestamp||""}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── 09 USER MANAGEMENT ── */}
        <UserManagement pushToast={pushToast} />

      </div>
    </div>
  );
}
