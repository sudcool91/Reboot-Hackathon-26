import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, DEMO_USERS, getCustomUsers } from '../store';
import { loginUser } from '../services/api';
import lloydHorse from '../assets/lloyds-horse.gif';

export default function Login() {
  const { login } = useStore();
  const [role, setRole]         = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [tick, setTick]         = useState(0); // force re-render when custom users change

  const allUsers   = [...DEMO_USERS, ...getCustomUsers()];
  const demoFor    = (r) => allUsers.find(u => u.role === r);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(username.trim(), password);
      if (res?.success && res.user) { login(res.user); return; }
    } catch {}
    // Check both DEMO_USERS and custom users
    const all = [...DEMO_USERS, ...getCustomUsers()];
    const match = all.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() &&
           u.password === password &&
           (role === 'admin' ? u.role === 'admin' : u.role === 'customer')
    );
    if (match) {
      login(match);
    } else {
      setError('Invalid username or password.');
    }
    setLoading(false);
  };

  const quickLogin = async (demo) => {
    setRole(demo.role);
    setUsername(demo.username);
    setPassword(demo.password);
    setError('');
    try {
      const res = await loginUser(demo.username, demo.password);
      if (res?.success && res.user) { login(res.user); return; }
    } catch {}
    setTimeout(() => login(demo), 100);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#024731',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background texture */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 20% 30%, rgba(79,216,154,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.04) 0%, transparent 50%)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <img src={lloydHorse} alt="Lloyds" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <span style={{ fontSize: 22, fontWeight: 800, color: '#F2F0E6', letterSpacing: '0.04em' }}>LLOYDS</span>
          </div>
          <div style={{ fontSize: 12, color: '#8FCBAE', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            DLT Lending &amp; Reusable KYC Platform
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#FAFAF7', borderRadius: 20, padding: '32px 32px 28px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A14', marginBottom: 4 }}>Sign in</div>
          <div style={{ fontSize: 13, color: '#6A6A5A', marginBottom: 24 }}>
            Choose your role and enter your credentials.
          </div>

          <form onSubmit={handleLogin}>
            {/* Role selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#4A4A40', display: 'block', marginBottom: 6 }}>
                Sign in as
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { value: 'admin',    label: 'Admin',    icon: '\uD83D\uDEE1\uFE0F', desc: 'Full platform access' },
                  { value: 'customer', label: 'Customer', icon: '\uD83D\uDC64', desc: 'Apply & track Applications' },
                ].map(opt => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => { setRole(opt.value); setError(''); }}
                    style={{
                      padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                      border: `2px solid ${role === opt.value ? '#0B5C3F' : '#E2E0D2'}`,
                      background: role === opt.value ? '#E2EEE7' : '#FFFFFF',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{opt.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A14' }}>{opt.label}</div>
                    <div style={{ fontSize: 10.5, color: '#6A6A5A' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#4A4A40', display: 'block', marginBottom: 5 }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                placeholder={demoFor(role)?.username}
                autoComplete="username"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid #D8D6CC', fontSize: 13, fontFamily: 'inherit',
                  background: '#FAFAF7', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#024731')}
                onBlur={e => (e.target.style.borderColor = '#D8D6CC')}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#4A4A40', display: 'block', marginBottom: 5 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '10px 40px 10px 14px', borderRadius: 10,
                    border: '1.5px solid #D8D6CC', fontSize: 13, fontFamily: 'inherit',
                    background: '#FAFAF7', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#024731')}
                  onBlur={e => (e.target.style.borderColor = '#D8D6CC')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9A9A8A' }}
                >
                  {showPw ? '\uD83D\uDE48' : '\uD83D\uDC41\uFE0F'}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ background: '#FCEBEB', border: '1px solid #F0C0C0', borderRadius: 9, padding: '10px 14px', fontSize: 12, color: '#A32D2D', marginBottom: 14 }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || !username || !password}
              style={{
                width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                background: (!username || !password) ? '#D8D6CC' : '#024731',
                color: (!username || !password) ? '#9A9A8A' : '#fff',
                fontSize: 14, fontWeight: 700, cursor: (!username || !password) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
              }}
            >
              {loading ? 'Signing in\u2026' : `Sign in as ${role === 'admin' ? 'Admin' : 'Customer'}`}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 20, padding: '14px 16px', background: '#F2F0E6', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6A6A5A', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Demo credentials
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allUsers.map(u => (
                <div key={u.username} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 9, padding: '8px 12px', border: `1px solid ${u._custom ? '#C6E8D4' : '#E2E0D2'}` }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: u._custom ? '#024731' : '#1A1A14', textTransform: 'capitalize' }}>
                      {u._custom ? '🆕 ' : ''}{u.role}
                    </span>
                    <span style={{ fontSize: 11, color: '#6A6A5A', marginLeft: 6 }}>{u.name}</span>
                    <span style={{ fontSize: 11, color: '#9A9A8A', marginLeft: 8, fontFamily: 'monospace' }}>{u.username} / {u.password}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => quickLogin(u)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: u._custom ? '#E2EEE7' : '#F2F0E6', color: '#024731', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'rgba(242,240,230,0.35)' }}>
          Lloyds Banking Group · DLT Platform v2.0 · Hackathon Demo
        </div>
      </motion.div>
    </div>
  );
}
