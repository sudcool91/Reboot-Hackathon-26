import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useStore } from '../store';
import { submitApplication, getKycRegistry, getShareRequestsByEmail, submitShareRequest, getKycRequestsByEmail } from '../services/api';

/* Helper: find an active KYC record for an email from the registry */
async function lookupKyc(email) {
  try {
    const data = await getKycRegistry();
    const list = Array.isArray(data) ? data : (data?.records || []);
    return list.find(r => r.email?.toLowerCase() === email?.toLowerCase()) || null;
  } catch {
    return null;
  }
}

const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

const EMPTY = {
  product: '',
  bank: '',
  shareConsent: false,
  amount: '',
  purpose: '',
  employmentStatus: '',
  term: '',
};

const STEPS = ['Product', 'Bank & Consent', 'Loan Details', 'Review'];

const PRODUCTS = [
  { id: 'personal_loan', label: 'Personal Loan', icon: '💳', desc: 'Flexible personal finance up to £250,000', maxAmount: 250000 },
  { id: 'home_loan', label: 'Home Loan', icon: '🏠', desc: 'Mortgage & remortgage products', maxAmount: 2000000 },
  { id: 'vehicle_loan', label: 'Vehicle Loan', icon: '🚗', desc: 'Car & vehicle finance up to £100,000', maxAmount: 100000 },
  { id: 'business_loan', label: 'Business Loan', icon: '🏢', desc: 'SME & commercial finance up to £500,000', maxAmount: 500000 },
  { id: 'credit_card', label: 'Credit Card (based on your credit score)', icon: '💰', desc: 'Rewards & cashback credit cards', maxAmount: 50000 },
];

const LBG_BANKS = ['Lloyds Bank', 'Halifax', 'Bank of Scotland', 'Scottish Widows', 'MBNA', 'Black Horse', 'Lex Autolease', 'Lloyds Wealth'];
const DEFAULT_DOB = '1990-01-01';

/* ── Future scope products ──────────────────────────────────── */
const FUTURE_PRODUCTS = [
  {
    id: 'digital_will',
    label: 'Digital Will',
    icon: '📜',
    color: '#6B46C1',
    lightBg: '#F5F0FF',
    border: '#D8C8FF',
    tag: 'Smart Contracts',
    headline: 'Your will, immutable on-chain',
    desc: 'Create and store a legally binding digital will on the Hyperledger Fabric network. Assets, beneficiaries, and conditions are encoded as smart contracts — automatically executed upon verified proof of death, with no intermediary required.',
    benefits: ['Zero probate delays', 'Tamper-proof on-chain storage', 'Auto-execution via smart contract', 'Multi-signature beneficiary approval'],
    techStack: 'Hyperledger Fabric · Smart Contracts · ZK Proofs',
  },
  {
    id: 'fraud_protection',
    label: 'Fraud & Scam Protection',
    icon: '🛡️',
    color: '#DC2626',
    lightBg: '#FFF5F5',
    border: '#FFCDD0',
    tag: 'AI + DLT',
    headline: 'Real-time AI fraud shield on the ledger',
    desc: 'Every transaction is analysed in real-time against a federated fraud model trained across all LBG entities — without ever sharing raw customer data. Suspicious patterns are flagged on-chain and instantly frozen, with a full audit trail.',
    benefits: ['Sub-100ms fraud detection', 'Privacy-preserving federated AI', 'Cross-bank anomaly correlation', 'Immutable incident ledger'],
    techStack: 'Federated ML · Hyperledger · Real-time streams',
  },
  {
    id: 'fixed_deposits',
    label: 'Fixed Deposits (FDs)',
    icon: '🏦',
    color: '#059669',
    lightBg: '#F0FBF6',
    border: '#B8E8D0',
    tag: 'KYC-Enabled Banking',
    headline: 'FDs without re-KYC across Lloyds Group',
    desc: 'Standard fixed deposits offered by Lloyds Banking Group — no blockchain issuance. The innovation is that your KYC Credential is reused automatically, so you can open FDs across any LBG entity instantly without submitting documents again.',
    benefits: ['Zero re-KYC friction', 'Instant cross-entity FD opening', 'Reusable KYC Credential', 'Standard FD rates & FSCS protection'],
    techStack: 'Hyperledger Fabric · KYC Credentials · Reusable Identity',
  },
  {
    id: 'corporate_bonds',
    label: 'Corporate Bonds',
    icon: '📈',
    color: '#1D4ED8',
    lightBg: '#EFF6FF',
    border: '#BFDBFE',
    tag: 'KYC-Enabled Capital Markets',
    headline: 'Corporate bonds with KYC-powered onboarding',
    desc: 'Standard Lloyds Banking Group corporate bonds — not issued on Fabric. The DLT innovation is in compliance: your reusable KYC Credential eliminates the lengthy investor onboarding process, allowing instant verification across bond issuances.',
    benefits: ['No re-KYC per issuance', 'Instant investor onboarding', 'Reusable KYC Credential', 'Standard bond terms & FCA compliance'],
    techStack: 'Hyperledger Fabric · KYC Credentials · ISO 20022',
  },
];

