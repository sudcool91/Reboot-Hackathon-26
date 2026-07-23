import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useStore } from '../store';
import { submitApplication, getKycRegistry } from '../services/api';

const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

const PRODUCTS = [
  { id: 'personal_loan', label: 'Personal Loan',  icon: '\uD83D\uDCB3', desc: 'Flexible personal finance up to \u00A3250,000',   maxAmount: 250000  },
  { id: 'home_loan',     label: 'Home Loan',       icon: '\uD83C\uDFE0', desc: 'Mortgage & remortgage products',                  maxAmount: 2000000 },
  { id: 'vehicle_loan',  label: 'Vehicle Loan',    icon: '\uD83D\uDE97', desc: 'Car & vehicle finance up to \u00A3100,000',       maxAmount: 100000  },
  { id: 'business_loan', label: 'Business Loan',   icon: '\uD83C\uDFE2', desc: 'SME & commercial finance up to \u00A3500,000',   maxAmount: 500000  },
  { id: 'credit_card',   label: 'Credit Card',     icon: '\uD83D\uDCB0', desc: 'Rewards & cashback credit cards',                maxAmount: 50000   },
];

const STEPS = ['Product', 'Details', 'KYC check', 'Finances', 'Review'];

/* Fallback static registry for demo — real lookup hits the API first */
const STATIC_KYC = {
  'rohan.sharma@email.com': { name: 'Rohan Sharma', credentialId: 'KYC-RS-88213', status: 'Active',        issuer: 'Lloyds',       expires: '12 Jun 2027', score: 782 },
  'priya.nair@email.com':   { name: 'Priya Nair',   credentialId: 'KYC-PN-44021', status: 'Active',        issuer: 'Partner bank', expires: '03 Apr 2027', score: 801 },
  'sara.thomas@email.com':  { name: 'Sara Thomas',  credentialId: 'KYC-ST-30187', status: 'Expiring soon', issuer: 'Lloyds',       expires: '19 Aug 2026', score: 688 },
  'meera.iyer@email.com':   { name: 'Meera Iyer',   credentialId: 'KYC-MI-55301', status: 'Active',        issuer: 'Lloyds',       expires: '15 Jan 2028', score: 741 },
};

