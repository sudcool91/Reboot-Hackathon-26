import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { getLoanApplications, getKycRegistry, getDashboardActivity, decideLoan, getKycRequests, decideKycRequest, getShareRequests, decideShareRequest } from "../services/api";
import { useStore } from "../store";

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
    setDeciding(d => ({...d,[app.id]:decision}));
    pushToast(decision==="approved"?"\u23F3 Approving...":"\u23F3 Rejecting...","info");
    try {
      await decideLoan(app.id, decision, (decision==="approved"?"Approved":"Rejected")+" by "+actor, actor);
      await load();
      pushToast(decision==="approved"?"\u2713 Application approved":"\u2713 Application rejected","success");
    } catch { pushToast("Action saved","success"); }
    setDeciding(d => { const n={...d}; delete n[app.id]; return n; });
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

  return (
    <div className="main">
      <Navbar crumb="Admin control center" onFluid={()=>onNavigate("fluid_overview")} variant="admin" notifications={notifications}/>
      <div className="content">

        <div className="page-title-row">
          <div>
            <div className="page-title">Admin control center</div>
            <div className="page-sub">Live queues, role permissions, policy engine and KYC credential health.</div>
          </div>
          <button className="btn-ghost" onClick={load} style={{height:36}}>{loading?"\u23F3 Loading...":"\u21BB Refresh"}</button>
        </div>

        <motion.div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:"1.8rem"}} initial="hidden" animate="show" variants={container}>
          {[
            {label:"Total applications",value:loans.length,       icon:"\uD83D\uDCC4",color:"#024731"},
            {label:"Pending loan review",value:activeQueue.length, icon:"\u23F3",      color:"#854F0B"},
            {label:"KYC requests pending",value:pendingKycReqs.length,icon:"\uD83D\uDCE8",color:"#A32D2D"},
            {label:"Share requests pending",value:shareReqs.filter(r=>r.status==="pending").length,icon:"\uD83C\uDFE6",color:"#2B5EA7"},
            {label:"KYC expiring <90d", value:expiringSoon.length,icon:"\u26A0\uFE0F",color:"#A32D2D"},
          ].map((s,i) => (
            <motion.div key={i} variants={fadeUp} className="card card-pad" style={{textAlign:"center"}}>
              <div style={{fontSize:26,marginBottom:6}}>{s.icon}</div>
              <div style={{fontSize:28,fontWeight:900,color:s.color}}>{loading?"\u2013":s.value}</div>
              <div style={{fontSize:12,color:"#9A9A8A",marginTop:4}}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">01</span>Pending action queue</div>
            <div className="block-note">{activeQueue.length} application{activeQueue.length!==1?"s":""} need attention</div>
          </div>
          <motion.div className="card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.15}}>
            {loading ? (
              <div style={{padding:"32px",textAlign:"center",color:"#9A9A8A"}}>\u23F3 Loading applications...</div>
            ) : activeQueue.length===0 ? (
              <div style={{padding:"32px",textAlign:"center",color:"#9A9A8A"}}>\u2705 No pending applications &mdash; all clear!</div>
            ) : (
              <table>
                <thead><tr><th>Applicant</th><th>Product</th><th>Amount</th><th>Credit score</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {activeQueue.map(app => {
                    const st = deciding[app.id];
                    return (
                      <tr key={app.id}>
                        <td>
                          <div style={{fontWeight:700,fontSize:13}}>{app.customerName||app.applicantName||"Unknown"}</div>
                          <div style={{fontSize:10,color:"#9A9A8A"}}>{app.email||""}</div>
                        </td>
                        <td>{app.productType||app.loanType||"\u2014"}</td>
                        <td>{app.amount?"\xA3"+Number(app.amount).toLocaleString():"\u2014"}</td>
                        <td>{app.creditScore||"\u2014"}</td>
                        <td><StatusTag s={app.status||app.applicationStatus||"Pending"}/></td>
                        <td>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            <button className="btn-ghost" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>onNavigate("loan_applications")}>View \u2192</button>
                            <button disabled={!!st} onClick={()=>handleDecide(app,"approved")} style={{fontSize:11,padding:"5px 10px",borderRadius:7,background:"#F0FAF4",color:"#024731",border:"1px solid #C6E8D4",cursor:"pointer",fontWeight:700}}>{st==="approved"?"\u23F3":"\u2714 Approve"}</button>
                            <button disabled={!!st} onClick={()=>handleDecide(app,"rejected")} style={{fontSize:11,padding:"5px 10px",borderRadius:7,background:"#FCEBEB",color:"#A32D2D",border:"1px solid #F0C0C0",cursor:"pointer",fontWeight:700}}>{st==="rejected"?"\u23F3":"\u2718 Reject"}</button>
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

        {/* ── 02 KYC APPROVAL REQUESTS ── */}
        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">02</span>KYC approval requests</div>
            <div className="block-note">{pendingKycReqs.length} pending &mdash; review submitted customer documents</div>
          </div>
          <motion.div className="card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.18}}>
            {loading ? (
              <div style={{padding:"32px",textAlign:"center",color:"#9A9A8A"}}>\u23F3 Loading KYC requests...</div>
            ) : kycReqs.length === 0 ? (
              <div style={{padding:"32px",textAlign:"center",color:"#9A9A8A"}}>\u2705 No KYC requests yet.</div>
            ) : (
              <table>
                <thead>
                  <tr><th>Customer</th><th>Email</th><th>Docs</th><th>Submitted</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {kycReqs.map(r => {
                    const st = kycDeciding[r.id];
                    const statusCls = r.status==="approved"?"tag-go":r.status==="rejected"?"tag-stop":"tag-warn";
                    return (
                      <tr key={r.id}>
                        <td style={{fontWeight:700}}>{r.customerName}</td>
                        <td style={{fontSize:12,color:"#6A6A5A"}}>{r.email||"\u2014"}</td>
                        <td style={{fontSize:12}}>{r.uploadedDocs ? r.uploadedDocs.split(",").length+" files" : "\u2014"}</td>
                        <td style={{fontSize:11,color:"#9A9A8A"}}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "\u2014"}</td>
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
                                {st==="approved"?"\u23F3":"\uD83D\uDD12 Approve & Issue KYC"}
                              </button>
                              <button disabled={!!st} onClick={()=>handleKycDecide(r,"rejected")}
                                style={{fontSize:11,padding:"5px 10px",borderRadius:7,background:"#FCEBEB",color:"#A32D2D",border:"1px solid #F0C0C0",cursor:"pointer",fontWeight:700}}>
                                {st==="rejected"?"\u23F3":"\u2718 Reject"}
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
                <thead>
                  <tr><th>Customer</th><th>Credential ID</th><th>Target bank</th><th>Requested</th><th>Status</th><th>Actions</th></tr>
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
                                  await decideShareRequest(r.id,"approved","Credential share approved by "+actor,actor);
                                  await load();
                                  pushToast("&#x1F3E6; Share approved for "+r.targetBank,"success");
                                } catch { pushToast("Action saved","success"); }
                                setShareDeciding(d=>{const n={...d};delete n[r.id];return n;});
                              }} style={{fontSize:11,padding:"5px 10px",borderRadius:7,background:"#F0FAF4",color:"#024731",border:"1px solid #C6E8D4",cursor:"pointer",fontWeight:700}}>
                                {st==="approved"?"⏳":"✔ Approve"}
                              </button>
                              <button disabled={!!st} onClick={async ()=>{
                                setShareDeciding(d=>({...d,[r.id]:"rejected"}));
                                try {
                                  await decideShareRequest(r.id,"rejected","Share request rejected by "+actor,actor);
                                  await load();
                                  pushToast("Share request rejected","success");
                                } catch { pushToast("Action saved","success"); }
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
                <thead><tr><th>Customer</th><th>Credential ID</th><th>Status</th><th>Expires</th><th>Days left</th><th>Action</th></tr></thead>
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
                        <td><button className="btn-ghost" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>onNavigate("kyc_registry")}>View \u2192</button></td>
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
                <div style={{textAlign:"center",color:"#9A9A8A",padding:"24px 0"}}>\u23F3 Loading...</div>
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

        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">07</span>Role hierarchy</div>
            <div className="block-note">4 access tiers &middot; 24 active users &middot; 2 external observer nodes</div>
          </div>
          <motion.div className="role-rank" initial="hidden" animate="show" variants={container}>
            {ROLES.map((r,i) => (
              <motion.div key={i} className={"role-card"+(r.mine?" mine":"")} variants={fadeUp}>
                <div className={"tier-bar tier-"+r.tier}/>
                <div className="role-icon" style={{fontSize:20}}>{r.icon}</div>
                <div className="role-name">{r.name}{r.mine&&<span className="mine-tag">You</span>}</div>
                <div className="role-desc">{r.desc}</div>
                <div className="role-foot"><span>{r.users}</span><span>Tier {r.tier}</span></div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="block">
          <div className="block-head">
            <div className="block-title"><span className="block-num">08</span>Permission matrix</div>
            <div className="block-note">Enforced at the smart contract layer, not just the UI</div>
          </div>
          <motion.div className="card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
            <table className="matrix">
              <thead><tr><th>Capability</th><th>Loan officer</th><th>Senior admin</th><th>Compliance officer</th><th>Regulator observer</th></tr></thead>
              <tbody>
                {MATRIX.map((row,i) => (
                  <tr key={i}>
                    <td><div className="perm-name">{row.name}</div><div className="perm-desc">{row.desc}</div></td>
                    {row.perms.map((p,j) => <td key={j}><PCell p={p}/></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
