import { createContext, useContext, useState, useCallback } from 'react';

const StoreContext = createContext(null);

// ── Demo credentials ─────────────────────────────────────────────────────────
export const DEMO_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Lloyds Admin',
    initials: 'LA',
    title: 'Senior Loan Admin',
    email: 'admin@lloyds.co.uk',
    branch: 'London - Canary Wharf',
  },
];

// ── Custom users (created by admin, stored in localStorage) ──────────────────
export function getCustomUsers() {
  try { return JSON.parse(localStorage.getItem('tl_custom_users') || '[]'); } catch { return []; }
}

export function saveCustomUsers(users) {
  try { localStorage.setItem('tl_custom_users', JSON.stringify(users)); } catch {}
}

export function getAllUsers() {
  return [...DEMO_USERS, ...getCustomUsers()];
}

function loadUser() {
  try { return JSON.parse(localStorage.getItem('tl_user') || 'null'); } catch { return null; }
}

export function StoreProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [currentUser, setCurrentUser] = useState(loadUser);

  const pushToast = useCallback((msg, type = 'success', txHash = null) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type, txHash }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const login = useCallback((user) => {
    setCurrentUser(user);
    try { localStorage.setItem('tl_user', JSON.stringify(user)); } catch {}
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('tl_user');
      localStorage.removeItem('tl_page');
      localStorage.removeItem('tl_params');
    } catch {}
  }, []);

  return (
    <StoreContext.Provider value={{ toasts, pushToast, dismissToast, currentUser, login, logout }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
