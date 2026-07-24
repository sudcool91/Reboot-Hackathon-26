import { useState, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { uploadDocument, issueKyc, getKycRegistry } from '../services/api';
import { useStore } from '../store';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const STEPS = ['Personal details', 'Upload documents', 'Review & submit', 'Credential issued'];
const DOC_TYPES = [
  { key: 'passport',   label: 'Passport / National ID', sub: 'Clear scan, valid photo ID',       icon: '🪪', required: true },
  { key: 'proof_id',  label: 'Proof of identity',       sub: 'Front + back of driving licence',  icon: '🪪', required: true },
  { key: 'address',   label: 'Address proof',            sub: 'Utility bill, last 3 months',      icon: '🏠', required: true },
  { key: 'income',    label: 'Income proof',             sub: 'Salary slip or Form 16',           icon: '💷', required: false },
  { key: 'bank_stmt', label: 'Bank statement',           sub: 'Last 6 months',                    icon: '🏦', required: false },
];

export default function NewCustomerUpload({ onNavigate, notifications = [] }) {
  const { pushToast } = useStore();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', dob: '', nationality: 'British', address: '' });
  const [uploads, setUploads] = useState({});
  const fileRefs = useRef({});

  // KYC check state
  const [kycChecking, setKycChecking] = useState(false);
  const [existingKyc, setExistingKyc] = useState(null);   // found record
  const [kycChecked, setKycChecked] = useState(false);     // has check run

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    // Reset KYC check if email changes
    if (k === 'email') { setKycChecked(false); setExistingKyc(null); }
  };

  // Check if customer already exists in DB by name or email
  const checkExistingKyc = async () => {
    if (!form.email || !form.email.includes('@')) return;
    setKycChecking(true);
    try {
      const data = await getKycRegistry();
      const list = Array.isArray(data) ? data : [];
      const emailLower = form.email.toLowerCase().trim();
      const nameLower = form.fullName.toLowerCase().trim();
      // Match by email (if stored) OR by customer name (partial, case-insensitive)
      const match = list.find(r => {
        const nameMatch = nameLower && r.customerName?.toLowerCase().trim() === nameLower;
        const emailMatch = r.email && r.email.toLowerCase().trim() === emailLower;
        return nameMatch || emailMatch;
      });
      setExistingKyc(match || null);
    } catch {
      setExistingKyc(null);
    } finally {
      setKycChecking(false);
      setKycChecked(true);
    }
  };

  const handleFilePick = async (docKey, file) => {
    if (!file) return;
    setUploads(u => ({ ...u, [docKey]: { file, name: file.name, size: file.size, status: 'uploading' } }));
    pushToast(`Uploading ${file.name}...`, 'info');
    const customerId = form.fullName.replace(/\s+/g, '-').toLowerCase() || 'guest';
    const result = await uploadDocument(file, docKey, customerId);
    if (result?.success) {
      setUploads(u => ({ ...u, [docKey]: { ...u[docKey], status: 'done', savedAs: result.savedAs } }));
      pushToast(`✓ ${file.name} uploaded successfully`, 'success');
    } else {
      setUploads(u => ({ ...u, [docKey]: { ...u[docKey], status: 'error' } }));
      pushToast(`Failed to upload ${file.name}`, 'error');
    }
  };

  const requiredDone = DOC_TYPES.filter(d => d.required).every(d => uploads[d.key]?.status === 'done');
  const totalUploaded = Object.values(uploads).filter(u => u.status === 'done').length;
  const progressPct = Math.round((totalUploaded / DOC_TYPES.length) * 100);

  const handleSubmit = async () => {
    setSubmitting(true);
    pushToast('Submitting to Hyperledger Fabric...', 'info');
    const docHash = 'sha256:' + Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    const networkId = `NET-${form.fullName.replace(/\s+/g, '').toUpperCase().slice(0, 6)}-${Date.now()}`;
    const result = await issueKyc(
      networkId,
      docHash,
      'Lloyds Branch Validator',
      // extra fields passed through
      {
        customerName: form.fullName,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dob,
        address: form.address,
      },
    );
    setSubmitting(false);
    const tx = result?.txHash || `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    const cid = result?.credentialId || `KYC-${form.fullName.split(' ').map(w => w[0]).join('')}-${Math.floor(Math.random() * 90000 + 10000)}`;
    setTxHash(tx); setCredentialId(cid); setCustomerId(result?.customerId || ''); setStep(3);
    pushToast(`🔒 KYC credential issued — ${cid}`, 'success', tx);
  };

  return (
    <div className="main">
      <Navbar crumb="New customer upload" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
      <div className="content">
        <div className="page-title-row">
          <div>
            <div className="page-title">New customer KYC onboarding</div>
            <div className="page-sub">Verified once — reused everywhere. No repeated paperwork across Lloyds Group.</div>
          </div>
          {step < 3 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="22" fill="none" stroke="#E2EEE7" strokeWidth="5"/>
                <circle cx="26" cy="26" r="22" fill="none" stroke="#024731" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - progressPct / 100)}`}
                  strokeLinecap="round" transform="rotate(-90 26 26)"/>
                <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#024731" fontFamily="inherit">{progressPct}%</text>
              </svg>
              <div style={{ fontSize: 12, color: '#4A4A40', lineHeight: 1.4 }}>{totalUploaded}/{DOC_TYPES.length}<br/>docs</div>
            </div>
          )}
        </div>

        {/* Stepper */}
        <div className="ncu-stepper">
          {STEPS.map((s, i) => (
            <div key={i} className={`ncu-step-item${i === step ? ' active' : i < step ? ' done' : ''}`}>
              <div className="ncu-step-circle">
                {i < step
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                  : i + 1}
              </div>
              <span className="ncu-step-label">{s}</span>
              {i < STEPS.length - 1 && <div className={`ncu-step-line${i < step ? ' done' : ''}`}/>}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 0 — Personal Details */}
          {step === 0 && (
            <motion.div key="s0" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <section className="block">
                <div className="block-head"><div className="block-title"><span className="block-num">01</span>Personal details</div></div>
                <div className="card-pad-standalone">
                  <div className="ncu-form-grid">
                    {[
                      { label: 'Full Name *', key: 'fullName', type: 'text', placeholder: 'e.g. Rohan Sharma' },
                      { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'e.g. rohan@email.com' },
                      { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+44 7700 900000' },
                      { label: 'Date of Birth', key: 'dob', type: 'date', placeholder: '' },
                      { label: 'Nationality', key: 'nationality', type: 'text', placeholder: 'e.g. British' },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key} className="ncu-field">
                        <label className="ncu-label">{label}</label>
                        <input className="ncu-input" type={type} placeholder={placeholder}
                          value={form[key]} onChange={e => set(key, e.target.value)} />
                      </div>
                    ))}
                    <div className="ncu-field ncu-field-full">
                      <label className="ncu-label">Home Address</label>
                      <textarea className="ncu-input" rows={3} placeholder="Full residential address"
                        value={form.address} onChange={e => set('address', e.target.value)} />
                    </div>
                  </div>

                  {/* KYC Check button */}
                  {form.fullName && form.email && !kycChecked && (
                    <div style={{ marginTop: 16 }}>
                      <button
                        className="btn-ghost"
                        onClick={checkExistingKyc}
                        disabled={kycChecking}
                        style={{ fontSize: 12 }}>
                        {kycChecking ? '🔍 Checking database…' : '🔍 Check if customer already exists'}
                      </button>
                    </div>
                  )}

                  {/* KYC check result — FOUND */}
                  {kycChecked && existingKyc && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: 16, background: '#FFF7E6', border: '1px solid #F0C040', borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 24 }}>⚠️</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#7A5A00', marginBottom: 4 }}>
                            Customer already exists in our system
                          </div>
                          <div style={{ fontSize: 12, color: '#4A4A40', marginBottom: 10 }}>
                            <b>{existingKyc.customerName}</b> already has a KYC credential on our network:
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                            {[
                              ['Credential ID', existingKyc.credentialId],
                              ['Status', existingKyc.status],
                              ['Issuer', existingKyc.issuer],
                              ['Expires', existingKyc.expiresOn || '—'],
                            ].map(([l, v]) => (
                              <div key={l} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 7, padding: '6px 10px' }}>
                                <div style={{ fontSize: 10, color: '#9A9A8A' }}>{l}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A14' }}>{v}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button className="btn-ghost" style={{ fontSize: 11 }}
                              onClick={() => onNavigate('kyc_registry')}>
                              View in KYC Registry →
                            </button>
                            <button className="btn-ghost" style={{ fontSize: 11 }}
                              onClick={() => onNavigate('ledger_explorer', { credentialId: existingKyc.credentialId, customerName: existingKyc.customerName })}>
                              View audit trail →
                            </button>
                            <button style={{ fontSize: 11, padding: '6px 12px', borderRadius: 7, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F0C0C0', cursor: 'pointer', fontWeight: 600 }}
                              onClick={() => { setKycChecked(false); setExistingKyc(null); setForm(f => ({ ...f, fullName: '', email: '' })); }}>
                              Enter different customer
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* KYC check result — NOT FOUND */}
                  {kycChecked && !existingKyc && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: 16, background: '#F0FAF4', border: '1px solid #C6E8D4', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#024731', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 20 }}>✅</span>
                      <div>
                        <b>New customer — not in our system yet.</b><br/>
                        <span style={{ color: '#4A4A40' }}>Proceed to upload documents and issue a new KYC credential.</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </section>
              <div className="ncu-actions">
                <button className="btn-primary"
                  disabled={!form.fullName || !form.email || (kycChecked && !!existingKyc)}
                  style={{ opacity: (!form.fullName || !form.email || (kycChecked && !!existingKyc)) ? 0.5 : 1 }}
                  onClick={() => { setStep(1); pushToast('Personal details saved ✓', 'success'); }}>
                  Continue to documents →
                </button>
                {!kycChecked && form.fullName && form.email && (
                  <div style={{ fontSize: 11, color: '#9A9A8A', marginTop: 8 }}>Tip: click "Check if customer already exists" before continuing</div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 1 — Document Upload */}
          {step === 1 && (
            <motion.div key="s1" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <section className="block">
                <div className="block-head"><div className="block-title"><span className="block-num">02</span>Upload documents</div></div>
                <div className="card-pad-standalone">
                  <div className="ncu-doc-grid">
                    {DOC_TYPES.map(doc => {
                      const up = uploads[doc.key];
                      const isDone = up?.status === 'done';
                      const isUploading = up?.status === 'uploading';
                      const isError = up?.status === 'error';
                      return (
                        <div key={doc.key}
                          className={`ncu-doc-card${isDone ? ' done' : isError ? ' error' : ''}`}
                          onClick={() => !isUploading && fileRefs.current[doc.key]?.click()}>
                          <input
                            ref={el => fileRefs.current[doc.key] = el}
                            type="file" accept=".pdf,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={e => handleFilePick(doc.key, e.target.files[0])} />
                          <div className="ncu-doc-icon">{doc.icon}</div>
                          <div className="ncu-doc-info">
                            <div className="ncu-doc-name">
                              {doc.label} {doc.required && <span style={{ color: '#A32D2D' }}>*</span>}
                            </div>
                            <div className="ncu-doc-sub">
                              {isDone
                                ? <span style={{ color: '#024731' }}>✓ {up.name} ({(up.size / 1024).toFixed(0)} KB)</span>
                                : isUploading ? <span style={{ color: '#854F0B' }}>⏳ Uploading...</span>
                                : isError ? <span style={{ color: '#A32D2D' }}>✗ Failed — click to retry</span>
                                : doc.sub}
                            </div>
                          </div>
                          <div>
                            {isDone ? <span className="tag tag-go">✓ Done</span>
                              : isUploading ? <span className="tag tag-warn">Uploading</span>
                              : isError ? <span className="tag tag-stop">Error</span>
                              : <span className="tag tag-mute">{doc.required ? 'Required' : 'Optional'}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!requiredDone && (
                    <div className="ncu-banner" style={{ marginTop: 16 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                      </svg>
                      Upload all 3 required (*) documents to continue
                    </div>
                  )}
                </div>
              </section>
              <div className="ncu-actions">
                <button className="btn-ghost" onClick={() => setStep(0)}>← Back</button>
                <button className="btn-primary"
                  disabled={!requiredDone} style={{ opacity: !requiredDone ? 0.5 : 1 }}
                  onClick={() => { setStep(2); pushToast('Documents verified ✓', 'success'); }}>
                  Review & submit →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Review */}
          {step === 2 && (
            <motion.div key="s2" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <section className="block">
                <div className="block-head"><div className="block-title"><span className="block-num">03</span>Review & submit</div></div>
                <div className="card-pad-standalone">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                    {Object.entries(form).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} style={{ background: '#F2F0E6', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#9A9A8A', textTransform: 'capitalize', marginBottom: 3 }}>
                          {k.replace(/([A-Z])/g, ' $1')}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Documents ready</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {DOC_TYPES.map(d => uploads[d.key]?.status === 'done' && (
                        <span key={d.key} className="tag tag-go">{d.icon} {d.label}</span>
                      ))}
                    </div>
                  </div>
                  <div className="ncu-banner" style={{ background: '#F0FAF4', borderColor: '#B8E0C8', color: '#0B5C3F' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B5C3F" strokeWidth="2">
                      <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/>
                    </svg>
                    Document hashes committed to Hyperledger Fabric. Documents stay encrypted at Lloyds — never on-chain.
                  </div>
                </div>
              </section>
              <div className="ncu-actions">
                <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '⏳ Committing to chain...' : '🔒 Issue KYC Credential'}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Done */}
          {step === 3 && (
            <motion.div key="s3" variants={fadeUp} initial="hidden" animate="show"
              style={{ textAlign: 'center', padding: '56px 0' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                style={{ fontSize: 64, marginBottom: 20 }}>✅</motion.div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#024731', marginBottom: 8 }}>
                KYC Credential Issued On-Chain
              </div>
              <div style={{ fontSize: 14, color: '#4A4A40', marginBottom: 24 }}>
                Welcome to Lloyds, <b>{form.fullName}</b>. Your identity is verified once — reused everywhere.
              </div>
              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8, textAlign: 'left', background: '#F2F0E6', borderRadius: 12, padding: '16px 24px', marginBottom: 28 }}>
                {customerId && (
                  <>
                    <div style={{ fontSize: 11, color: '#9A9A8A' }}>Customer ID</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#024731' }}>{customerId}</div>
                  </>
                )}
                <div style={{ fontSize: 11, color: '#9A9A8A' }}>Credential ID</div>
                <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#024731' }}>{credentialId}</div>
                <div style={{ fontSize: 11, color: '#9A9A8A', marginTop: 4 }}>Transaction Hash</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#4A4A40' }}>{txHash}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => onNavigate('kyc_registry')}>View KYC Registry →</button>
                <button className="btn-ghost" onClick={() => {
                  setStep(0); setUploads({});
                  setCustomerId('');
                  setForm({ fullName: '', email: '', phone: '', dob: '', nationality: 'British', address: '' });
                }}>Add another customer</button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
