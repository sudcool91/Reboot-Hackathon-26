import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { uploadDocument, getKycRegistry, submitKycRequest } from '../services/api';
import { useStore } from '../store';

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
  const { pushToast } = useStore();
  const [step, setStep]             = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', dob: '', nationality: 'British', address: '' });
  const [uploads, setUploads] = useState({});
  const fileRefs = useRef({});
  const [kycChecking, setKycChecking] = useState(false);
  const [existingKyc, setExistingKyc] = useState(null);
  const [kycChecked, setKycChecked]   = useState(false);
  const [showErrors, setShowErrors]   = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'email' || k === 'fullName') { setKycChecked(false); setExistingKyc(null); }
  };

  const nameErr  = validators.fullName(form.fullName);
  const emailErr = validators.email(form.email);
  const dobErr   = validators.dob(form.dob);
  const step0Valid = !nameErr && !emailErr && !dobErr && !!form.fullName && !!form.email && !!form.dob;

  useEffect(() => {
    if (nameErr || emailErr || !form.fullName || !form.email) return;
    setKycChecked(false);
    const t = setTimeout(async () => {
      setKycChecking(true);
      try {
        const data = await getKycRegistry();
        const list = Array.isArray(data) ? data : [];
        const eL = form.email.toLowerCase().trim();
        const nL = form.fullName.toLowerCase().trim();
        const match = list.find(r =>
          (nL && r.customerName?.toLowerCase().trim() === nL) ||
          (r.email && r.email.toLowerCase().trim() === eL)
        );
        setExistingKyc(match || null);
        setKycChecked(true);
      } catch { setExistingKyc(null); setKycChecked(true); }
      finally { setKycChecking(false); }
    }, 900);
    return () => clearTimeout(t);
  }, [form.email, form.fullName]);

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
    
    pushToast('Submitting KYC request to admin\u2026', 'info');
    const docKeys = Object.keys(uploads).filter(k => uploads[k]?.status === 'done').join(',');
    const result = await submitKycRequest({
      customerName: form.fullName,
      email: form.email,
      phone: form.phone,
      dob: form.dob,
      nationality: form.nationality,
      address: form.address,
      uploadedDocs: docKeys,
      status: 'pending',
    });
    setSubmitting(false);
    setStep(3);
    pushToast('\uD83D\uDCE8 KYC request submitted \u2014 awaiting admin approval', 'success');
  };

  const resetForm = () => {
    setStep(0); setUploads({}); setKycChecked(false); setExistingKyc(null); setShowErrors(false);
    setForm({ fullName: '', email: '', phone: '', dob: '', nationality: 'British', address: '' });

//     pushToast('Submitting to Hyperledger Fabric...', 'info');
//     const docHash = 'sha256:' + Array.from({ length: 16 }, () =>
//       Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
//     const networkId = `NET-${form.fullName.replace(/\s+/g, '').toUpperCase().slice(0, 6)}-${Date.now()}`;
//     const result = await issueKyc(
//       networkId,
//       docHash,
//       'Lloyds Branch Validator',
//       // extra fields passed through
//       {
//         customerName: form.fullName,
//         email: form.email,
//         phone: form.phone,
//         dateOfBirth: form.dob,
//         address: form.address,
//       },
//     );
//     setSubmitting(false);
//     const tx = result?.txHash || `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
//     const cid = result?.credentialId || `KYC-${form.fullName.split(' ').map(w => w[0]).join('')}-${Math.floor(Math.random() * 90000 + 10000)}`;
//     setTxHash(tx); setCredentialId(cid); setCustomerId(result?.customerId || ''); setStep(3);
//     pushToast(`🔒 KYC credential issued — ${cid}`, 'success', tx);

  };

  return (
    <div className="main">
      <Navbar crumb="New customer upload" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
      <div className="content">
        <div className="page-title-row">
          <div>
            <div className="page-title">New customer KYC onboarding</div>
            <div className="page-sub">Verified once \u2014 reused everywhere. No repeated paperwork across Lloyds Group.</div>
          </div>
          {step < 3 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="22" fill="none" stroke="#E2EEE7" strokeWidth="5"/>
                <circle cx="26" cy="26" r="22" fill="none" stroke="#024731" strokeWidth="5"
                  strokeDasharray={String(2 * Math.PI * 22)}
                  strokeDashoffset={String(2 * Math.PI * 22 * (1 - pct / 100))}
                  strokeLinecap="round" transform="rotate(-90 26 26)"/>
                <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#024731" fontFamily="inherit">{pct}%</text>
              </svg>
              <div style={{ fontSize: 12, color: '#4A4A40', lineHeight: 1.4 }}>{totalUp}/{DOC_TYPES.length}<br/>docs</div>
            </div>
          )}
        </div>

        <div className="ncu-stepper">
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
                    <Field label="Full Name" fkey="fullName" type="text" placeholder="e.g. Rohan Sharma" value={form.fullName} onChange={v => set('fullName', v)} required />
                    <Field label="Email Address" fkey="email" type="email" placeholder="e.g. rohan@email.com" value={form.email} onChange={v => set('email', v)} required />
                    <Field label="Phone Number" fkey="phone" type="tel" placeholder="+44 7700 900000" value={form.phone} onChange={v => set('phone', v)} />
                    <Field label="Date of Birth" fkey="dob" type="date" placeholder="" value={form.dob} onChange={v => set('dob', v)} required />
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
                      \u26A0\uFE0F Please fix the highlighted errors above before continuing.
                    </motion.div>
                  )}

                  {kycChecking && (
                    <div style={{ marginTop: 14, fontSize: 12, color: '#6A6A5A', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>\uD83D\uDD0D</span>
                      Checking our system for existing records\u2026
                    </div>
                  )}

                  {kycChecked && existingKyc && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: 16, background: '#FFF7E6', border: '1px solid #F0C040', borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 24 }}>\u26A0\uFE0F</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#7A5A00', marginBottom: 4 }}>Customer already exists in our system</div>
                          <div style={{ fontSize: 12, color: '#4A4A40', marginBottom: 10 }}><b>{existingKyc.customerName}</b> already has a KYC credential on the network:</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                            {[['Credential ID', existingKyc.credentialId], ['Status', existingKyc.status], ['Issuer', existingKyc.issuer || 'Lloyds'], ['Expires', existingKyc.expiresOn || '\u2014']].map(([l, v]) => (
                              <div key={l} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 7, padding: '6px 10px' }}>
                                <div style={{ fontSize: 10, color: '#9A9A8A' }}>{l}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A14' }}>{v}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onNavigate('kyc_registry')}>View in KYC Registry \u2192</button>
                            <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onNavigate('ledger_explorer', { credentialId: existingKyc.credentialId, customerName: existingKyc.customerName })}>View audit trail \u2192</button>
                            <button style={{ fontSize: 11, padding: '6px 12px', borderRadius: 7, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F0C0C0', cursor: 'pointer', fontWeight: 600 }}
                              onClick={() => { setKycChecked(false); setExistingKyc(null); setForm(f => ({ ...f, fullName: '', email: '' })); }}>
                              Enter different customer
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {kycChecked && !existingKyc && step0Valid && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: 16, background: '#F0FAF4', border: '1px solid #C6E8D4', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#024731', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 20 }}>\u2705</span>
                      <div><b>New customer \u2014 not in our system yet.</b><br/><span style={{ color: '#4A4A40' }}>Proceed to upload documents and issue a new KYC credential.</span></div>
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
                    setStep(1); pushToast('Personal details saved \u2713', 'success');
                  }}>
                  Continue to documents \u2192
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
                        <div key={doc.key} className={'ncu-doc-card' + (isDone ? ' done' : isErr ? ' error' : '')}
                          onClick={() => !isUp && fileRefs.current[doc.key]?.click()}>
                          <input ref={el => fileRefs.current[doc.key] = el} type="file" accept=".pdf,.jpg,.jpeg,.png"
                            style={{ display: 'none' }} onChange={e => handleFilePick(doc.key, e.target.files[0])} />
                          <div className="ncu-doc-icon">{doc.icon}</div>
                          <div className="ncu-doc-info">
                            <div className="ncu-doc-name">{doc.label}{doc.required && <span style={{ color: '#A32D2D' }}> *</span>}</div>
                            <div className="ncu-doc-sub">
                              {isDone ? <span style={{ color: '#024731' }}>\u2713 {up.name} ({(up.size/1024).toFixed(0)} KB)</span>
                               : isUp ? <span style={{ color: '#854F0B' }}>\u23F3 Uploading...</span>
                               : isErr ? <span style={{ color: '#A32D2D' }}>\u2717 Failed \u2014 click to retry</span>
                               : doc.sub}
                            </div>
                          </div>
                          <div>
                            {isDone ? <span className="tag tag-go">\u2713 Done</span>
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
                </div>
              </section>
              <div className="ncu-actions">
                <button className="btn-ghost" onClick={() => setStep(0)}>\u2190 Back</button>
                <button className="btn-primary" disabled={!reqDone} style={{ opacity: !reqDone ? 0.5 : 1 }}
                  onClick={() => { setStep(2); pushToast('Documents verified \u2713', 'success'); }}>
                  Review &amp; submit \u2192
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <section className="block">
                <div className="block-head"><div className="block-title"><span className="block-num">03</span>Review &amp; submit</div></div>
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
                    Document hashes committed to Hyperledger Fabric. Documents stay encrypted at Lloyds \u2014 never on-chain.
                  </div>
                </div>
              </section>
              <div className="ncu-actions">
                <button className="btn-ghost" onClick={() => setStep(1)}>\u2190 Back</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '\u23F3 Submitting request...' : '\uD83D\uDCE8 Submit KYC Request to Admin'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" variants={fadeUp} initial="hidden" animate="show" style={{ textAlign: 'center', padding: '56px 0' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }} style={{ fontSize: 64, marginBottom: 20 }}>📬</motion.div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#024731', marginBottom: 8 }}>KYC Request Submitted!</div>
              <div style={{ fontSize: 14, color: '#4A4A40', marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
                Your documents for <b>{form.fullName}</b> have been received.<br/>
                An admin will review and approve or reject the request.<br/>
                <span style={{ color: '#854F0B' }}>The customer will be notified once a decision is made.</span>
              </div>
              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 10, textAlign: 'left', background: '#FFF7E6', border: '1px solid #F0D060', borderRadius: 14, padding: '18px 24px', marginBottom: 28, minWidth: 320 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>⏳</span>
                  <div style={{ fontWeight: 700, color: '#7A5A00' }}>Pending admin approval</div>
                </div>
                {[
                  ['Customer', form.fullName],
                  ['Email', form.email],
                  ['Documents uploaded', Object.keys(uploads).filter(k => uploads[k]?.status === 'done').length + ' files'],
                  ['Submitted at', new Date().toLocaleString()],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 24 }}>
                    <span style={{ color: '#9A9A8A' }}>{l}</span>
                    <span style={{ fontWeight: 600, color: '#1A1A14' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => onNavigate('admin_control_center')}>View in Admin Control Center →</button>
                <button className="btn-ghost" onClick={resetForm}>Submit another request</button>

//               <div style={{ fontSize: 14, color: '#4A4A40', marginBottom: 24 }}>
//                 Welcome to Lloyds, <b>{form.fullName}</b>. Your identity is verified once — reused everywhere.
//               </div>
//               <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8, textAlign: 'left', background: '#F2F0E6', borderRadius: 12, padding: '16px 24px', marginBottom: 28 }}>
//                 {customerId && (
//                   <>
//                     <div style={{ fontSize: 11, color: '#9A9A8A' }}>Customer ID</div>
//                     <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#024731' }}>{customerId}</div>
//                   </>
//                 )}
//                 <div style={{ fontSize: 11, color: '#9A9A8A' }}>Credential ID</div>
//                 <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#024731' }}>{credentialId}</div>
//                 <div style={{ fontSize: 11, color: '#9A9A8A', marginTop: 4 }}>Transaction Hash</div>
//                 <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#4A4A40' }}>{txHash}</div>
//               </div>
//               <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
//                 <button className="btn-primary" onClick={() => onNavigate('kyc_registry')}>View KYC Registry →</button>
//                 <button className="btn-ghost" onClick={() => {
//                   setStep(0); setUploads({});
//                   setCustomerId('');
//                   setForm({ fullName: '', email: '', phone: '', dob: '', nationality: 'British', address: '' });
//                 }}>Add another customer</button>
// >>>>>>> fabric
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