async function lookupKyc(email) {
  const key = email.toLowerCase().trim();
  try {
    const data = await getKycRegistry();
    const rows = Array.isArray(data) ? data : (data?.credentials || []);
    const match = rows.find(r =>
      r.email?.toLowerCase() === key ||
      r.customerName?.toLowerCase().replace(/\s+/g, '.') + '@email.com' === key
    );
    if (match) {
      return {
        name:         match.customerName,
        credentialId: match.credentialId,
        status:       match.status,
        issuer:       match.issuer || 'Lloyds',
        expires:      match.expiresOn
          ? new Date(match.expiresOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'N/A',
        score: match.creditScore || null,
      };
    }
  } catch { /* fall through to static */ }
  return STATIC_KYC[key] || null;
}

const EMPTY = {
  product: '', firstName: '', lastName: '', email: '', phone: '', dob: '',
  address: '', postcode: '', employmentStatus: '', annualIncome: '',
  loanAmount: '', loanTerm: '', purpose: '', existingDebts: '', agreeTerms: false,
};

export default function CustomerApplication({ onNavigate, notifications = [] }) {
  const { pushToast } = useStore();
  const [step, setStep]             = useState(0);
  const [form, setForm]             = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(null);
  const [errors, setErrors]         = useState({});
  const [kycRecord, setKycRecord]   = useState(null);
  // 'idle' | 'checking' | 'found' | 'notfound'
  const [kycStatus, setKycStatus]   = useState('idle');
  const debounceRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const err = (k) => errors[k] && (
    <div style={{ color: '#A32D2D', fontSize: 11, marginTop: 3 }}>{errors[k]}</div>
  );

  /* ── Auto-check KYC as user types email on step 1 ─────────────── */
  useEffect(() => {
    if (step !== 1) return;
    const email = form.email.trim();
    if (!email.includes('@') || email.length < 6) {
      setKycStatus('idle');
      setKycRecord(null);
      return;
    }
    setKycStatus('checking');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const match = await lookupKyc(email);
      setKycRecord(match || null);
      setKycStatus(match ? 'found' : 'notfound');
    }, 700);
    return () => clearTimeout(debounceRef.current);
  }, [form.email, step]);

  const validate = () => {
    const e = {};
    if (step === 0 && !form.product) e.product = 'Please select a product';
    if (step === 1) {
      if (!form.firstName)  e.firstName = 'Required';
      if (!form.lastName)   e.lastName  = 'Required';
      if (!form.email || !form.email.includes('@')) e.email = 'Valid email required';
      if (!form.phone)      e.phone     = 'Required';
      if (!form.dob)        e.dob       = 'Required';
      if (!form.address)    e.address   = 'Required';
      if (!form.postcode)   e.postcode  = 'Required';
    }
    if (step === 3) {
      if (!form.annualIncome || isNaN(form.annualIncome))   e.annualIncome     = 'Enter a valid number';
      if (!form.loanAmount   || isNaN(form.loanAmount))     e.loanAmount       = 'Enter a valid amount';
      if (!form.purpose)                                    e.purpose          = 'Required';
      if (!form.employmentStatus)                           e.employmentStatus = 'Required';
    }
    if (step === 4 && !form.agreeTerms) e.agreeTerms = 'You must agree to proceed';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const detailsComplete = !!(form.firstName && form.lastName && form.email?.includes('@') &&
    form.phone && form.dob && form.address && form.postcode);

  const next = () => {
    if (!validate()) return;
    setStep(s => Math.min(s + 1, 4));
  };
  const back = () => { setStep(s => Math.max(s - 1, 0)); setErrors({}); };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const productLabel = PRODUCTS.find(p => p.id === form.product)?.label || form.product;
      const applicantName = kycRecord?.name || `${form.firstName} ${form.lastName}`;
      const payload = {
        applicantName,
        avatar:           `${form.firstName[0]}${form.lastName[0]}`.toUpperCase(),
        product:          productLabel,
        amount:           `GBP ${parseInt(form.loanAmount).toLocaleString()}`,
        kycSource:        kycRecord ? `On-chain \u00B7 ${kycRecord.issuer}` : 'New \u00B7 customer portal',
        credentialId:     kycRecord?.credentialId || null,
        creditScore:      kycRecord?.score || null,
        status:           kycRecord?.status === 'Active' ? 'Auto-eligible' : 'Pending docs',
        email:            form.email,
        phone:            form.phone,
        annualIncome:     form.annualIncome,
        employmentStatus: form.employmentStatus,
        purpose:          form.purpose,
        loanTerm:         form.loanTerm,
        existingDebts:    form.existingDebts,
        dob:              form.dob,
        address:          `${form.address}, ${form.postcode}`,
      };
      const data = await submitApplication(payload);
      setSubmitted(data || payload);
      pushToast(`\u2705 Application submitted! Ref: ${data?.applicationId || 'pending'}`);
    } catch {
      pushToast('Submission failed \u2014 please try again', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ─────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="main">
        <Navbar crumb="Customer application" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
        <div className="content" style={{ maxWidth: 560, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{ textAlign: 'center', padding: '48px 32px', background: '#FAFAF7', borderRadius: 20, border: '1px solid #E2E0D2', marginTop: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{'\u2705'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1A14', marginBottom: 8 }}>Application submitted!</div>
            <div style={{ fontSize: 14, color: '#4A4A40', marginBottom: 24 }}>
              {kycRecord
                ? 'Your on-chain KYC credential was matched \u2014 your application has been fast-tracked for review.'
                : 'Your application has been received and is now in the queue for review by a Lloyds loan officer.'}
            </div>
            {submitted.applicationId && (
              <div style={{ background: '#E2EEE7', borderRadius: 10, padding: '12px 20px', marginBottom: 24, display: 'inline-block' }}>
                <div style={{ fontSize: 11, color: '#4A4A40' }}>Reference number</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#024731', fontFamily: 'monospace' }}>{submitted.applicationId}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => { setSubmitted(null); setForm(EMPTY); setStep(0); setKycRecord(null); setKycStatus('idle'); }}>
                Submit another
              </button>
              <button className="btn-ghost" onClick={() => onNavigate('loan_applications')}>View loan queue {'\u2192'}</button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const selectedProduct = PRODUCTS.find(p => p.id === form.product);

  /* ── Main form ──────────────────────────────────────────────────── */
  return (
    <div className="main">
      <Navbar crumb="Customer application" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
      <div className="content" style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 48 }}>

        <div className="page-title-row" style={{ marginBottom: 24 }}>
          <div>
            <div className="page-title">Customer application</div>
            <div className="page-sub">
              Apply for a loan, mortgage, or credit card. Your identity is checked against our on-chain KYC network \u2014 no re-submission needed.
            </div>
          </div>
        </div>

        {/* ── Stepper ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#fff', border: '1px solid #E2E0D2', borderRadius: 14,
          padding: '12px 16px', marginBottom: 28, overflowX: 'auto', gap: 0,
        }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : '0 0 auto', minWidth: 0 }}>
              {/* circle */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, transition: 'all 0.25s',
                background: i < step ? '#0B5C3F' : i === step ? '#E2EEE7' : '#E2E0D2',
                color:      i < step ? '#fff'    : i === step ? '#024731' : '#9A9A8A',
                border:     i === step ? '2px solid #0B5C3F' : '2px solid transparent',
              }}>
                {i < step ? '\u2713' : i + 1}
              </div>
              {/* label — only visible for active or completed steps */}
              {(i === step || i < step) && (
                <div style={{
                  fontSize: 11, fontWeight: 700, marginLeft: 6,
                  color: i < step ? '#024731' : '#1A1A14', whiteSpace: 'nowrap',
                }}>
                  {s}
                </div>
              )}
              {/* connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, minWidth: 10, margin: '0 6px',
                  background: i < step ? '#0B5C3F' : '#E2E0D2', borderRadius: 2,
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial="hidden" animate="show" exit={{ opacity: 0 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>

            {/* ── STEP 0: Product selection ─────────────────────────────── */}
            {step === 0 && (
              <motion.div variants={fadeUp}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#1A1A14' }}>
                  What would you like to apply for?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                  {PRODUCTS.map(p => (
                    <div key={p.id} onClick={() => set('product', p.id)} style={{
                      padding: '18px 16px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
                      border: `2px solid ${form.product === p.id ? '#0B5C3F' : '#E2E0D2'}`,
                      background: form.product === p.id ? '#E2EEE7' : '#FAFAF7',
                      boxShadow: form.product === p.id ? '0 0 0 3px rgba(11,92,63,0.1)' : 'none',
                    }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A14' }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: '#6A6A5A', marginTop: 4 }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
                {err('product')}
              </motion.div>
            )}

            {/* ── STEP 1: Personal details ──────────────────────────────── */}
            {step === 1 && (
              <motion.div variants={fadeUp}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Your personal details</div>
                <div style={{ fontSize: 13, color: '#6A6A5A', marginBottom: 20 }}>
                  Fill in your details \u2014 we check our KYC network <b>live as you type your email</b>, so you know instantly if you need documents.
                </div>
                <div className="ncu-form-grid">
                  {[
                    { label: 'First name',    key: 'firstName', type: 'text',  placeholder: 'John' },
                    { label: 'Last name',     key: 'lastName',  type: 'text',  placeholder: 'Smith' },
                    { label: 'Date of birth', key: 'dob',       type: 'date',  placeholder: '' },
                    { label: 'Phone number',  key: 'phone',     type: 'tel',   placeholder: '+44 7700 900000' },
                    { label: 'Postcode',      key: 'postcode',  type: 'text',  placeholder: 'SW1A 1AA' },
                  ].map(f => (
                    <div key={f.key} className="ncu-field">
                      <label className="ncu-label">{f.label}</label>
                      <input className="ncu-input" type={f.type} placeholder={f.placeholder}
                        value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
                      {err(f.key)}
                    </div>
                  ))}

                  {/* Email — full width with inline KYC status pill */}
                  <div className="ncu-field" style={{ gridColumn: '1/-1' }}>
                    <label className="ncu-label">Email address</label>
                    <div style={{ position: 'relative' }}>
                      <input className="ncu-input" type="email" placeholder="john@example.com"
                        value={form.email} onChange={e => set('email', e.target.value)}
                        style={{ paddingRight: 148 }} />
                      {kycStatus !== 'idle' && (
                        <div style={{
                          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                          pointerEvents: 'none',
                          background: kycStatus === 'checking' ? '#F0EFE6' : kycStatus === 'found' ? '#E2EEE7' : '#FFF7E6',
                          color:      kycStatus === 'checking' ? '#6A6A5A' : kycStatus === 'found' ? '#024731' : '#854F0B',
                          border:     kycStatus === 'checking' ? '1px solid #E2E0D2' : kycStatus === 'found' ? '1px solid #C6E8D4' : '1px solid #F0C040',
                          whiteSpace: 'nowrap',
                        }}>
                          {kycStatus === 'checking' ? '\uD83D\uDD0D Checking\u2026' : kycStatus === 'found' ? '\u2705 KYC found' : '\uD83D\uDCCB Not on-chain'}
                        </div>
                      )}
                    </div>
                    {err('email')}
                  </div>

                  <div className="ncu-field" style={{ gridColumn: '1/-1' }}>
                    <label className="ncu-label">Home address</label>
                    <input className="ncu-input" type="text" placeholder="123 High Street, London"
                      value={form.address} onChange={e => set('address', e.target.value)} />
                    {err('address')}
                  </div>
                </div>

                {/* Live KYC result banner */}
                <AnimatePresence>
                  {kycStatus === 'found' && kycRecord && (
                    <motion.div key="found" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ marginTop: 16, padding: '16px 20px', borderRadius: 12,
                               background: 'linear-gradient(135deg,#024731,#0B5C3F)', color: '#fff',
                               display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 26, flexShrink: 0 }}>{'\u2705'}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>KYC credential found on-chain!</div>
                        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>
                          <b>{kycRecord.name}</b> {'\u00B7'} {kycRecord.credentialId} {'\u00B7'} {kycRecord.issuer} {'\u00B7'} expires {kycRecord.expires}
                          {kycRecord.score && <span> {'\u00B7'} credit score <b>{kycRecord.score}</b></span>}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                          No document uploads needed \u2014 identity already verified {'\u26A1'}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {kycStatus === 'notfound' && (
                    <motion.div key="notfound" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12,
                               background: '#FFF7E6', border: '1px solid #F0C040',
                               fontSize: 12, color: '#854F0B', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{'\uD83D\uDCCB'}</span>
                      <span>No on-chain KYC found for this email. Your application will proceed \u2014 a Lloyds officer will verify your identity manually.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── STEP 2: KYC verification result ──────────────────────── */}
            {step === 2 && (
              <motion.div variants={fadeUp}>
                {kycRecord ? (
                  <div>
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: 'linear-gradient(135deg,#024731 0%,#0B5C3F 100%)', borderRadius: 16, padding: '28px 24px', marginBottom: 24, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                          {'\u2705'}
                        </div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800 }}>Identity already verified!</div>
                          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
                            Your KYC credential was found on our network \u2014 no documents needed
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[['Credential ID', kycRecord.credentialId], ['Verified by', kycRecord.issuer], ['Status', kycRecord.status], ['Expires', kycRecord.expires]].map(([l, v]) => (
                          <div key={l} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px' }}>
                            <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 2 }}>{l}</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {kycRecord.score && (
                      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        style={{ background: '#F0FAF4', border: '1px solid #C6E8D4', borderRadius: 14, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'center', minWidth: 64 }}>
                          <div style={{ fontSize: 28, fontWeight: 900, color: kycRecord.score >= 750 ? '#024731' : kycRecord.score >= 650 ? '#854F0B' : '#A32D2D' }}>
                            {kycRecord.score}
                          </div>
                          <div style={{ fontSize: 10, color: '#4A4A40' }}>credit score</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A14' }}>
                            {kycRecord.score >= 750
                              ? `${'\uD83C\uDFC6'} Excellent \u2014 likely eligible for best rates`
                              : kycRecord.score >= 650
                              ? `${'\uD83D\uDC4D'} Good \u2014 eligible for most products`
                              : `${'\u26A0\uFE0F'} Fair \u2014 some products may require manual review`}
                          </div>
                          <div style={{ fontSize: 11, color: '#6A6A5A', marginTop: 3 }}>
                            Matched from your on-chain credential \u2014 no credit search performed yet
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                      style={{ background: '#FAFAF7', border: '1px solid #E2E0D2', borderRadius: 14, padding: '16px 20px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>What this means for you</div>
                      {[
                        ['\u26A1', 'Fast-tracked application',  'Your identity is pre-verified \u2014 no document uploads required'],
                        ['\uD83D\uDD12', 'Privacy preserved',   'Only a cryptographic hash is stored on-chain \u2014 never your documents'],
                        ['\uD83C\uDFE6', 'Cross-bank acceptance', `Your credential (issued by ${kycRecord.issuer}) is trusted across the Lloyds DLT network`],
                      ].map(([icon, title, desc]) => (
                        <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                          <span style={{ fontSize: 18 }}>{icon}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A14' }}>{title}</div>
                            <div style={{ fontSize: 11, color: '#6A6A5A', marginTop: 1 }}>{desc}</div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                ) : (
                  <div>
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: '#FFF7E6', border: '1px solid #F0C040', borderRadius: 16, padding: '24px 20px', marginBottom: 20 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 32 }}>{'\uD83D\uDCCB'}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: '#1A1A14', marginBottom: 6 }}>No existing KYC found</div>
                          <div style={{ fontSize: 13, color: '#4A4A40', lineHeight: 1.6 }}>
                            No verified identity credential was found for <b>{form.email}</b>. Your application will proceed \u2014 a Lloyds officer will verify your identity manually.
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    <div style={{ background: '#FAFAF7', border: '1px solid #E2E0D2', borderRadius: 14, padding: '16px 20px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>What happens next</div>
                      {[
                        ['\uD83D\uDCDD', 'Complete this application', 'Fill in your financial details and submit'],
                        ['\uD83D\uDD0E', 'Upload documents',           'A Lloyds officer will request ID and proof of address'],
                        ['\uD83D\uDEE1\uFE0F', 'KYC issued on-chain', 'Once verified, your credential is minted \u2014 future applications are instant'],
                      ].map(([icon, title, desc]) => (
                        <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                          <span style={{ fontSize: 18 }}>{icon}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A14' }}>{title}</div>
                            <div style={{ fontSize: 11, color: '#6A6A5A', marginTop: 1 }}>{desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 3: Financial info ────────────────────────────────── */}
            {step === 3 && (
              <motion.div variants={fadeUp}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Financial information</div>
                <div style={{ fontSize: 13, color: '#6A6A5A', marginBottom: 20 }}>
                  Tell us about your finances for the <b>{selectedProduct?.label}</b>
                  {form.loanAmount && ` of \u00A3${parseInt(form.loanAmount).toLocaleString()}`}.
                </div>

                {kycRecord && (
                  <div style={{ background: '#E2EEE7', borderRadius: 10, padding: '8px 14px', marginBottom: 20, fontSize: 12, color: '#024731', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {'\u2705'} <span><b>KYC verified</b> {'\u00B7'} {kycRecord.credentialId} {'\u00B7'} Credit score {kycRecord.score}</span>
                  </div>
                )}

                <div className="ncu-form-grid">
                  <div className="ncu-field">
                    <label className="ncu-label">Employment status</label>
                    <select className="ncu-input" value={form.employmentStatus} onChange={e => set('employmentStatus', e.target.value)}>
                      <option value="">Select{'\u2026'}</option>
                      {['Full-time employed', 'Part-time employed', 'Self-employed', 'Director / Business owner', 'Retired', 'Student', 'Unemployed'].map(o => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                    {err('employmentStatus')}
                  </div>
                  <div className="ncu-field">
                    <label className="ncu-label">Annual income (\u00A3)</label>
                    <input className="ncu-input" type="number" placeholder="45000"
                      value={form.annualIncome} onChange={e => set('annualIncome', e.target.value)} />
                    {err('annualIncome')}
                  </div>
                  <div className="ncu-field">
                    <label className="ncu-label">
                      {form.product === 'credit_card' ? 'Desired credit limit (\u00A3)' : 'Loan amount (\u00A3)'}
                    </label>
                    <input className="ncu-input" type="number"
                      placeholder={selectedProduct ? String(Math.round(selectedProduct.maxAmount * 0.1)) : '25000'}
                      value={form.loanAmount} onChange={e => set('loanAmount', e.target.value)} />
                    {selectedProduct && (
                      <div style={{ fontSize: 10, color: '#9A9A8A', marginTop: 3 }}>
                        Max: \u00A3{selectedProduct.maxAmount.toLocaleString()}
                      </div>
                    )}
                    {err('loanAmount')}
                  </div>
                  {form.product !== 'credit_card' && (
                    <div className="ncu-field">
                      <label className="ncu-label">Loan term</label>
                      <select className="ncu-input" value={form.loanTerm} onChange={e => set('loanTerm', e.target.value)}>
                        <option value="">Select{'\u2026'}</option>
                        {[12, 24, 36, 48, 60, 84, 120, 180, 240, 300, 360].map(o => (
                          <option key={o} value={o}>{o} months ({Math.round(o / 12)} yr{o > 12 ? 's' : ''})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="ncu-field" style={{ gridColumn: '1/-1' }}>
                    <label className="ncu-label">Purpose / reason</label>
                    <textarea className="ncu-input" rows={3}
                      placeholder={`e.g. Home renovation, debt consolidation, new vehicle\u2026`}
                      value={form.purpose} onChange={e => set('purpose', e.target.value)}
                      style={{ resize: 'vertical' }} />
                    {err('purpose')}
                  </div>
                  <div className="ncu-field">
                    <label className="ncu-label">Existing monthly debt repayments (\u00A3, optional)</label>
                    <input className="ncu-input" type="number" placeholder="500"
                      value={form.existingDebts} onChange={e => set('existingDebts', e.target.value)} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Review & submit ───────────────────────────────── */}
            {step === 4 && (
              <motion.div variants={fadeUp}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Review your application</div>

                <div style={{
                  padding: '14px 18px', borderRadius: 12, marginBottom: 16,
                  background: kycRecord ? '#E2EEE7' : '#FFF7E6',
                  border: `1px solid ${kycRecord ? '#C6E8D4' : '#F0C040'}`,
                  display: 'flex', gap: 12, alignItems: 'center',
                }}>
                  <span style={{ fontSize: 22 }}>{kycRecord ? '\uD83D\uDEE1\uFE0F' : '\uD83D\uDCCB'}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A14' }}>
                      {kycRecord
                        ? `KYC verified \u00B7 ${kycRecord.credentialId}`
                        : 'KYC pending \u2014 manual verification required'}
                    </div>
                    <div style={{ fontSize: 11, color: '#4A4A40', marginTop: 2 }}>
                      {kycRecord
                        ? `Issued by ${kycRecord.issuer} \u00B7 expires ${kycRecord.expires} \u00B7 this application will be fast-tracked`
                        : 'A Lloyds officer will contact you to complete identity verification'}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F2F0E6', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
                  {[
                    ['Product',       PRODUCTS.find(p => p.id === form.product)?.label],
                    ['Full name',     kycRecord?.name || `${form.firstName} ${form.lastName}`],
                    ['Email',         form.email],
                    ['Phone',         form.phone],
                    ['Date of birth', form.dob],
                    ['Address',       `${form.address}, ${form.postcode}`],
                    ['Employment',    form.employmentStatus],
                    ['Annual income', form.annualIncome ? `\u00A3${parseInt(form.annualIncome).toLocaleString()}` : '\u2014'],
                    [form.product === 'credit_card' ? 'Credit limit' : 'Loan amount',
                      form.loanAmount ? `\u00A3${parseInt(form.loanAmount).toLocaleString()}` : '\u2014'],
                    form.loanTerm ? ['Loan term', `${form.loanTerm} months`] : null,
                    ['Purpose', form.purpose],
                  ].filter(Boolean).map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #E2E0D2' }}>
                      <span style={{ fontSize: 12, color: '#6A6A5A' }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A14', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                    </div>
                  ))}
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 12, color: '#4A4A40' }}>
                  <input type="checkbox" checked={form.agreeTerms} onChange={e => set('agreeTerms', e.target.checked)} style={{ marginTop: 2 }} />
                  I confirm all information is accurate and agree to Lloyds Banking Group&apos;s Terms &amp; Conditions and Privacy Policy.
                </label>
                {err('agreeTerms')}
              </motion.div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Navigation buttons ── */}
        <div className="ncu-actions" style={{ marginTop: 32 }}>
          {step > 0 && (
            <button className="btn-ghost" onClick={back}>{'\u2190'} Back</button>
          )}
          {step < 4 ? (
            <button
              className="btn-primary"
              onClick={next}
              disabled={
                (step === 0 && !form.product) ||
                (step === 1 && (!detailsComplete || kycStatus === 'checking'))
              }
              title={
                step === 1 && kycStatus === 'checking' ? 'Waiting for KYC check\u2026' :
                step === 1 && !detailsComplete ? 'Please fill all required fields' : ''
              }
            >
              {step === 1 && kycStatus === 'checking'
                ? `${'\uD83D\uDD0D'} Checking KYC\u2026`
                : step === 1 && kycStatus === 'found'
                ? `${'\u2705'} KYC found \u2014 Continue ${'\u2192'}`
                : `Continue ${'\u2192'}`}
            </button>
          ) : (
            <button className="btn-primary" onClick={submit} disabled={submitting || !form.agreeTerms}>
              {submitting
                ? `Submitting\u2026`
                : kycRecord
                ? `${'\u26A1'} Submit (fast-tracked)`
                : 'Submit application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
