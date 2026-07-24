import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import lloydHorse from '../assets/lloyds-horse.gif';
import { useStore } from '../store';

export default function Sidebar({ currentPage, onNavigate }) {
  const { currentUser, logout } = useStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

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

        {/* ── ADMIN NAV ── */}
        {isAdmin && <>
          <div className="sb-label">Platform</div>
          {link('dashboard', 'Dashboard', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
              <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
            </svg>
          )}
          {link('loan_applications', 'Loan applications', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/>
            </svg>
          )}
          {link('credit_cards', 'Credit cards', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
            </svg>
          )}
          {link('kyc_registry', 'KYC registry', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/>
            </svg>
          )}

          <div className="sb-label">Customer view</div>
          {link('customer_application', 'Apply for product', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/>
            </svg>
          )}
          {link('new_customer_upload', 'New customer upload', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>
            </svg>
          )}
          {link('loan_decision', 'Loan decision', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          )}

          <div className="sb-label">Administration</div>
          {link('admin_control_center', 'Admin control center', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          )}

          <div className="sb-label">Blockchain</div>
          {link('ledger_explorer', 'Ledger explorer', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <path d="M20 4L8.12 15.88"/><path d="M14.47 14.48L20 20"/><path d="M8.12 8.12L12 12"/>
            </svg>
          )}
        </>}

        {/* ── CUSTOMER NAV ── */}
        {!isAdmin && <>
          <div className="sb-label">My account</div>
          {link('customer_dashboard', 'My Dashboard', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
              <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
            </svg>
          )}
          {link('customer_application', 'Apply for product', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/>
            </svg>
          )}
          {link('kyc_registry', 'My KYC status', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/>
            </svg>
          )}
          {link('new_customer_upload', 'Upload KYC documents', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          )}

          <div className="sb-label">Blockchain</div>
          {link('ledger_explorer', 'Ledger explorer', null,
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <path d="M20 4L8.12 15.88"/><path d="M14.47 14.48L20 20"/><path d="M8.12 8.12L12 12"/>
            </svg>
          )}
        </>}

        {/* ── Footer / profile ── */}
        <div className="sb-foot" onClick={() => setProfileOpen(true)} style={{ cursor: 'pointer' }} title="View profile">
          <div className="sb-av" style={{ background: isAdmin ? '#0E6E4B' : '#2B5EA7', fontSize: 12, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {currentUser?.initials || 'U'}
          </div>
          <div>
            <div className="sb-fname">{currentUser?.name || 'User'}</div>
            <div className="sb-frole">{currentUser?.title || currentUser?.role}</div>
          </div>
          <svg style={{ marginLeft: 'auto', opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </aside>

      {/* Profile Modal */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setProfileOpen(false)}>
            <motion.div initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 24 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              style={{ background: '#FAFAF7', borderRadius: 20, width: 380, padding: '32px 28px', position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setProfileOpen(false)} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9A9A8A' }}>✕</button>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: isAdmin ? '#024731' : '#2B5EA7', color: '#fff', fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  {currentUser?.initials}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{currentUser?.name}</div>
                <div style={{ fontSize: 13, color: '#4A4A40', marginTop: 4 }}>{currentUser?.title}</div>
                <span style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', background: isAdmin ? '#E2EEE7' : '#EBF0FF', color: isAdmin ? '#024731' : '#2B5EA7', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                  {isAdmin ? '\uD83D\uDD10 Admin access' : '\uD83D\uDC64 Customer'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'Email', value: currentUser?.email },
                  currentUser?.branch && { label: 'Branch', value: currentUser.branch },
                  currentUser?.credentialId && { label: 'KYC Credential', value: currentUser.credentialId },
                ].filter(Boolean).map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F2F0E6', borderRadius: 8 }}>
                    <span style={{ fontSize: 11, color: '#9A9A8A' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A14' }}>{value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setProfileOpen(false); logout(); }}
                style={{ width: '100%', padding: '11px', borderRadius: 10, background: '#FCEBEB', border: '1px solid #F0C0C0', color: '#A32D2D', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Sign out
              </button>
              <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: '#C0BFB5' }}>Lloyds Banking Group · DLT Platform v2.0</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