/* ── Future product popup component (light premium) ─── */
function FutureProductModal({ product, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,8,4,0.82)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 560, borderRadius: 24, overflow: 'hidden', background: '#0D1F17', border: `1px solid ${product.color}40`, boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 60px ${product.color}15, 0 0 0 1px ${product.color}20` }}
        >
          {/* Animated top glow bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${product.color}, ${product.color}88, transparent)` }} />

          {/* Header — dark with SVG blockchain deco */}
          <div style={{ padding: '28px 28px 20px', background: `linear-gradient(135deg, #0D1F17, #111D14)`, position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${product.color}25` }}>
            {/* Concentric circles deco */}
            <svg style={{ position: 'absolute', right: -30, top: -30, opacity: 0.12 }} width="220" height="220" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r="100" fill="none" stroke={product.color} strokeWidth="1"/>
              <circle cx="110" cy="110" r="72"  fill="none" stroke={product.color} strokeWidth="0.8"/>
              <circle cx="110" cy="110" r="44"  fill="none" stroke={product.color} strokeWidth="0.6"/>
              <circle cx="110" cy="110" r="18"  fill={product.color} opacity="0.4"/>
              {/* Node connectors */}
              {[0,60,120,180,240,300].map((deg,i) => {
                const rad = (deg * Math.PI) / 180;
                const x = 110 + 100 * Math.cos(rad); const y = 110 + 100 * Math.sin(rad);
                return <circle key={i} cx={x} cy={y} r="4" fill={product.color} opacity="0.6"/>;
              })}
            </svg>

            {/* BLOCKCHAIN badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${product.color}18`, border: `1px solid ${product.color}40`, borderRadius: 20, padding: '3px 12px', marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: product.color, display: 'inline-block', boxShadow: `0 0 6px ${product.color}` }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: product.color, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{product.tag} · Hyperledger Fabric</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <motion.div
                  animate={{ boxShadow: [`0 0 12px ${product.color}40`, `0 0 28px ${product.color}80`, `0 0 12px ${product.color}40`] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: 60, height: 60, borderRadius: 18, background: `linear-gradient(135deg, ${product.color}22, ${product.color}10)`, border: `1.5px solid ${product.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}
                >
                  {product.icon}
                </motion.div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#F0FAF4', lineHeight: 1.15, marginBottom: 6 }}>{product.label}</div>
                  <div style={{ fontSize: 13, color: product.color, fontWeight: 700 }}>{product.headline}</div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#9A9A8A', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, flexShrink: 0, fontFamily: 'inherit' }}>✕</button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '22px 28px 28px', background: '#0D1F17' }}>
            {/* Description */}
            <p style={{ fontSize: 13.5, color: '#A0C4B0', lineHeight: 1.75, marginBottom: 22 }}>{product.desc}</p>

            {/* Benefits grid */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: `${product.color}99`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>⚡ On-chain benefits</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {product.benefits.map((b, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', background: `${product.color}0E`, border: `1px solid ${product.color}28`, borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#D0EAD8' }}>
                    <span style={{ color: product.color, fontWeight: 900, fontSize: 15, lineHeight: 1 }}>✓</span> {b}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Terminal-style tech stack */}
            <div style={{ background: '#060F09', border: `1px solid ${product.color}30`, borderRadius: 12, padding: '12px 16px', fontFamily: 'monospace' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
              </div>
              <div style={{ fontSize: 10, color: '#4A7A5A', marginBottom: 4 }}>$ fabric-cli query --chain trust-ledger --module {product.id}</div>
              <div style={{ fontSize: 11, color: product.color, fontWeight: 600 }}>{product.techStack}</div>
              <motion.span animate={{ opacity: [1,0,1] }} transition={{ duration: 1, repeat: Infinity }} style={{ display: 'inline-block', width: 7, height: 13, background: product.color, marginLeft: 4, verticalAlign: 'text-bottom', borderRadius: 1 }} />
            </div>

            {/* Coming soon chip */}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: product.color, display: 'inline-block', boxShadow: `0 0 8px ${product.color}` }} />
              <span style={{ fontSize: 11.5, color: '#6A9A7A', fontWeight: 600 }}>Not yet available for application — part of the Lloyds DLT Innovation Roadmap</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CustomerApplication({ onNavigate, notifications = [] }) {
  const { pushToast, currentUser } = useStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [marketView, setMarketView] = useState('current'); // 'current' | 'future'
  const [futurePopup, setFuturePopup] = useState(null);   // FUTURE_PRODUCTS item
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});
  const [kycRecord, setKycRecord] = useState(null);
  const [kycStatus, setKycStatus] = useState('idle'); // 'idle' | 'checking' | 'found' | 'notfound'
  const [existingShares, setExistingShares] = useState([]); // share requests from DB
  const debounceRef = useRef(null);

  // Gate: check if current user has an approved KYC credential from DB
  const [kycGateStatus, setKycGateStatus] = useState('checking'); // 'checking' | 'verified' | 'pending' | 'none'
  const [gateCred, setGateCred] = useState(null);

  useEffect(() => {
    // Admin always bypasses the KYC gate — they can apply on behalf of any customer
    if (currentUser?.role === 'admin') {
      setKycGateStatus('verified');
      setGateCred({ credentialId: 'ADMIN-BYPASS', issuer: 'Lloyds Admin' });
      return;
    }
    // Instant check from currentUser object first
    if (currentUser?.credentialId) {
      setKycGateStatus('verified');
      setGateCred({ credentialId: currentUser.credentialId, issuer: 'Lloyds' });
      return;
    }
    // Then check DB
    const email = currentUser?.email;
    if (!email) { setKycGateStatus('none'); return; }
    lookupKyc(email).then(match => {
      if (match && match.status === 'Active') {
        setKycGateStatus('verified');
        setGateCred(match);
      } else {
        getKycRequestsByEmail(email).then(reqs => {
          const arr = Array.isArray(reqs) ? reqs : [];
          const approved = arr.find(r => r.status === 'approved');
          const pending = arr.find(r => r.status === 'pending');
          if (approved) { setKycGateStatus('verified'); setGateCred({ credentialId: approved.credentialId, issuer: 'Lloyds' }); }
          else if (pending) setKycGateStatus('pending');
          else setKycGateStatus('none');
        }).catch(() => setKycGateStatus('none'));
      }
    }).catch(() => setKycGateStatus('none'));
  }, [currentUser]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const err = (k) => errors[k] && (
    <div style={{ color: '#A32D2D', fontSize: 11, marginTop: 3 }}>{errors[k]}</div>
  );

  /* â”€â”€ Load existing share requests for current user â”€â”€ */
  useEffect(() => {
    const email = currentUser?.role === 'admin' ? form.email : (currentUser?.email || form.email);
    if (!email || !email.includes('@')) return;
    getShareRequestsByEmail(email).then(data => {
      setExistingShares(Array.isArray(data) ? data : []);
    }).catch(() => { });
  }, [currentUser?.email, currentUser?.role, form.email]);

  /* â”€â”€ Auto-check KYC as user types email on step 2 â”€â”€ */
  useEffect(() => {
    if (step !== 2) return;
    const email = form.email.trim();
    if (!email.includes('@') || email.length < 6) {
      setKycStatus('idle'); setKycRecord(null); return;
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

  /* ── Pre-fill from logged-in user + KYC credential (customers only) ── */
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser?.role === 'admin') {
      // Admin applies on behalf of customers, so personal details must start blank.
      setForm(f => ({
        ...f,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dob: '',
        address: '',
        postcode: '',
      }));
      return;
    }
    const parts = (currentUser.name || '').split(' ');
    setForm(f => ({
      ...f,
      email: f.email || currentUser.email || '',
      firstName: f.firstName || parts[0] || '',
      lastName: f.lastName || parts.slice(1).join(' ') || '',
      phone: f.phone || currentUser.phone || '',
      dob: f.dob || DEFAULT_DOB,
      address: f.address || currentUser.address || '',
      postcode: f.postcode || currentUser.postcode || '',
    }));
  }, [currentUser]);

  /* ── When KYC gate resolves as verified for a customer, lock in all fields ── */
  useEffect(() => {
    if (kycGateStatus !== 'verified' || currentUser?.role === 'admin') return;
    // Find the kyc_credential record to get phone, dob, address
    const email = currentUser?.email;
    if (!email) return;
    getKycRegistry().then(data => {
      const list = Array.isArray(data) ? data : [];
      const rec = list.find(r => r.email?.toLowerCase() === email.toLowerCase());
      const parts = (currentUser.name || '').split(' ');
      setForm(f => ({
        ...f,
        firstName: f.firstName || parts[0] || '',
        lastName: f.lastName || parts.slice(1).join(' ') || '',
        email: email,
        phone: f.phone || rec?.phone || currentUser.phone || '',
        dob: DEFAULT_DOB,
        address: f.address || rec?.address || currentUser.address || '',
        postcode: f.postcode || rec?.postcode || currentUser.postcode || '',
      }));
    }).catch(() => { });
  }, [kycGateStatus, currentUser]);

  const alreadySharedWithBank = (bank) =>
    existingShares.some(r =>
      r.targetBank === bank &&
      (r.status === 'approved' || r.status === 'pending')
    );

  const validate = () => {
    const e = {};
    if (step === 0 && !form.product) e.product = 'Please select a product';
    if (step === 1 && !form.bank) e.bank = 'Please select a bank';
    if (step === 1 && form.bank && !alreadySharedWithBank(form.bank) && !form.shareConsent)
      e.shareConsent = `⚠️ ${form.bank} requires your KYC credential to process your application. Please tick the checkbox to share your credential, or select a bank where it's already shared.`;
    if (step === 2) {
      // Skip validation for KYC-verified customers — fields are auto-filled and locked
      if (!(kycGateStatus === 'verified' && currentUser?.role !== 'admin')) {
        if (!form.firstName) e.firstName = 'Required';
        if (!form.lastName) e.lastName = 'Required';
        if (!form.email || !form.email.includes('@')) e.email = 'Valid email required';
        if (!form.phone) e.phone = 'Required';
        if (!form.dob) e.dob = 'Required';
        if (!form.address) e.address = 'Required';
        if (!form.postcode) e.postcode = 'Required';
      }
    }
    if (step === 4) {
      if (!form.annualIncome || isNaN(form.annualIncome)) e.annualIncome = 'Enter a valid number';
      if (!form.loanAmount || isNaN(form.loanAmount)) e.loanAmount = 'Enter a valid amount';
      if (!form.purpose) e.purpose = 'Required';
      if (!form.employmentStatus) e.employmentStatus = 'Required';
    }
    if (step === 5 && !form.agreeTerms) e.agreeTerms = 'You must agree to proceed';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // For KYC-verified customers the locked form is always "complete"
  const detailsComplete = (kycGateStatus === 'verified' && currentUser?.role !== 'admin')
    || !!(form.firstName && form.lastName && form.email?.includes('@') &&
      form.phone && form.dob && form.address && form.postcode);

  const next = () => { if (!validate()) return; setStep(s => Math.min(s + 1, 5)); };
  const back = () => { setStep(s => Math.max(s - 1, 0)); setErrors({}); };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const productLabel = PRODUCTS.find(p => p.id === form.product)?.label || form.product;
      // Always use logged-in user's registered name as primary — guarantees DB filter works
      const isAdmin = currentUser?.role === 'admin';
      const applicantName = isAdmin
        ? `${form.firstName} ${form.lastName}`.trim()
        : (currentUser?.name || kycRecord?.name || `${form.firstName} ${form.lastName}`.trim());
      const nameParts = applicantName.trim().split(/\s+/);
      const avatarInitials = (nameParts.length >= 2
        ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
        : applicantName.slice(0, 2)
      ).toUpperCase();

      // If share consent given and not already shared â†’ auto-create share request
      if (form.shareConsent && form.bank && !alreadySharedWithBank(form.bank)) {
        const kycForShare = kycRecord || { credentialId: `KYC-PENDING-${Date.now()}` };
        await submitShareRequest({
          credentialId: kycForShare.credentialId,
          customerName: applicantName,
          customerEmail: isAdmin ? form.email : (currentUser?.email || form.email),
          targetBank: form.bank,
          status: 'pending',
          source: 'product_application',
        });
        pushToast(`📤 Credential share request sent to ${form.bank}`, 'info');
      }

      const payload = {
        applicantName,
        customerName: applicantName,
        avatar: avatarInitials,
        product: productLabel,
        amount: `GBP ${parseInt(form.loanAmount).toLocaleString()}`,
        kycSource: kycRecord ? `On-chain · ${kycRecord.issuer}` : 'New · customer portal',
        credentialId: kycRecord?.credentialId || null,
        creditScore: kycRecord?.score || null,
        status: 'Pending',
        email: isAdmin ? form.email : (currentUser?.email || form.email),
        phone: form.phone,
        annualIncome: form.annualIncome,
        employmentStatus: form.employmentStatus,
        purpose: form.purpose,
        loanTerm: form.loanTerm,
        existingDebts: form.existingDebts,
        dob: isAdmin ? form.dob : DEFAULT_DOB,
        address: `${form.address}, ${form.postcode}`,
        targetBank: form.bank,
        shareConsent: form.shareConsent,
      };
      const data = await submitApplication(payload);
      setSubmitted(data || payload);
      pushToast(`✅ Application submitted! Ref: ${data?.applicationId || 'pending'}`);
    } catch {
      pushToast('Submission failed — please try again', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* â”€â”€ Success screen â”€â”€ */
  if (submitted) {
    return (
      <div className="main">
        <Navbar crumb="Customer application" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
        <div className="content" style={{ maxWidth: 560, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{ textAlign: 'center', padding: '48px 32px', background: '#FAFAF7', borderRadius: 20, border: '1px solid #E2E0D2', marginTop: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1A14', marginBottom: 8 }}>Application submitted!</div>
            <div style={{ fontSize: 14, color: '#4A4A40', marginBottom: 24 }}>
              {kycRecord
                ? 'Your on-chain KYC credential was matched — your application has been fast-tracked for review.'
                : 'Your application has been received and is now in the queue for review by a Lloyds loan officer.'}
            </div>
            {submitted.applicationId && (
              <div style={{ background: '#E2EEE7', borderRadius: 10, padding: '12px 20px', marginBottom: 12, display: 'inline-block' }}>
                <div style={{ fontSize: 11, color: '#4A4A40' }}>Reference number</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#024731', fontFamily: 'monospace' }}>{submitted.applicationId}</div>
              </div>
            )}
            {form.bank && (
              <div style={{ background: '#F0FAF4', border: '1px solid #C6E8D4', borderRadius: 10, padding: '10px 20px', marginBottom: 24, fontSize: 13, color: '#024731' }}>
                🏦 Applied via <b>{form.bank}</b>
                {form.shareConsent && <span> · Credential share request sent</span>}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => { setSubmitted(null); setForm(EMPTY); setStep(0); setKycRecord(null); setKycStatus('idle'); }}>
                Submit another
              </button>
              <button className="btn-ghost" onClick={() => onNavigate('customer_dashboard')}>My Dashboard →</button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const selectedProduct = PRODUCTS.find(p => p.id === form.product);

  // ── KYC Gate Screen ──────────────────────────────────────────────────────
  if (kycGateStatus === 'checking') {
    return (
      <div className="main">
        <Navbar crumb="Apply for product" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
        <div className="content" style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A14' }}>Verifying your identity…</div>
          <div style={{ fontSize: 13, color: '#6A6A5A', marginTop: 8 }}>Checking our KYC registry</div>
        </div>
      </div>
    );
  }

  if (kycGateStatus === 'pending') {
    return (
      <div className="main">
        <Navbar crumb="Apply for product" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
        <div className="content" style={{ maxWidth: 540, margin: '60px auto' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#FFF7E6', border: '1.5px solid #F0D060', borderRadius: 20, padding: '36px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#7A5A00', marginBottom: 10 }}>KYC Verification Pending</div>
            <div style={{ fontSize: 14, color: '#4A4A40', lineHeight: 1.7, marginBottom: 24 }}>
              Your KYC documents have been submitted and are currently under admin review.<br />
              You can apply for products once your identity is verified and a credential is issued.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => onNavigate('customer_dashboard')}>← Back to dashboard</button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (kycGateStatus === 'none') {
    return (
      <div className="main">
        <Navbar crumb="Apply for product" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
        <div className="content" style={{ maxWidth: 540, margin: '60px auto' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'linear-gradient(135deg,#024731 0%,#0B5C3F 100%)', borderRadius: 20, padding: '36px 40px', textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔐</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>KYC Verification Required</div>
            <div style={{ fontSize: 14, color: '#BFD8CC', lineHeight: 1.7, marginBottom: 24 }}>
              To apply for any product across the Lloyds Banking Group network, you first need to verify your identity.<br />
              Upload your documents once — your credential will be reused across all LBG products automatically.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button style={{ padding: '12px 24px', borderRadius: 12, background: '#F2F0E6', color: '#024731', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => onNavigate('new_customer_upload')}>
                📋 Upload KYC documents →
              </button>
              <button className="btn-ghost" style={{ color: '#024731', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => onNavigate('customer_dashboard')}>← Dashboard</button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <Navbar crumb="Customer application" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
      <div className="content" style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 48 }}>

        {/* KYC verified banner */}
        {gateCred && (
          <div style={{ background: '#F0FAF4', border: '1px solid #C6E8D4', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <b style={{ color: '#024731' }}>KYC Verified</b>
              <span style={{ color: '#4A4A40', marginLeft: 8 }}>Credential: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{gateCred.credentialId}</span></span>
              <span style={{ color: '#9A9A8A', marginLeft: 8 }}>· Issued by {gateCred.issuer || 'Lloyds'}</span>
            </div>
          </div>
        )}

        <div className="page-title-row" style={{ marginBottom: 24 }}>
          <div>
            <div className="page-title">Multi Bank Product Marketplace</div>
            <div className="page-sub">
              Apply for a loan, mortgage, or credit card across the Lloyds Banking Group network.
            </div>
          </div>
        </div>

        {/* â”€â”€ Stepper â”€â”€ */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E2E0D2', borderRadius: 14, padding: '12px 16px', marginBottom: 28, overflowX: 'auto', gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : '0 0 auto', minWidth: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, transition: 'all 0.25s',
                background: i < step ? '#0B5C3F' : i === step ? '#E2EEE7' : '#E2E0D2',
                color: i < step ? '#fff' : i === step ? '#024731' : '#9A9A8A',
                border: i === step ? '2px solid #0B5C3F' : '2px solid transparent',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              {(i === step || i < step) && (
                <div style={{ fontSize: 11, fontWeight: 700, marginLeft: 6, color: i < step ? '#024731' : '#1A1A14', whiteSpace: 'nowrap' }}>
                  {s}
                </div>
              )}
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, minWidth: 10, margin: '0 6px', background: i < step ? '#0B5C3F' : '#E2E0D2', borderRadius: 2, transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial="hidden" animate="show" exit={{ opacity: 0 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>

            {/* â”€â”€ STEP 0: Product selection â”€â”€ */}
            {step === 0 && (
              <motion.div variants={fadeUp}>

                {/* Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A14' }}>
                    {marketView === 'current' ? 'What would you like to apply for?' : '🚀 Future Product Roadmap'}
                  </div>
                  <div style={{ display: 'flex', gap: 0, background: '#F2F0E6', border: '1.5px solid #E2E0D2', borderRadius: 12, padding: 3, flexShrink: 0 }}>
                    {[
                      { key: 'current', label: '✅ Available now' },
                      { key: 'future',  label: '🔮 Future scope' },
                    ].map(t => (
                      <button key={t.key} onClick={() => setMarketView(t.key)} style={{
                        padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, transition: 'all 0.2s',
                        background: marketView === t.key ? (t.key === 'future' ? 'linear-gradient(135deg,#1D4ED8,#6B46C1)' : '#024731') : 'transparent',
                        color: marketView === t.key ? '#fff' : '#6A6A5A',
                        boxShadow: marketView === t.key ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                      }}>{t.label}</button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {marketView === 'current' && (
                    <motion.div key="current" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
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

                  {marketView === 'future' && (
                    <motion.div key="future" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                      {/* Light premium banner */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', marginBottom: 16, background: 'linear-gradient(90deg,#F0FAF4,#EEF7FF)', border: '1.5px solid #C6E8D4', borderRadius: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#024731,#0B5C3F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⛓️</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#024731' }}>Lloyds DLT Innovation Roadmap</div>
                          <div style={{ fontSize: 11, color: '#6A6A5A', marginTop: 1 }}>Click any product to explore the blockchain vision. Coming soon.</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                        {FUTURE_PRODUCTS.map((fp, idx) => (
                          <motion.div
                            key={fp.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.07 }}
                            onClick={() => setFuturePopup(fp)}
                            whileHover={{ scale: 1.02, y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                              borderRadius: 16, cursor: 'pointer', overflow: 'hidden', position: 'relative',
                              background: fp.lightBg, border: `1.5px solid ${fp.border}`,
                              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                            }}
                          >
                            <div style={{ height: 3, background: fp.color, opacity: 0.8, borderRadius: '16px 16px 0 0' }} />
                            <div style={{ padding: '16px 16px 18px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', border: `1.5px solid ${fp.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                  {fp.icon}
                                </div>
                                <span style={{ background: '#fff', border: `1px solid ${fp.border}`, color: fp.color, fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>{fp.tag}</span>
                              </div>
                              <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1A14', marginBottom: 5, lineHeight: 1.3 }}>{fp.label}</div>
                              <div style={{ fontSize: 11, color: '#6A6A5A', lineHeight: 1.55, marginBottom: 12 }}>{fp.headline}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: fp.color, fontWeight: 700 }}>
                                Explore <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <div style={{ marginTop: 14, padding: '10px 16px', background: '#F0FAF4', border: '1px solid #C6E8D4', borderRadius: 10, fontSize: 12, color: '#024731', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span>ℹ️</span>
                        <span>Part of the Lloyds DLT roadmap — <b>not yet available for application</b>. Switch to "Available now" to apply.</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div variants={fadeUp}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Select bank & consent</div>
                <div style={{ fontSize: 13, color: '#6A6A5A', marginBottom: 20 }}>
                  Choose which Lloyds Banking Group entity to apply through. You can also consent to share your KYC credential with them.
                </div>

                {/* Product reminder */}
                <div style={{ background: '#E2EEE7', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#024731', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{selectedProduct?.icon}</span>
                  <span><b>{selectedProduct?.label}</b> — max £{selectedProduct?.maxAmount?.toLocaleString()}{selectedProduct?.id === 'personal_loan' ? ' (based on your credit score)' : ''}</span>
                </div>

                {/* Bank grid */}
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4A4A40', marginBottom: 10 }}>Select a Lloyds Group bank</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
                  {LBG_BANKS.map(b => {
                    const shared = alreadySharedWithBank(b);
                    const isSelected = form.bank === b;
                    return (
                      <div key={b} onClick={() => set('bank', b)} style={{
                        padding: '14px 12px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
                        border: `2px solid ${isSelected ? '#0B5C3F' : '#E2E0D2'}`,
                        background: isSelected ? '#E2EEE7' : '#FAFAF7',
                        boxShadow: isSelected ? '0 0 0 3px rgba(11,92,63,0.1)' : 'none',
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: isSelected ? '#024731' : '#1A1A14' }}>🏦 {b}</div>
                        {shared && (
                          <div style={{ fontSize: 10, color: '#059669', marginTop: 4, fontWeight: 600 }}>
                            ✅ Credential already shared
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {err('bank')}

                {/* Credential share consent */}
                {form.bank && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: alreadySharedWithBank(form.bank) ? '#F0FAF4' : '#FFFBEB',
                      border: `1px solid ${alreadySharedWithBank(form.bank) ? '#C6E8D4' : '#D97706'}`,
                      borderRadius: 14, padding: '18px 20px', marginTop: 4
                    }}>

                    {alreadySharedWithBank(form.bank) ? (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 22 }}>✅</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#065F46' }}>Credential already shared with {form.bank}</div>
                          <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                            Your KYC credential is already shared with this bank. Your application will be fast-tracked automatically.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#92400E', marginBottom: 10 }}>
                          📤 Share KYC credential with {form.bank}?
                        </div>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: '#4A4A40', lineHeight: 1.5 }}>
                          <input type="checkbox" checked={form.shareConsent}
                            onChange={e => set('shareConsent', e.target.checked)}
                            style={{ marginTop: 2, accentColor: '#024731', width: 16, height: 16, flexShrink: 0 }} />
                          <span>
                            <b>Share my KYC credential with {form.bank} for identity verification purposes.</b>
                            {' '}I confirm I consent to my verified identity credential being shared with this bank to process my application. This request will be reviewed by a Lloyds admin.
                          </span>
                        </label>
                        {form.shareConsent && (
                          <div style={{ marginTop: 10, padding: '8px 12px', background: '#E2EEE7', borderRadius: 8, fontSize: 11, color: '#024731' }}>
                            🔐 A credential share request will be automatically created when you submit this application.
                          </div>
                        )}
                        {!form.shareConsent && errors.shareConsent && (
                          <div style={{ marginTop: 10, padding: '10px 14px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8, fontSize: 12, color: '#92400E', fontWeight: 500 }}>
                            {errors.shareConsent}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* â”€â”€ STEP 2: Personal details â”€â”€ */}
            {step === 2 && (
              <motion.div variants={fadeUp}>
                {kycGateStatus === 'verified' && currentUser?.role !== 'admin' ? (
                  <>
                    <div style={{ background: '#F0FAF4', border: '1.5px solid #C6E8D4', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 20 }}>🔒</span>
                      <div style={{ fontSize: 12, color: '#024731' }}>
                        <b>Details auto-filled from your verified KYC credential</b> — fields are locked to protect your identity.
                        <div style={{ fontSize: 11, color: '#6A6A5A', marginTop: 2 }}>Credential: <code style={{ fontFamily: 'monospace' }}>{gateCred?.credentialId}</code></div>
                      </div>
                    </div>
                    <div className="ncu-form-grid">
                      {[
                        { label: 'First name', key: 'firstName' },
                        { label: 'Last name', key: 'lastName' },
                        { label: 'Email address', key: 'email' },
                        { label: 'Phone number', key: 'phone' },
                        { label: 'Date of birth', key: 'dob' },
                        { label: 'Postcode', key: 'postcode' },
                      ].map(f => (
                        <div key={f.key} className="ncu-field">
                          <label className="ncu-label">{f.label}</label>
                          <input className="ncu-input" type="text" value={form[f.key] || '—'} readOnly
                            style={{ background: '#F0FAF4', color: '#024731', cursor: 'not-allowed', fontWeight: 600, border: '1.5px solid #C6E8D4' }} />
                        </div>
                      ))}
                      <div className="ncu-field" style={{ gridColumn: '1/-1' }}>
                        <label className="ncu-label">Address</label>
                        <input className="ncu-input" type="text" value={form.address || '—'} readOnly
                          style={{ background: '#F0FAF4', color: '#024731', cursor: 'not-allowed', fontWeight: 600, border: '1.5px solid #C6E8D4' }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Your personal details</div>
                    <div style={{ fontSize: 13, color: '#6A6A5A', marginBottom: 20 }}>
                      Fill in your details — we check our KYC network <b>live as you type your email</b>.
                    </div>
                    <div className="ncu-form-grid">
                      {[
                        { label: 'First name', key: 'firstName', type: 'text', placeholder: 'John' },
                        { label: 'Last name', key: 'lastName', type: 'text', placeholder: 'Smith' },
                        { label: 'Date of birth', key: 'dob', type: 'date', placeholder: '' },
                        { label: 'Phone number', key: 'phone', type: 'tel', placeholder: '+44 7700 900000' },
                        { label: 'Postcode', key: 'postcode', type: 'text', placeholder: 'SW1A 1AA' },
                      ].map(f => (
                        <div key={f.key} className="ncu-field">
                          <label className="ncu-label">{f.label}</label>
                          <input className="ncu-input" type={f.type} placeholder={f.placeholder}
                            value={f.key === 'dob' ? (currentUser?.role === 'admin' ? form[f.key] : DEFAULT_DOB) : form[f.key]}
                            onChange={e => set(f.key, e.target.value)}
                            readOnly={f.key === 'dob' && currentUser?.role !== 'admin'}
                            style={f.key === 'dob' && currentUser?.role !== 'admin' ? { background: '#F0FAF4', color: '#024731', fontWeight: 600, cursor: 'not-allowed', border: '1.5px solid #C6E8D4' } : undefined} />
                          {err(f.key)}
                        </div>
                      ))}
                      <div className="ncu-field" style={{ gridColumn: '1/-1' }}>
                        <label className="ncu-label">Email address</label>
                        <div style={{ position: 'relative' }}>
                          <input className="ncu-input" type="email" placeholder="john@example.com"
                            value={form.email} onChange={e => set('email', e.target.value)}
                            style={{ paddingRight: 148 }} />
                          {kycStatus !== 'idle' && (
                            <div style={{
                              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, pointerEvents: 'none',
                              background: kycStatus === 'checking' ? '#F0EFE6' : kycStatus === 'found' ? '#E2EEE7' : '#FFF7E6',
                              color: kycStatus === 'checking' ? '#6A6A5A' : kycStatus === 'found' ? '#024731' : '#854F0B',
                              border: kycStatus === 'checking' ? '1px solid #E2E0D2' : kycStatus === 'found' ? '1px solid #C6E8D4' : '1px solid #F0C040',
                              whiteSpace: 'nowrap',
                            }}>
                              {kycStatus === 'checking' ? 'Checking…' : kycStatus === 'found' ? '✅ KYC found' : 'Not on-chain'}
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
                    <AnimatePresence>
                      {kycStatus === 'found' && kycRecord && (
                        <motion.div key="found" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{
                            marginTop: 16, padding: '16px 20px', borderRadius: 12,
                            background: 'linear-gradient(135deg,#024731,#0B5C3F)', color: '#fff',
                            display: 'flex', gap: 14, alignItems: 'flex-start'
                          }}>
                          <span style={{ fontSize: 26, flexShrink: 0 }}>✅</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14 }}>KYC credential found on-chain!</div>
                            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>
                              <b>{kycRecord.name}</b> · {kycRecord.credentialId} · {kycRecord.issuer} · expires {kycRecord.expires}
                              {kycRecord.score && <span> · credit score <b>{kycRecord.score}</b></span>}
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>No document uploads needed — identity already verified ⚡</div>
                          </div>
                        </motion.div>
                      )}
                      {kycStatus === 'notfound' && (
                        <motion.div key="notfound" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{
                            marginTop: 16, padding: '12px 16px', borderRadius: 12,
                            background: '#FFF7E6', border: '1px solid #F0C040',
                            fontSize: 12, color: '#854F0B', display: 'flex', gap: 10, alignItems: 'flex-start'
                          }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>📋</span>
                          <span>No on-chain KYC found for this email. Your application will proceed — a Lloyds officer will verify your identity manually.</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            )}

            {/* ── STEP 3: KYC result ── */}
            {step === 3 && (
              <motion.div variants={fadeUp}>
                {kycRecord ? (
                  <div>
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: 'linear-gradient(135deg,#024731 0%,#0B5C3F 100%)', borderRadius: 16, padding: '28px 24px', marginBottom: 24, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>✅</div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800 }}>Identity already verified!</div>
                          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Your KYC credential was found — no documents needed</div>
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
                        style={{ background: '#F0FAF4', border: '1px solid #C6E8D4', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'center', minWidth: 64 }}>
                          <div style={{ fontSize: 28, fontWeight: 900, color: kycRecord.score >= 750 ? '#024731' : kycRecord.score >= 650 ? '#854F0B' : '#A32D2D' }}>{kycRecord.score}</div>
                          <div style={{ fontSize: 10, color: '#4A4A40' }}>credit score</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A14' }}>
                            {kycRecord.score >= 750 ? 'Excellent — likely eligible for best rates' : kycRecord.score >= 650 ? 'Good — eligible for most products' : 'Fair — some products may require manual review'}
                          </div>
                          <div style={{ fontSize: 11, color: '#6A6A5A', marginTop: 3 }}>Matched from your on-chain credential — no credit search performed yet</div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: '#FFF7E6', border: '1px solid #F0C040', borderRadius: 16, padding: '24px 20px' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 32 }}>📋</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#1A1A14', marginBottom: 6 }}>No existing KYC found</div>
                        <div style={{ fontSize: 13, color: '#4A4A40', lineHeight: 1.6 }}>
                          No verified identity credential was found for <b>{form.email}</b>. Your application will proceed — a Lloyds officer will verify your identity manually.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* â”€â”€ STEP 4: Finances â”€â”€ */}
            {step === 4 && (
              <motion.div variants={fadeUp}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Financial information</div>
                <div style={{ fontSize: 13, color: '#6A6A5A', marginBottom: 20 }}>
                  Tell us about your finances for the <b>{selectedProduct?.label}</b>
                  {form.loanAmount && ` of £${parseInt(form.loanAmount).toLocaleString()}`}.
                </div>
                {kycRecord && (
                  <div style={{ background: '#E2EEE7', borderRadius: 10, padding: '8px 14px', marginBottom: 20, fontSize: 12, color: '#024731', display: 'flex', gap: 8, alignItems: 'center' }}>
                    ✅ <span><b>KYC verified</b> · {kycRecord.credentialId} · Credit score {kycRecord.score}</span>
                  </div>
                )}
                <div className="ncu-form-grid">
                  <div className="ncu-field">
                    <label className="ncu-label">Employment status</label>
                    <select className="ncu-input" value={form.employmentStatus} onChange={e => set('employmentStatus', e.target.value)}>
                      <option value="">Select…</option>
                      {['Full-time employed', 'Part-time employed', 'Self-employed', 'Director / Business owner', 'Retired', 'Student', 'Unemployed'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    {err('employmentStatus')}
                  </div>
                  <div className="ncu-field">
                    <label className="ncu-label">Annual income (£)</label>
                    <input className="ncu-input" type="number" placeholder="45000"
                      value={form.annualIncome} onChange={e => set('annualIncome', e.target.value)} />
                    {err('annualIncome')}
                  </div>
                  <div className="ncu-field">
                    <label className="ncu-label">{form.product === 'credit_card' ? 'Desired credit limit (£)' : 'Loan amount (£)'}</label>
                    <input className="ncu-input" type="number"
                      placeholder={selectedProduct ? String(Math.round(selectedProduct.maxAmount * 0.1)) : '25000'}
                      value={form.loanAmount} onChange={e => set('loanAmount', e.target.value)} />
                    {selectedProduct && <div style={{ fontSize: 10, color: '#9A9A8A', marginTop: 3 }}>Max: £{selectedProduct.maxAmount.toLocaleString()}</div>}
                    {err('loanAmount')}
                  </div>
                  {form.product !== 'credit_card' && (
                    <div className="ncu-field">
                      <label className="ncu-label">Loan term</label>
                      <select className="ncu-input" value={form.loanTerm} onChange={e => set('loanTerm', e.target.value)}>
                        <option value="">Select…</option>
                        {[12, 24, 36, 48, 60, 84, 120, 180, 240, 300, 360].map(o => (
                          <option key={o} value={o}>{o} months ({Math.round(o / 12)} yr{o > 12 ? 's' : ''})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="ncu-field" style={{ gridColumn: '1/-1' }}>
                    <label className="ncu-label">Purpose / reason</label>
                    <textarea className="ncu-input" rows={3}
                      placeholder="e.g. Home renovation, debt consolidation, new vehicle…"
                      value={form.purpose} onChange={e => set('purpose', e.target.value)}
                      style={{ resize: 'vertical' }} />
                    {err('purpose')}
                  </div>
                  <div className="ncu-field">
                    <label className="ncu-label">Existing monthly debt repayments (£, optional)</label>
                    <input className="ncu-input" type="number" placeholder="500"
                      value={form.existingDebts} onChange={e => set('existingDebts', e.target.value)} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* â”€â”€ STEP 5: Review & submit â”€â”€ */}
            {step === 5 && (
              <motion.div variants={fadeUp}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Review your application</div>

                {/* KYC status banner */}
                <div style={{
                  padding: '14px 18px', borderRadius: 12, marginBottom: 16,
                  background: kycRecord ? '#E2EEE7' : '#FFF7E6',
                  border: `1px solid ${kycRecord ? '#C6E8D4' : '#F0C040'}`,
                  display: 'flex', gap: 12, alignItems: 'center'
                }}>
                  <span style={{ fontSize: 22 }}>{kycRecord ? '🛡️' : '📋'}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A14' }}>
                      {kycRecord ? `KYC verified · ${kycRecord.credentialId}` : 'KYC pending — manual verification required'}
                    </div>
                    <div style={{ fontSize: 11, color: '#4A4A40', marginTop: 2 }}>
                      {kycRecord ? `Issued by ${kycRecord.issuer} · expires ${kycRecord.expires}` : 'A Lloyds officer will contact you'}
                    </div>
                  </div>
                </div>

                {/* Bank + consent banner */}
                {form.bank && (
                  <div style={{
                    padding: '14px 18px', borderRadius: 12, marginBottom: 16,
                    background: '#F0FAF4', border: '1px solid #C6E8D4', display: 'flex', gap: 12, alignItems: 'center'
                  }}>
                    <span style={{ fontSize: 22 }}>🏦</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#065F46' }}>Applying via {form.bank}</div>
                      <div style={{ fontSize: 11, color: '#047857', marginTop: 2 }}>
                        {alreadySharedWithBank(form.bank)
                          ? 'Credential already shared with this bank ✅'
                          : form.shareConsent
                            ? '📤 Consent given — share request will be created on submit'
                            : 'No credential share consent given'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary table */}
                <div style={{ background: '#F2F0E6', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
                  {[
                    ['Product', PRODUCTS.find(p => p.id === form.product)?.label],
                    ['Bank', form.bank],
                    ['Full name', kycRecord?.name || `${form.firstName} ${form.lastName}`],
                    ['Email', form.email],
                    ['Phone', form.phone],
                    ['Date of birth', form.dob],
                    ['Address', `${form.address}, ${form.postcode}`],
                    ['Employment', form.employmentStatus],
                    ['Annual income', form.annualIncome ? `£${parseInt(form.annualIncome).toLocaleString()}` : '—'],
                    [form.product === 'credit_card' ? 'Credit limit' : 'Loan amount',
                    form.loanAmount ? `£${parseInt(form.loanAmount).toLocaleString()}` : '—'],
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
                  I confirm all information is accurate and agree to Lloyds Banking Group's Terms & Conditions and Privacy Policy.
                </label>
                {err('agreeTerms')}
              </motion.div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* â”€â”€ Navigation buttons â”€â”€ */}
        <div className="ncu-actions" style={{ marginTop: 32 }}>
          {step > 0 && <button className="btn-ghost" onClick={back}>← Back</button>}
          {step < 5 ? (
            <button
              className="btn-primary"
              onClick={next}
              disabled={
                (step === 0 && !form.product) ||
                (step === 1 && !form.bank) ||
                (step === 2 && (!detailsComplete || kycStatus === 'checking'))
              }
              title={
                step === 2 && kycStatus === 'checking' ? 'Waiting for KYC check…' :
                  step === 2 && !detailsComplete ? 'Please fill all required fields' : ''
              }
            >
              {step === 2 && kycStatus === 'checking'
                ? 'Checking KYC…'
                : step === 2 && kycStatus === 'found'
                  ? '✅ KYC found — Continue →'
                  : 'Continue →'}
            </button>
          ) : (
            <button className="btn-primary" onClick={submit} disabled={submitting || !form.agreeTerms}>
              {submitting ? 'Submitting…' : kycRecord ? '⚡ Submit (fast-tracked)' : 'Submit application'}
            </button>
          )}
        </div>
      </div>

      {/* Future product popup */}
      <AnimatePresence>
        {futurePopup && <FutureProductModal product={futurePopup} onClose={() => setFuturePopup(null)} />}
      </AnimatePresence>
    </div>
  );
}
