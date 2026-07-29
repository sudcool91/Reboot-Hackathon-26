import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { uploadDocument, getKycRegistry, submitKycRequest, getKycRequestsByEmail, adminCreateBlockchainCustomer } from '../services/api';
import { useStore } from '../store';
import horseLogo from '../assets/lloyds-horse.gif';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const STEPS = ['Personal details', 'Upload documents', 'Review & submit', 'Request submitted'];
const DOC_TYPES = [
  { key: 'passport',  label: 'Passport / National ID', sub: 'Clear scan, valid photo ID',      icon: '\uD83E\uDEAA', required: true  },
  { key: 'proof_id',  label: 'Proof of identity',      sub: 'Front + back of driving licence', icon: '\uD83E\uDEAA', required: true  },
  { key: 'address',   label: 'Address proof',           sub: 'Utility bill, last 3 months',     icon: '\uD83C\uDFE0', required: true  },
  { key: 'income',    label: 'Income proof',            sub: 'Salary slip or Form 16',          icon: '\uD83D\uDCB7', required: false },
  { key: 'bank_stmt', label: 'Bank statement',          sub: 'Last 6 months',                   icon: '\uD83C\uDFE6', required: false },
];

const validators = {
  fullName: (v) => {
    if (!v.trim()) return 'Full name is required';
    if (!/^[A-Za-z\s'\u2019-]+$/.test(v)) return 'Name must contain letters only (no numbers or symbols)';
    if (v.trim().split(/\s+/).length < 2) return 'Please enter both first and last name';
    return '';
  },
  email: (v) => {
    if (!v.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Enter a valid email (e.g. john@example.com)';
    return '';
  },
  phone: (v) => {
    if (!v.trim()) return '';
    const digits = v.replace(/[\s\-()+]/g, '');
    if (!/^\d+$/.test(digits)) return 'Phone must contain digits, spaces, +, - or ( ) only';
    if (digits.length < 7 || digits.length > 15) return 'Phone must be 7\u201315 digits long';
    return '';
  },
  dob: (v) => {
    if (!v) return 'Date of birth is required';
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'Enter a valid date';
    const today = new Date();
    const age = today.getFullYear() - d.getFullYear()
      - (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
    if (age < 18) return 'Customer must be at least 18 years old';
    if (age > 120) return 'Please check the date entered';
    return '';
  },
};

function Field({ label, fkey, type, placeholder, value, onChange, required }) {
  const [touched, setTouched] = useState(false);
  const fn = validators[fkey];
  const err = fn ? fn(value) : '';
  const show = touched || value.length > 0;
  const good = !!value && !err;
  return (
    <div className="ncu-field">
      <label className="ncu-label">{label}{required && <span style={{ color: '#A32D2D' }}> *</span>}</label>
      <div style={{ position: 'relative' }}>
        <input className="ncu-input" type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)} onBlur={() => setTouched(true)}
          style={{ borderColor: show && err ? '#A32D2D' : good ? '#0B5C3F' : undefined, paddingRight: 32 }} />
        {good && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#0B5C3F', fontSize: 14, pointerEvents: 'none' }}>&#10003;</span>}
        {show && err && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#A32D2D', fontSize: 14, pointerEvents: 'none' }}>!</span>}
      </div>
      <AnimatePresence>
        {show && err && (
          <motion.div key="e" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ fontSize: 11, color: '#A32D2D', marginTop: 3, display: 'flex', gap: 4 }}>
            &#9888; {err}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NewCustomerUpload({ onNavigate, notifications = [] }) {
  const { pushToast, currentUser } = useStore();
  const [pageKycStatus, setPageKycStatus] = useState('loading'); // 'loading' | 'none' | 'pending' | 'approved'
  const [fabricLoading, setFabricLoading] = useState(false);
  const [step, setStep]             = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [customerId, setCustomerId] = useState('');
  // Admins upload documents on behalf of any customer, so their own details
  // must never be prefilled. Only prefill when the logged-in user is the
  // customer completing their own KYC upload.
  const isSelfUpload = currentUser?.role !== 'admin';
  const [form, setForm] = useState({
    fullName: isSelfUpload ? (currentUser?.name || '') : '',
    email:    isSelfUpload ? (currentUser?.email || '') : '',
    phone:    isSelfUpload ? (currentUser?.phone || '') : '',
    dob:      isSelfUpload ? (currentUser?.dob  || '') : '',
    nationality: 'British', address: '',
  });
  const [uploads, setUploads] = useState({});
  const fileRefs = useRef({});
  const [kycChecking, setKycChecking] = useState(false);
  const [existingKyc, setExistingKyc] = useState(null);
  const [kycChecked, setKycChecked]   = useState(false);
  const [showErrors, setShowErrors]   = useState(false);
  const [approvedDocs, setApprovedDocs] = useState(null); // array of doc keys or null

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    // Reset KYC check whenever any of the three identity fields change
    if (k === 'email' || k === 'fullName' || k === 'phone') { setKycChecked(false); setExistingKyc(null); }
  };

  const nameErr  = validators.fullName(form.fullName);
  const emailErr = validators.email(form.email);
  const dobErr   = validators.dob(form.dob);
  const step0Valid = !nameErr && !emailErr && !dobErr && !!form.fullName && !!form.email && !!form.dob;

  // Page-load: check if logged-in user already has KYC
  useEffect(() => {
    // Admins should always start with a blank onboarding slate here.
    if (currentUser?.role === 'admin') {
      setPageKycStatus('none');
      setApprovedDocs(null);
      return;
    }

    if (!currentUser?.email) { setPageKycStatus('none'); return; }

    // 1. Instant check — if user object already has a credentialId, they're approved
    if (currentUser.credentialId) { setPageKycStatus('approved'); return; }

    const eL = currentUser.email.toLowerCase().trim();
    Promise.all([getKycRegistry(), getKycRequestsByEmail(eL)]).then(([kycData, reqData]) => {
      // Check kyc_registry (approved/active credential)
      const list = Array.isArray(kycData) ? kycData : [];
      const match = list.find(r => r.email?.toLowerCase().trim() === eL);
      if (match) {
        const s = (match.status || '').toLowerCase();
        if (s === 'active' || s === 'approved') { setPageKycStatus('approved'); return; }
      }
      // Check kyc_request table for pending/approved request
      const reqs = Array.isArray(reqData) ? reqData : [];
      if (reqs.some(r => (r.status || '').toLowerCase() === 'approved')) { setPageKycStatus('approved'); return; }
      if (reqs.some(r => (r.status || '').toLowerCase() === 'pending'))  { setPageKycStatus('pending');  return; }
      setPageKycStatus('none');
    }).catch(() => {
      // If API fails, still check registry by matching static data
      setPageKycStatus('none');
    });
  }, [currentUser]);

  // Load approved docs when user is verified
  useEffect(() => {
    if (currentUser?.role === 'admin') return;
    if (pageKycStatus !== 'approved' || !currentUser?.email) return;
    const eL = currentUser.email.toLowerCase().trim();
    getKycRequestsByEmail(eL).then(reqData => {
      const reqs = Array.isArray(reqData) ? reqData : [];
      const approved = reqs.find(r => (r.status || '').toLowerCase() === 'approved');
      if (approved?.uploadedDocs) {
        setApprovedDocs(approved.uploadedDocs.split(',').map(s => s.trim()).filter(Boolean));
      } else {
        setApprovedDocs([]);
      }
    }).catch(() => setApprovedDocs([]));
  }, [pageKycStatus, currentUser]);

  useEffect(() => {
    // Need at least name + email to start checking; phone adds precision
    if (nameErr || emailErr || !form.fullName || !form.email) return;
    setKycChecked(false);
    const t = setTimeout(async () => {
      setKycChecking(true);
      try {
        const [kycData, reqData] = await Promise.all([
          getKycRegistry(),
          getKycRequestsByEmail(form.email.toLowerCase().trim()),
        ]);

        const eL = form.email.toLowerCase().trim();
        const nL = form.fullName.toLowerCase().trim();
        const pH = (form.phone || '').replace(/\D/g, ''); // digits only for comparison

        // ── Match in KYC Registry (approved credentials) ───────────────────
        const credList = Array.isArray(kycData) ? kycData : [];
        const credMatch = credList.find(r => {
          const emailMatch = r.email?.toLowerCase().trim() === eL;
          const nameMatch  = r.customerName?.toLowerCase().trim() === nL;
          const recPhone   = (r.phone || '').replace(/\D/g, '');
          const phoneMatch = pH && recPhone ? pH === recPhone : true;
          // Name, email and phone (when both sides provide one) must all match
          return emailMatch && nameMatch && phoneMatch;
        });

        // ── Match in KYC Requests (pending / approved requests) ────────────
        const reqList = Array.isArray(reqData) ? reqData : [];
        const reqMatch = reqList.find(r => {
          const emailMatch = r.email?.toLowerCase().trim() === eL;
          const nameMatch  = r.customerName?.toLowerCase().trim() === nL;
          const recPhone   = (r.phone || '').replace(/\D/g, '');
          const phoneMatch = pH && recPhone ? pH === recPhone : true;
          return emailMatch && nameMatch && phoneMatch;
        });

        // Prefer credential record (approved), fall back to request record
        setExistingKyc(credMatch || reqMatch || null);
        setKycChecked(true);
      } catch { setExistingKyc(null); setKycChecked(true); }
      finally { setKycChecking(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [form.email, form.fullName, form.phone]);

  const handleFilePick = async (docKey, file) => {
    if (!file) return;
    setUploads(u => ({ ...u, [docKey]: { file, name: file.name, size: file.size, status: 'uploading' } }));
    pushToast('Uploading ' + file.name + '\u2026', 'info');
    const cid2 = form.fullName.replace(/\s+/g, '-').toLowerCase() || 'guest';
    const res = await uploadDocument(file, docKey, cid2);
    if (res?.success) {
      setUploads(u => ({ ...u, [docKey]: { ...u[docKey], status: 'done', savedAs: res.savedAs } }));
      pushToast('\u2713 ' + file.name + ' uploaded', 'success');
    } else {
      setUploads(u => ({ ...u, [docKey]: { ...u[docKey], status: 'error' } }));
      pushToast('Failed: ' + file.name, 'error');
    }
  };

  const reqDone = DOC_TYPES.filter(d => d.required).every(d => uploads[d.key]?.status === 'done');
  const totalUp = Object.values(uploads).filter(u => u.status === 'done').length;
  const pct = Math.round((totalUp / DOC_TYPES.length) * 100);

  const handleSubmit = async () => {
    setSubmitting(true);

    // ── Step 1: Register customer on Fabric ledger ─────────────────────────
    setFabricLoading(true);
    pushToast('⛓ Registering on Hyperledger Fabric…', 'info');
    const initials = form.fullName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
    const customerID = `KYC-${initials}-${Date.now().toString().slice(-6)}`;
    try {
      await adminCreateBlockchainCustomer({
        customerID,
        fullName:    form.fullName,
        email:       form.email,
        dateOfBirth: form.dob,
        phone:       form.phone,
        address:     form.address,
        nationalID:  form.nationality,
        issuingBank: 'LloydsBankingGroup',
      });
      pushToast('✅ Customer registered on Fabric ledger', 'success');
    } catch (fabricErr) {
      // Non-fatal — continue to submit KYC request even if Fabric is down
      pushToast('⚠️ Fabric registration skipped — continuing KYC submission', 'warn');
    }
    setFabricLoading(false);

    // ── Step 2: Submit KYC request to admin queue ──────────────────────────
    pushToast('📨 Submitting KYC request to admin…', 'info');
    const docKeys = Object.keys(uploads).filter(k => uploads[k]?.status === 'done').join(',');
    await submitKycRequest({
      customerName: isSelfUpload ? (currentUser?.name || form.fullName) : form.fullName,
      email:        isSelfUpload ? (currentUser?.email || form.email)   : form.email,
      phone:        isSelfUpload ? (currentUser?.phone || form.phone)   : form.phone,
      dob:          form.dob,
      nationality:  form.nationality,
      address:      form.address,
      uploadedDocs: docKeys,
      fabricCustomerId: customerID,
      status: 'pending',
    });

    setSubmitting(false);
    setStep(3);
    pushToast('📨 KYC request submitted — awaiting admin approval', 'success');
  };

  const resetForm = () => {
    setStep(0); setUploads({}); setKycChecked(false); setExistingKyc(null); setShowErrors(false);
    // Keep account values pre-filled on reset
    setForm({
      fullName: isSelfUpload ? (currentUser?.name || '')  : '',
      email:    isSelfUpload ? (currentUser?.email || '') : '',
      phone:    isSelfUpload ? (currentUser?.phone || '') : '',
      dob:      isSelfUpload ? (currentUser?.dob || '')   : '',
      nationality: 'British',
      address: '',
    });
  };

  return (
    <div className="main">
      <Navbar crumb="New customer upload" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />

      {/* ── Fabric blockchain loading overlay ── */}
      <AnimatePresence>
        {fabricLoading && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,transition:{duration:0.4}}}
            style={{position:'fixed',inset:0,zIndex:99998,background:'rgba(2,18,12,0.92)',backdropFilter:'blur(8px)',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:22,pointerEvents:'all'}}>
            <motion.img src={horseLogo} alt="Processing…"
              initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:0.35}}
              style={{width:110,height:110,objectFit:'contain',filter:'drop-shadow(0 0 28px rgba(110,231,183,0.6))'}}/>
            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
              style={{color:'#6EE7B7',fontSize:15,fontWeight:800,letterSpacing:'0.09em',textAlign:'center'}}>
              Writing to Hyperledger Fabric…
            </motion.div>
            <div style={{fontSize:12,color:'rgba(110,231,183,0.5)'}}>⛓ Committing your KYC credential on-chain</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="content">

        {/* ── Dark gradient hero banner ── */}
        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}
          style={{
            background:'linear-gradient(135deg,#012820 0%,#024731 50%,#0B3A6B 100%)',
            borderRadius:20,padding:'28px 32px',marginBottom:24,position:'relative',overflow:'hidden',
            boxShadow:'0 8px 40px rgba(2,71,49,0.25)',
          }}>
          {/* background texture */}
          <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 80% 50%,rgba(255,255,255,0.04) 0%,transparent 60%)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',top:-30,right:-30,width:180,height:180,borderRadius:'50%',background:'rgba(77,255,154,0.05)',pointerEvents:'none'}}/>
          <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'space-between',gap:20,flexWrap:'wrap'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                <div style={{width:38,height:38,borderRadius:10,background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🪪</div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.12em',color:'rgba(255,255,255,0.5)',textTransform:'uppercase'}}>KYC Onboarding</div>
              </div>
              <div style={{fontSize:22,fontWeight:900,color:'#fff',letterSpacing:'-0.01em',marginBottom:6}}>
                New Customer Identity Verification
              </div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',maxWidth:520,lineHeight:1.6}}>
                Submit identity documents once — your credential is hashed on-chain and reused instantly across every Lloyds product. No re-verification, ever.
              </div>
            </div>
            {step < 3 && (
              <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
                <svg width="68" height="68" viewBox="0 0 68 68">
                  <circle cx="34" cy="34" r="29" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"/>
                  <circle cx="34" cy="34" r="29" fill="none" stroke={pct===100?'#4DFF9A':'#60A5FA'} strokeWidth="6"
                    strokeDasharray={String(2*Math.PI*29)}
                    strokeDashoffset={String(2*Math.PI*29*(1-pct/100))}
                    strokeLinecap="round" transform="rotate(-90 34 34)"
                    style={{transition:'stroke-dashoffset 0.5s ease'}}/>
                  <text x="34" y="38" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily="inherit">{pct}%</text>
                </svg>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.9)'}}>{totalUp} of {DOC_TYPES.length} docs</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.45)',marginTop:2}}>uploaded</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── KYC status banners ── */}
        {pageKycStatus === 'approved' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 24 }}>
            {/* Verified hero banner */}
            <div style={{ background: 'linear-gradient(135deg,#012820,#024731)', border: '1.5px solid #059669', borderRadius: 16, padding: '20px 28px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 16,
              boxShadow:'0 0 0 4px rgba(5,150,105,0.1)' }}>
              <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
                <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(77,255,154,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>✅</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#4DFF9A' }}>KYC already verified</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                    Your identity is live on the Trust Ledger. No further uploads needed.
                  </div>
                  {approvedDocs !== null && (
                    <div style={{ marginTop: 8, display:'flex', alignItems:'center', gap: 8 }}>
                      <span style={{ background:'rgba(77,255,154,0.2)', color:'#4DFF9A', border:'1px solid rgba(77,255,154,0.4)', borderRadius: 99, fontSize: 12, fontWeight: 800, padding:'3px 12px' }}>
                        📄 {approvedDocs.length} document{approvedDocs.length !== 1 ? 's' : ''} submitted
                      </span>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>
                        {DOC_TYPES.filter(d => approvedDocs.includes(d.key)).map(d => d.label).join(', ') || 'All documents verified'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => onNavigate('customer_dashboard')}
                style={{ background: 'linear-gradient(135deg,#4DFF9A,#059669)', color: '#012820', border: 'none', borderRadius: 10,
                  padding: '10px 22px', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink:0 }}>
                Go to Dashboard →
              </button>
            </div>

            {/* Uploaded docs cards */}
            <div style={{ background:'#fff', border:'1.5px solid #E8E7DD', borderRadius:16, padding:'20px 24px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#1A1A14' }}>Documents submitted</div>
                  <div style={{ fontSize:12, color:'#6A6A5A', marginTop:2 }}>
                    {approvedDocs === null ? 'Loading…' : `${approvedDocs.length} document${approvedDocs.length !== 1 ? 's' : ''} verified on Trust Ledger`}
                  </div>
                </div>
                <span style={{ background:'#ECFDF5', color:'#059669', border:'1px solid #A7F3D0', borderRadius:99, fontSize:11, fontWeight:700, padding:'4px 12px' }}>
                  ✓ All verified
                </span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
                {approvedDocs === null ? (
                  [1,2,3].map(i => (
                    <div key={i} style={{ height:90, borderRadius:12, background:'#F5F4EE', animation:'pulse 1.5s infinite' }} />
                  ))
                ) : approvedDocs.length === 0 ? (
                  DOC_TYPES.map(dt => (
                    <div key={dt.key} style={{ borderRadius:12, border:'1.5px solid #E8E7DD', padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                      <div style={{ fontSize:22 }}>{dt.icon}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#1A1A14' }}>{dt.label}</div>
                      <span style={{ fontSize:10, color:'#059669', fontWeight:700 }}>✓ Submitted</span>
                    </div>
                  ))
                ) : (
                  DOC_TYPES.map(dt => {
                    const uploaded = approvedDocs.includes(dt.key);
                    return (
                      <div key={dt.key} style={{
                        borderRadius:12, border:`1.5px solid ${uploaded ? '#A7F3D0' : '#E8E7DD'}`,
                        padding:'14px 16px', display:'flex', flexDirection:'column', gap:8,
                        background: uploaded ? '#F0FAF4' : '#FAFAF8',
                      }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <span style={{ fontSize:22 }}>{dt.icon}</span>
                          {uploaded
                            ? <span style={{ fontSize:16 }}>✅</span>
                            : <span style={{ fontSize:16, color:'#D1D5DB' }}>—</span>}
                        </div>
                        <div style={{ fontSize:12, fontWeight:700, color:'#1A1A14', lineHeight:1.3 }}>{dt.label}</div>
                        <span style={{ fontSize:10, fontWeight:700, color: uploaded ? '#059669' : '#9A9A8A' }}>
                          {uploaded ? '✓ Verified on ledger' : 'Not submitted'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              <div style={{ marginTop:16, padding:'12px 16px', background:'#F0FAF4', borderRadius:10, border:'1px solid #D1FAE5', fontSize:12, color:'#065F46', lineHeight:1.6 }}>
                🔒 Your documents are hashed on Hyperledger Fabric — only cryptographic proofs are stored on-chain. Source files are encrypted at rest.
              </div>
            </div>
          </motion.div>
        )}

        {pageKycStatus === 'pending' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'linear-gradient(135deg,#2D1B00,#5C3500)', border: '1.5px solid #D97706', borderRadius: 16, padding: '20px 28px',
              display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
              boxShadow:'0 0 0 4px rgba(217,119,6,0.1)' }}>
            <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(255,160,0,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>⏳</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#FCD34D' }}>Documents under review</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                Your documents have been submitted and are awaiting admin approval. You'll be notified once verified.
              </div>
            </div>
          </motion.div>
        )}

        {/* Hide everything below when KYC already approved */}
        {pageKycStatus === 'approved' ? null : (
        <>
        <div className="page-title-row" style={{marginBottom:16}}>
          <div>
            <div className="page-title" style={{fontSize:20}}>New customer KYC onboarding</div>
            <div className="page-sub">Verified once — reused everywhere across Lloyds Group.</div>
          </div>
        </div>

        {/* ── Stepper ── */}
        <div className="ncu-stepper" style={{ opacity: (pageKycStatus === 'approved' || pageKycStatus === 'pending') ? 0.35 : 1, pointerEvents: (pageKycStatus === 'approved' || pageKycStatus === 'pending') ? 'none' : 'auto' }}>
          {STEPS.map((s, i) => (
            <div key={i} className={'ncu-step-item' + (i === step ? ' active' : i < step ? ' done' : '')}>
              <div className="ncu-step-circle">
                {i < step ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> : i + 1}
              </div>
              <span className="ncu-step-label">{s}</span>
              {i < STEPS.length - 1 && <div className={'ncu-step-line' + (i < step ? ' done' : '')}/>}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {step === 0 && (
            <motion.div key="s0" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <section className="block">
                <div className="block-head"><div className="block-title"><span className="block-num">01</span>Personal details</div></div>
                <div className="card-pad-standalone">
                  <div className="ncu-form-grid">
                    {/* Full Name — locked if from account (self-upload only; admins always get an editable blank field) */}
                    {isSelfUpload && currentUser?.name ? (
                      <div className="ncu-field">
                        <label className="ncu-label">Full Name <span style={{color:'#059669',fontSize:10,fontWeight:700,marginLeft:4}}>🔒 from your account</span></label>
                        <input className="ncu-input" type="text" value={currentUser.name} readOnly
                          style={{background:'#F0FAF4',color:'#024731',border:'1.5px solid #C6E8D4',cursor:'not-allowed'}} />
                      </div>
                    ) : (
                      <Field label="Full Name" fkey="fullName" type="text" placeholder="e.g. Rohan Sharma" value={form.fullName} onChange={v => set('fullName', v)} required />
                    )}
                    {/* Email — locked if from account (self-upload only) */}
                    {isSelfUpload && currentUser?.email ? (
                      <div className="ncu-field">
                        <label className="ncu-label">Email Address <span style={{color:'#059669',fontSize:10,fontWeight:700,marginLeft:4}}>🔒 from your account</span></label>
                        <input className="ncu-input" type="email" value={currentUser.email} readOnly
                          style={{background:'#F0FAF4',color:'#024731',border:'1.5px solid #C6E8D4',cursor:'not-allowed'}} />
                      </div>
                    ) : (
                      <Field label="Email Address" fkey="email" type="email" placeholder="e.g. rohan@email.com" value={form.email} onChange={v => set('email', v)} required />
                    )}
                    {/* Phone — locked if from account (self-upload only), editable otherwise */}
                    {isSelfUpload && currentUser?.phone ? (
                      <div className="ncu-field">
                        <label className="ncu-label">Phone Number <span style={{color:'#059669',fontSize:10,fontWeight:700,marginLeft:4}}>🔒 from your account</span></label>
                        <input className="ncu-input" type="tel" value={currentUser.phone} readOnly
                          style={{background:'#F0FAF4',color:'#024731',border:'1.5px solid #C6E8D4',cursor:'not-allowed'}} />
                      </div>
                    ) : (
                      <Field label="Phone Number" fkey="phone" type="tel" placeholder="+44 7700 900000" value={form.phone} onChange={v => set('phone', v)} />
                    )}
                    {/* DOB — locked if from account (self-upload only), editable otherwise */}
                    {isSelfUpload && currentUser?.dob ? (
                      <div className="ncu-field">
                        <label className="ncu-label">Date of Birth <span style={{color:'#059669',fontSize:10,fontWeight:700,marginLeft:4}}>🔒 from your account</span></label>
                        <input className="ncu-input" type="date" value={currentUser.dob} readOnly
                          style={{background:'#F0FAF4',color:'#024731',border:'1.5px solid #C6E8D4',cursor:'not-allowed'}} />
                      </div>
                    ) : (
                      <Field label="Date of Birth" fkey="dob" type="date" placeholder="" value={form.dob} onChange={v => set('dob', v)} required />
                    )}
                    <div className="ncu-field">
                      <label className="ncu-label">Nationality</label>
                      <input className="ncu-input" type="text" placeholder="e.g. British" value={form.nationality} onChange={e => set('nationality', e.target.value)} />
                    </div>
                    <div className="ncu-field" style={{ gridColumn: '1/-1' }}>
                      <label className="ncu-label">Home Address</label>
                      <textarea className="ncu-input" rows={3} placeholder="Full residential address" value={form.address} onChange={e => set('address', e.target.value)} />
                    </div>
                  </div>

                  {showErrors && !step0Valid && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: 14, padding: '10px 14px', background: '#FCEBEB', border: '1px solid #F0C0C0', borderRadius: 10, fontSize: 12, color: '#A32D2D' }}>
                      ⚠️ Please fix the highlighted errors above before continuing.
                    </motion.div>
                  )}

                  {kycChecking && (
                    <div style={{ marginTop: 14, fontSize: 12, color: '#6A6A5A', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔍</span>
                      Checking our system for existing records…
                    </div>
                  )}

                  {kycChecked && existingKyc && (() => {
                    // Determine which fields actually match the found record
                    const eL = form.email.toLowerCase().trim();
                    const nL = form.fullName.toLowerCase().trim();
                    const pH = (form.phone || '').replace(/\D/g, '');
                    const recPhone = (existingKyc.phone || '').replace(/\D/g, '');
                    const emailMatch = existingKyc.email?.toLowerCase().trim() === eL;
                    const nameMatch  = existingKyc.customerName?.toLowerCase().trim() === nL;
                    const phoneMatch = pH && recPhone ? pH === recPhone : null; // null = not provided

                    const allMatch = emailMatch && nameMatch && (phoneMatch === null || phoneMatch === true);
                    const partialMatch = !allMatch;

                    return (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: 16, background: allMatch ? '#FFF7E6' : '#EFF6FF', border: `1px solid ${allMatch ? '#F0C040' : '#93C5FD'}`, borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 24 }}>{allMatch ? '⚠️' : 'ℹ️'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: allMatch ? '#7A5A00' : '#1E40AF', marginBottom: 4 }}>
                            {allMatch ? 'Customer already exists in our system' : 'Similar record found — details differ'}
                          </div>
                          <div style={{ fontSize: 12, color: '#4A4A40', marginBottom: 10 }}>
                            {allMatch
                              ? <><b>{existingKyc.customerName}</b> already has a KYC credential on the network:</>
                              : <>A record for <b>{existingKyc.customerName}</b> was found, but some details don't match the entry above. If this is a different person, you can continue. If it's the same person, please correct the details:</>
                            }
                          </div>

                          {/* Field-by-field match indicators */}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                            {[
                              { label: 'Name',  match: nameMatch },
                              { label: 'Email', match: emailMatch },
                              { label: 'Phone', match: phoneMatch === null ? null : phoneMatch },
                            ].map(({ label, match }) => match === null ? null : (
                              <span key={label} style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                                background: match ? '#D1FAE5' : '#FCEBEB',
                                color: match ? '#065F46' : '#A32D2D',
                              }}>
                                {match ? '✓' : '✗'} {label}
                              </span>
                            ))}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                            {[['Credential ID', existingKyc.credentialId], ['Status', existingKyc.status || existingKyc.kycStatus], ['Issuer', existingKyc.issuer || 'Lloyds'], ['Expires', existingKyc.expiresOn || '—']].map(([l, v]) => (
                              <div key={l} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 7, padding: '6px 10px' }}>
                                <div style={{ fontSize: 10, color: '#9A9A8A' }}>{l}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A14' }}>{v || '—'}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {allMatch && <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onNavigate('kyc_registry')}>View in KYC Registry →</button>}
                            {allMatch && <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onNavigate('ledger_explorer', { credentialId: existingKyc.credentialId, customerName: existingKyc.customerName })}>View audit trail →</button>}
                            <button style={{ fontSize: 11, padding: '6px 12px', borderRadius: 7, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F0C0C0', cursor: 'pointer', fontWeight: 600 }}
                              onClick={() => { setKycChecked(false); setExistingKyc(null); setForm(f => ({ ...f, fullName: '', email: '', phone: '' })); }}>
                              Enter different customer
                            </button>
                            {partialMatch && <button className="btn-primary" style={{ fontSize: 11 }} onClick={() => setExistingKyc(null)}>Continue anyway →</button>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    );
                  })()}

                  {kycChecked && !existingKyc && step0Valid && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: 16, background: '#F0FAF4', border: '1px solid #C6E8D4', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#024731', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 20 }}>✅</span>
                      <div><b>New customer — not in our system yet.</b><br/><span style={{ color: '#4A4A40' }}>Proceed to upload documents and issue a new KYC credential.</span></div>
                    </motion.div>
                  )}
                </div>
              </section>
              <div className="ncu-actions">
                <button className="btn-primary"
                  disabled={kycChecked && !!existingKyc}
                  style={{ opacity: (kycChecked && !!existingKyc) ? 0.5 : 1 }}
                  onClick={() => {
                    setShowErrors(true);
                    if (!step0Valid || (kycChecked && existingKyc)) return;
                    setStep(1); pushToast('Personal details saved ✓', 'success');
                  }}>
                  Continue to documents →
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <section className="block">
                <div className="block-head"><div className="block-title"><span className="block-num">02</span>Upload documents</div></div>
                <div className="card-pad-standalone">
                  <div className="ncu-doc-grid">
                    {DOC_TYPES.map(doc => {
                      const up = uploads[doc.key];
                      const isDone = up?.status === 'done';
                      const isUp   = up?.status === 'uploading';
                      const isErr  = up?.status === 'error';
                      return (
                        <div key={doc.key}
                          className={'ncu-doc-card' + (isDone ? ' done' : isErr ? ' error' : '')}
                          onClick={() => !isUp && fileRefs.current[doc.key]?.click()}
                          style={{
                            transition:'all 0.2s',
                            boxShadow: isDone ? '0 0 0 2px #024731, 0 4px 16px rgba(2,71,49,0.15)' : isErr ? '0 0 0 2px #A32D2D' : 'none',
                          }}>
                          <input ref={el => fileRefs.current[doc.key] = el} type="file" accept=".pdf,.jpg,.jpeg,.png"
                            style={{ display: 'none' }} onChange={e => handleFilePick(doc.key, e.target.files[0])} />
                          <div className="ncu-doc-icon" style={{fontSize:32,transition:'transform 0.2s',transform:isDone?'scale(1.1)':'scale(1)'}}>{doc.icon}</div>
                          <div className="ncu-doc-info">
                            <div className="ncu-doc-name" style={{fontWeight:700}}>{doc.label}{doc.required && <span style={{ color: '#A32D2D' }}> *</span>}</div>
                            <div className="ncu-doc-sub">
                              {isDone ? <span style={{ color: '#024731',fontWeight:600 }}>✓ {up.name} ({(up.size/1024).toFixed(0)} KB)</span>
                               : isUp ? <span style={{ color: '#854F0B' }}>⏳ Uploading...</span>
                               : isErr ? <span style={{ color: '#A32D2D' }}>✗ Failed — click to retry</span>
                               : doc.sub}
                            </div>
                          </div>
                          <div>
                            {isDone ? <span className="tag tag-go" style={{background:'linear-gradient(135deg,#024731,#0B5C3F)',color:'#fff',border:'none'}}>✓ Done</span>
                             : isUp  ? <span className="tag tag-warn">Uploading</span>
                             : isErr ? <span className="tag tag-stop">Error</span>
                             : <span className="tag tag-mute">{doc.required ? 'Required' : 'Optional'}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!reqDone && (
                    <div className="ncu-banner" style={{ marginTop: 16 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                      Upload all 3 required (*) documents to continue
                    </div>
                  )}
                  {reqDone && (
                    <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
                      style={{marginTop:16,padding:'14px 18px',background:'linear-gradient(135deg,#F0FAF4,#E2F5EC)',border:'1.5px solid #C6E8D4',borderRadius:12,display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontSize:24}}>🔒</span>
                      <div style={{fontSize:13,color:'#024731',fontWeight:600}}>All required documents uploaded — ready to submit for admin review.</div>
                    </motion.div>
                  )}
                </div>
              </section>
              <div className="ncu-actions">
                <button className="btn-ghost" onClick={() => setStep(0)}>← Back</button>
                <button className="btn-primary" disabled={!reqDone} style={{ opacity: !reqDone ? 0.5 : 1 }}
                  onClick={() => { setStep(2); pushToast('Documents verified ✓', 'success'); }}>
                  Review & submit →
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <section className="block">
                <div className="block-head"><div className="block-title"><span className="block-num">03</span>Review & submit</div></div>
                <div className="card-pad-standalone">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                    {Object.entries(form).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} style={{ background: '#F2F0E6', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#9A9A8A', textTransform: 'capitalize', marginBottom: 3 }}>{k.replace(/([A-Z])/g, ' $1')}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Documents ready</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {DOC_TYPES.map(d => uploads[d.key]?.status === 'done' && <span key={d.key} className="tag tag-go">{d.icon} {d.label}</span>)}
                    </div>
                  </div>
                  <div className="ncu-banner" style={{ background: '#F0FAF4', borderColor: '#B8E0C8', color: '#0B5C3F' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B5C3F" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/></svg>
                    Document hashes committed to Hyperledger Fabric. Documents stay encrypted at Lloyds — never on-chain.
                  </div>
                </div>
              </section>
              <div className="ncu-actions">
                <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '⏳ Submitting request...' : '📨 Submit KYC Request to Admin'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" variants={fadeUp} initial="hidden" animate="show">
              {/* Dark success card */}
              <div style={{
                background:'linear-gradient(135deg,#012820 0%,#024731 50%,#0B3A6B 100%)',
                borderRadius:24,padding:'48px 40px',textAlign:'center',
                boxShadow:'0 16px 60px rgba(2,71,49,0.3)',
                position:'relative',overflow:'hidden',maxWidth:600,margin:'0 auto',
              }}>
                <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 50% 0%,rgba(77,255,154,0.08) 0%,transparent 60%)',pointerEvents:'none'}}/>
                <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  style={{ fontSize: 64, marginBottom: 20, position:'relative',zIndex:1 }}>📬</motion.div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#4DFF9A', marginBottom: 10, position:'relative',zIndex:1 }}>
                  KYC Request Submitted!
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 28, lineHeight: 1.7, position:'relative',zIndex:1 }}>
                  Documents for <b style={{color:'#fff'}}>{form.fullName}</b> have been received.<br/>
                  An admin will review and issue the credential.
                </div>

                {/* Status card */}
                <div style={{
                  background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',
                  borderRadius:16,padding:'20px 24px',marginBottom:24,textAlign:'left',position:'relative',zIndex:1,
                }}>
                  <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:14}}>
                    <span style={{fontSize:20}}>⏳</span>
                    <div style={{fontWeight:700,color:'#FCD34D',fontSize:14}}>Awaiting admin approval</div>
                  </div>
                  {[
                    ['Customer', isSelfUpload ? (currentUser?.name || form.fullName) : form.fullName],
                    ['Email', isSelfUpload ? (currentUser?.email || form.email) : form.email],
                    ['Documents uploaded', Object.keys(uploads).filter(k => uploads[k]?.status === 'done').length + ' files'],
                    ['Submitted at', new Date().toLocaleString()],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 24, marginBottom: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{l}</span>
                      <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', position:'relative',zIndex:1 }}>
                  <button onClick={() => onNavigate('customer_dashboard')}
                    style={{padding:'11px 22px',borderRadius:10,background:'linear-gradient(135deg,#4DFF9A,#059669)',color:'#012820',border:'none',fontWeight:800,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                    Go to My Dashboard →
                  </button>
                  <button onClick={resetForm}
                    style={{padding:'11px 22px',borderRadius:10,background:'rgba(255,255,255,0.12)',color:'#F2F0E6',border:'1px solid rgba(255,255,255,0.25)',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                    Submit another
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
        </>
        )} {/* end pageKycStatus !== 'approved' */}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

