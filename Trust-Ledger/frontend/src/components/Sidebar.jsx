import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import lloydHorse from '../assets/lloyds-horse.gif';
import { useStore } from '../store';
import { getKycRegistry, getKycRequestsByEmail } from '../services/api';

export default function Sidebar({ currentPage, onNavigate }) {
  const { currentUser, logout } = useStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin';
  const [liveKyc, setLiveKyc] = useState({ loading: false, status: null, credentialId: null });
  const selfiePhoto = (() => { try { return localStorage.getItem(`tl_user_selfie_${(currentUser?.email || 'guest').toLowerCase()}`) || null; } catch { return null; } })();

  useEffect(() => {
    if (!profileOpen || isAdmin || !currentUser?.email) return;

    let cancelled = false;
    setLiveKyc({ loading: true, status: null, credentialId: currentUser?.credentialId || null });

    Promise.all([
      getKycRegistry().catch(() => []),
      getKycRequestsByEmail(currentUser.email).catch(() => []),
    ]).then(([kycData, reqData]) => {
      if (cancelled) return;

      const email = currentUser.email.toLowerCase().trim();
      const name = (currentUser.name || '').toLowerCase().trim();
      const registry = Array.isArray(kycData) ? kycData : [];
      const reqs = Array.isArray(reqData) ? reqData : [];

      const regMatch = registry.find(r =>
        (r.email || '').toLowerCase().trim() === email ||
        (r.customerName || '').toLowerCase().trim() === name,
      );

      const regStatus = (regMatch?.status || '').toLowerCase();
      if (regMatch && ['active', 'approved', 'verified'].includes(regStatus)) {
        setLiveKyc({
          loading: false,
          status: 'Verified ✓',
          credentialId: regMatch.credentialId || regMatch.credential_id || currentUser?.credentialId || null,
        });
        return;
      }

      const approvedReq = reqs.find(r => (r.status || '').toLowerCase() === 'approved');
      if (approvedReq) {
        setLiveKyc({
          loading: false,
          status: 'Verified ✓',
          credentialId: approvedReq.credentialId || currentUser?.credentialId || null,
        });
        return;
      }

      const pendingReq = reqs.find(r => (r.status || '').toLowerCase() === 'pending');
      if (pendingReq) {
        setLiveKyc({ loading: false, status: 'Pending review', credentialId: currentUser?.credentialId || null });
        return;
      }

      setLiveKyc({ loading: false, status: currentUser?.credentialId ? 'Verified ✓' : 'Not verified', credentialId: currentUser?.credentialId || null });
    }).catch(() => {
      if (cancelled) return;
      setLiveKyc({ loading: false, status: currentUser?.credentialId ? 'Verified ✓' : 'Not verified', credentialId: currentUser?.credentialId || null });
    });

    return () => { cancelled = true; };
  }, [profileOpen, isAdmin, currentUser?.email, currentUser?.name, currentUser?.credentialId]);

  const profileCredentialId = !isAdmin ? (liveKyc.credentialId || currentUser?.credentialId || null) : null;
  const profileKycStatus = isAdmin
    ? null
    : (liveKyc.loading ? 'Checking…' : (liveKyc.status || (currentUser?.credentialId ? 'Verified ✓' : 'Not verified')));

  const link = (page, label, badge, icon) => (
    <button className={`sb-link${currentPage === page ? ' on' : ''}`} data-page={page} onClick={() => onNavigate(page)}>
      <span className="sb-link-left">{icon}{label}</span>
      {badge && <span className="sb-badge-m">{badge}</span>}
    </button>
  );

  return (
    <>
      <aside className={`sidebar${currentPage === 'fluid_overview' ? ' hidden-for-fluid' : ''}`}>
        <div className="sb-brand" onClick={() => onNavigate(isAdmin ? 'dashboard' : 'customer_dashboard')}>
          <div className="sb-mark" style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}>
            <img src={lloydHorse} alt="Lloyds" style={{ width: '30px', height: '30px', objectFit: 'contain', borderRadius: '7px' }} />
          </div>
          <span className="sb-name">LLOYDS</span>
        </div>
        <div className="sb-tagline">DLT lending &amp; reusable KYC platform</div>

        {isAdmin && <>
          <div className="sb-label">Platform</div>
          {link('dashboard', 'Dashboard', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>)}
          {link('loan_applications', 'Loan applications', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>)}
          {link('credit_cards', 'Credit cards', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>)}
          {link('kyc_registry', 'KYC registry', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/></svg>)}
          {link('future_roadmap', 'Future roadmap', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
          <div className="sb-label">Customer view</div>
          {link('customer_application', 'Apply for product', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg>)}
          {link('new_customer_upload', 'New customer upload', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>)}
          {link('loan_decision', 'Loan decision', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>)}
          <div className="sb-label">Administration</div>
          {link('admin_control_center', 'Admin control center', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>)}
          <div className="sb-label">Blockchain</div>
          {link('ledger_explorer', 'Ledger explorer', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/><path d="M14.47 14.48L20 20"/><path d="M8.12 8.12L12 12"/></svg>)}
        </>}

        {!isAdmin && <div data-tour="sb-customer-nav">
          <div className="sb-label">My account</div>
          {link('customer_dashboard', 'My Dashboard', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>)}
          {link('new_customer_upload', 'Upload KYC documents', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>)}
          {link('customer_application', 'Apply for product', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg>)}
          {link('future_roadmap', 'Future roadmap', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
          <div className="sb-label">Blockchain</div>
          {link('ledger_explorer', 'Ledger explorer', null, <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/><path d="M14.47 14.48L20 20"/><path d="M8.12 8.12L12 12"/></svg>)}
        </div>}

        <div data-tour="sb-profile" className="sb-foot" onClick={() => setProfileOpen(v => !v)} style={{ cursor: 'pointer' }} title="View profile">
          <div className="sb-av" style={{ background: isAdmin ? '#0E6E4B' : '#2B5EA7', fontSize: 12, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', padding: 0 }}>
            {selfiePhoto && !isAdmin
              ? <img src={selfiePhoto} alt="profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'inherit'}}/>
              : (currentUser?.initials || 'U')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sb-fname">{currentUser?.name || 'User'}</div>
            <div className="sb-frole">{currentUser?.title || currentUser?.role}</div>
          </div>
          <motion.div animate={{ rotate: profileOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <svg style={{ opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </motion.div>
        </div>
      </aside>

      <AnimatePresence>
        {profileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(6,20,14,0.72)', backdropFilter: 'blur(5px)' }}
              onClick={() => setProfileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              style={{ position: 'fixed', top: '50%', left: '50%', marginTop: -300, marginLeft: -170, width: 340, zIndex: 999, background: '#0D1F17', borderRadius: 24, boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,216,154,0.2)', border: '1.5px solid rgba(79,216,154,0.18)', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ background: isAdmin ? 'linear-gradient(135deg,#012820 0%,#024731 55%,#047857 100%)' : 'linear-gradient(135deg,#0B1F5C 0%,#1D4ED8 55%,#3B82F6 100%)', padding: '24px 20px 58px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
                <button onClick={() => setProfileOpen(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', lineHeight: 1 }}>&#x2715;</button>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, marginBottom: 10, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4FD89A', flexShrink: 0, boxShadow: '0 0 6px #4FD89A' }} />
                  {isAdmin ? 'Administrator' : 'Personal Banking'}
                </span>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{currentUser?.name || 'User'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', marginTop: 3 }}>{currentUser?.title || currentUser?.role}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: -34, position: 'relative', zIndex: 2 }}>
                <div style={{ width: 68, height: 68, borderRadius: '50%', background: isAdmin ? 'linear-gradient(135deg,#024731,#059669)' : 'linear-gradient(135deg,#1D4ED8,#60A5FA)', color: '#fff', fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #0D1F17', boxShadow: '0 4px 20px rgba(0,0,0,0.45), 0 0 0 1px rgba(79,216,154,0.3)', overflow: 'hidden', padding: 0 }}>
                  {selfiePhoto && !isAdmin
                    ? <img src={selfiePhoto} alt="profile" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : (currentUser?.initials || 'U')}
                </div>
              </div>

              <div style={{ padding: '12px 18px 18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {[
                    { icon: '\u2709', label: 'Email', value: currentUser?.email },
                    isAdmin && currentUser?.branch ? { icon: '\uD83C\uDFE2', label: 'Branch', value: currentUser.branch } : null,
                    !isAdmin && profileCredentialId ? { icon: '\u26D3', label: 'Credential ID', value: profileCredentialId, mono: true } : null,
                    isAdmin
                      ? { icon: '\uD83D\uDEE1', label: 'Access level', value: 'Full platform access' }
                      : { icon: '\uD83D\uDD10', label: 'KYC status', value: profileKycStatus },
                  ].filter(Boolean).map(({ icon, label, value, mono }) => value ? (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.09)' }}>
                      <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#E8F5E9', fontFamily: mono ? 'monospace' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                      </div>
                    </div>
                  ) : null)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'rgba(79,216,154,0.07)', border: '1px solid rgba(79,216,154,0.16)', borderRadius: 10, marginBottom: 12, fontSize: 11, color: '#4FD89A' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4FD89A', flexShrink: 0, boxShadow: '0 0 8px #4FD89A' }} />
                  <span style={{ fontWeight: 700 }}>kycchannel</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>&middot;</span>
                  <span style={{ opacity: 0.65 }}>Hyperledger Fabric</span>
                  <span style={{ marginLeft: 'auto', background: 'rgba(79,216,154,0.15)', padding: '2px 7px', borderRadius: 20, fontWeight: 800, fontSize: 10, letterSpacing: '0.06em' }}>LIVE</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <button onClick={() => { setProfileOpen(false); onNavigate(isAdmin ? 'dashboard' : 'customer_dashboard'); }} style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#E8F5E9', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
                    Dashboard
                  </button>
                  {!isAdmin ? (
                    <button onClick={() => { setProfileOpen(false); onNavigate('ledger_explorer'); }} style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(79,216,154,0.1)', border: '1px solid rgba(79,216,154,0.22)', color: '#4FD89A', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/></svg>
                      My Ledger
                    </button>
                  ) : (
                    <button onClick={() => { setProfileOpen(false); onNavigate('admin_control_center'); }} style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.22)', color: '#FFA040', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      Control
                    </button>
                  )}
                </div>

                <button onClick={() => { setProfileOpen(false); logout(); }} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.22)', color: '#F87171', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.05em' }}>
                  Lloyds DLT Platform &middot; Trust Ledger v2.0
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}