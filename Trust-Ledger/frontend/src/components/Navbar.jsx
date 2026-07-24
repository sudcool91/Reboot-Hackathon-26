import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FluidButton from './FluidButton';
import { useStore } from '../store';

const ACTION_ICON = {
  IssueKYC:       '🛡️',
  ConsentGranted: '📋',
  ConsentRevoked: '❌',
  VerifyKYC:      '🔍',
  LoanGranted:    '✅',
  LoanRejected:   '🚫',
};

export default function Navbar({ crumb, onFluid, variant = 'default', notifications = [], blockHeight }) {
  const { currentUser, logout } = useStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = notifications.length;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="navbar">
      <div className="navbar-crumbs">
        Lloyds DLT Platform / <b>{crumb}</b>
      </div>
      <div className="navbar-right">
        <FluidButton onClick={onFluid} />
        {variant === 'admin' ? (
          <span className="pill pill-dark">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/>
            </svg>
            Tier 2 · Senior admin
          </span>
        ) : variant === 'ledger' ? (
          <>
            <span><span className="pill-dot"></span>block #{blockHeight || '48,221'}</span>
            <span>4/4 validators</span>
          </>
        ) : (
          <span className="pill pill-live"><span className="pill-dot"></span>Network healthy</span>
        )}

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <div
            className="icon-btn"
            onClick={() => setNotifOpen(o => !o)}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A4A40" strokeWidth="2">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                background: '#A32D2D', color: '#fff',
                fontSize: 9, fontWeight: 800, lineHeight: 1,
                minWidth: 16, height: 16, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', border: '2px solid #FAFAF7',
              }}>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>

          <AnimatePresence>
            {notifOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                  onClick={() => setNotifOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  style={{
                    position: 'absolute', top: 36, right: 0, width: 360,
                    background: '#FAFAF7', borderRadius: 14, zIndex: 999,
                    boxShadow: '0 16px 60px rgba(0,0,0,0.18)', border: '1px solid #E2E0D2',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #E2E0D2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A14' }}>Recent activity</div>
                    <div style={{ fontSize: 11, color: '#9A9A8A' }}>{unread} events</div>
                  </div>
                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {notifications.length === 0 && (
                      <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: '#9A9A8A' }}>No recent activity</div>
                    )}
                    {notifications.map((n, i) => (
                      <div key={i} style={{
                        padding: '10px 16px', borderBottom: i < notifications.length - 1 ? '1px solid #F0EEE4' : 'none',
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                      }}>
                        <span style={{ fontSize: 16, marginTop: 1 }}>{ACTION_ICON[n.type] || '📌'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A14', lineBreak: 'anywhere' }}>{n.text}</div>
                          {n.description && <div style={{ fontSize: 11, color: '#6A6A5A', marginTop: 2 }}>{n.description}</div>}
                          <div style={{ fontSize: 10, color: '#9A9A8A', marginTop: 3 }}>
                            {n.blockNumber && <span>block #{n.blockNumber} · </span>}
                            {n.at}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px 16px', borderTop: '1px solid #E2E0D2', textAlign: 'center' }}>
                    <span style={{ fontSize: 11, color: '#0B5C3F', fontWeight: 600, cursor: 'pointer' }} onClick={() => setNotifOpen(false)}>
                      Close
                    </span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="nav-av" style={{ background: isAdmin ? '#024731' : '#2B5EA7', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'default' }}>
          {currentUser?.initials || 'U'}
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          title="Sign out"
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: '#FCEBEB', border: '1px solid #F0C0C0', color: '#A32D2D', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

