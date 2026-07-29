import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Toast Component ───────────────────────────────────────────────────────
export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div style={{ position: 'fixed', top: 74, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380 }}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              background: t.type === 'error' ? '#fff0f0' : t.type === 'info' ? '#f0f4ff' : '#f0faf4',
              border: `1.5px solid ${t.type === 'error' ? '#fcc' : t.type === 'info' ? '#b3c6ff' : '#a3d9b8'}`,
              borderRadius: 12,
              padding: '12px 14px',
              boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
              cursor: 'pointer',
            }}
            onClick={() => onDismiss(t.id)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>
                {t.type === 'error' ? '❌' : t.type === 'info' ? 'ℹ️' : '✅'}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#16160f', marginBottom: 2 }}>{t.msg}</div>
                {t.txHash && (
                  <div style={{ fontSize: 11, color: '#666', fontFamily: 'monospace', marginTop: 4, background: '#f5f5f0', padding: '3px 7px', borderRadius: 5 }}>
                    tx: {t.txHash.slice(0, 20)}...{t.txHash.slice(-8)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
