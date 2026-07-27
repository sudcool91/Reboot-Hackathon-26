import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Tour from './components/Tour';
import Chatbot from './components/Chatbot';
import { ToastContainer } from './components/Toast';
import { StoreProvider, useStore } from './store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import LoanApplications from './pages/LoanApplications';
import CreditCards from './pages/CreditCards';
import KycRegistry from './pages/KycRegistry';
import AdminControlCenter from './pages/AdminControlCenter';
import LedgerExplorer from './pages/LedgerExplorer';
import NewCustomerUpload from './pages/NewCustomerUpload';
import LoanDecision from './pages/LoanDecision';
import FluidOverview from './pages/FluidOverview';
import CustomerApplication from './pages/CustomerApplication';
import FabricTest from './pages/FabricTest';
import FutureRoadmap from './pages/FutureRoadmap';
import horseLogo from './assets/lloyds-horse.gif';

// ── App-wide loading splash ──────────────────────────────────────────────────
function LoadingSplash({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(2, 30, 18, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 24,
          }}
        >
          <motion.img
            src={horseLogo}
            alt="Loading…"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ width: 120, height: 120, objectFit: 'contain', filter: 'drop-shadow(0 0 32px rgba(110,231,183,0.5))' }}
          />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ color: '#6EE7B7', fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'inherit' }}
          >
            Loading Trust Ledger…
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Pages accessible to admin
const ADMIN_PAGES = {
  dashboard: Dashboard,
  loan_applications: LoanApplications,
  credit_cards: CreditCards,
  kyc_registry: KycRegistry,
  admin_control_center: AdminControlCenter,
  ledger_explorer: LedgerExplorer,
  new_customer_upload: NewCustomerUpload,
  loan_decision: LoanDecision,
  fluid_overview: FluidOverview,
  customer_application: CustomerApplication,
  fabric_test: FabricTest,
  future_roadmap: FutureRoadmap,
};

// Pages accessible to customer
const CUSTOMER_PAGES = {
  customer_dashboard: CustomerDashboard,
  customer_application: CustomerApplication,
  new_customer_upload: NewCustomerUpload,   // customers self-upload their own docs
  kyc_registry: KycRegistry,
  ledger_explorer: LedgerExplorer,
  loan_decision: LoanDecision,
  fluid_overview: FluidOverview,
  future_roadmap: FutureRoadmap,
};

// Hash ↔ page mapping helpers
function pageToHash(role, page) {
  if (!role) return '#/login';
  return `#/${role}/${page}`;
}
function hashToPage(hash, role, PAGES, defaultPage) {
  // expected: #/admin/dashboard  or  #/customer/customer_dashboard
  const parts = (hash || '').replace('#/', '').split('/');
  const page = parts.slice(1).join('/') || defaultPage;
  return PAGES[page] ? page : defaultPage;
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}

function AppInner() {
  const { toasts, dismissToast, currentUser } = useStore();

  const [appLoading, setAppLoading] = useState(true);

  // Show splash on first mount for ~1.8s
  useEffect(() => {
    const t = setTimeout(() => setAppLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const isAdmin = currentUser?.role === 'admin';
  const isCustomer = currentUser?.role === 'customer';
  const PAGES = isAdmin ? ADMIN_PAGES : CUSTOMER_PAGES;
  const defaultPage = isAdmin ? 'dashboard' : 'customer_dashboard';

  const [currentPage, setCurrentPage] = useState(() => {
    if (!currentUser) return defaultPage;
    const PAGES = isAdmin ? ADMIN_PAGES : CUSTOMER_PAGES;
    const hash = window.location.hash;
    if (hash) return hashToPage(hash, currentUser.role, PAGES, defaultPage);
    try {
      const saved = localStorage.getItem('tl_page');
      return (saved && PAGES[saved]) ? saved : defaultPage;
    } catch { return defaultPage; }
  });
  const [pageParams, setPageParams] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tl_params') || '{}'); } catch { return {}; }
  });
  const [tourLaunched, setTourLaunched] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Sync URL hash whenever page changes
  useEffect(() => {
    if (!currentUser) {
      window.location.hash = '#/login';
    } else {
      window.location.hash = pageToHash(currentUser.role, currentPage);
    }
  }, [currentPage, currentUser]);

  // Listen for browser back/forward
  useEffect(() => {
    const onHash = () => {
      if (!currentUser) return;
      const PAGES = isAdmin ? ADMIN_PAGES : CUSTOMER_PAGES;
      const page = hashToPage(window.location.hash, currentUser.role, PAGES, defaultPage);
      setCurrentPage(page);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [currentUser, isAdmin, defaultPage]);

  // Reset page when user changes (login/logout)
  useEffect(() => {
    const def = isAdmin ? 'dashboard' : 'customer_dashboard';
    setCurrentPage(def);
    setPageParams({});
  }, [currentUser?.username]);

  const navigate = (page, params = {}) => {
    const allowed = isAdmin ? ADMIN_PAGES : CUSTOMER_PAGES;
    const target = allowed[page] ? page : defaultPage;
    setCurrentPage(target);
    setPageParams(params);
    try { localStorage.setItem('tl_page', target); localStorage.setItem('tl_params', JSON.stringify(params)); } catch {}
    window.scrollTo(0, 0);
  };

  // Global activity polling every 15s — admin sees all, customer sees their own
  useEffect(() => {
    if (!currentUser) return;
    const poll = async () => {
      const { getDashboardActivity, getKycRequests, getLoanApplications, getShareRequests, getShareRequestsByEmail, getKycRequestsByEmail } = await import('./services/api');
      try {
        if (isAdmin) {
          // Admin: build notifications from all pending/decided requests
          const [kycReqs, loans, shares] = await Promise.all([
            getKycRequests().catch(() => []),
            getLoanApplications().catch(() => []),
            getShareRequests().catch(() => []),
          ]);
          const notifs = [
            ...(Array.isArray(kycReqs) ? kycReqs : []).map(r => ({
              id: 'kyc_' + r.id, type: r.status === 'pending' ? 'warn' : r.status === 'approved' ? 'success' : 'error',
              msg: r.status === 'pending'
                ? `KYC request from ${r.customerName} — pending review`
                : `KYC ${r.status} for ${r.customerName}`,
              time: r.createdAt,
            })),
            ...(Array.isArray(loans) ? loans : []).map(a => ({
              id: 'loan_' + (a.applicationId || a.id), type: ['pending','pending docs','manual review'].includes((a.status||'').toLowerCase()) ? 'warn' : 'info',
              msg: `${a.productType || a.product || 'Application'} from ${a.customerName || a.applicantName} — ${a.status || 'pending'}`,
              time: a.createdAt,
            })),
            ...(Array.isArray(shares) ? shares : []).map(r => ({
              id: 'share_' + r.id, type: r.status === 'pending' ? 'warn' : r.status === 'approved' ? 'success' : 'error',
              msg: `Credential share for ${r.customerName} → ${r.targetBank} — ${r.status}`,
              time: r.createdAt,
            })),
          ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 20);
          setNotifications(notifs);
        } else {
          // Customer: only their own activity
          const email = currentUser.email;
          const [kycReqs, loans, shares] = await Promise.all([
            email ? getKycRequestsByEmail(email).catch(() => []) : Promise.resolve([]),
            getLoanApplications(email).catch(() => []),
            email ? getShareRequestsByEmail(email).catch(() => []) : Promise.resolve([]),
          ]);
          const notifs = [
            ...(Array.isArray(kycReqs) ? kycReqs : []).map(r => ({
              id: 'kyc_' + r.id, type: r.status === 'pending' ? 'warn' : r.status === 'approved' ? 'success' : 'error',
              msg: r.status === 'approved' ? 'Your KYC credential has been issued!' : r.status === 'rejected' ? 'Your KYC request was rejected' : 'KYC document review in progress',
              time: r.createdAt,
            })),
            ...(Array.isArray(loans) ? (Array.isArray(loans) ? loans : loans.applications || []) : []).filter(a =>
              !email || a.email?.toLowerCase() === email.toLowerCase() || a.applicantName?.toLowerCase() === currentUser.name?.toLowerCase()
            ).map(a => ({
              id: 'loan_' + (a.applicationId || a.id), type: a.status === 'Approved' ? 'success' : a.status === 'Rejected' ? 'error' : 'info',
              msg: `${a.productType || a.product || 'Application'} — ${a.status || 'submitted'}`,
              time: a.createdAt,
            })),
            ...(Array.isArray(shares) ? shares : []).map(r => ({
              id: 'share_' + r.id, type: r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warn',
              msg: `Credential share with ${r.targetBank} — ${r.status}`,
              time: r.createdAt,
            })),
          ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 15);
          setNotifications(notifs);
        }
      } catch (e) {
        const data = await getDashboardActivity().catch(() => null);
        if (data) setNotifications(data.activities || data || []);
      }
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, [currentUser, isAdmin]);

  // Auto-launch tour after 1.1s on first login (admin only) — once per session
  useEffect(() => {
    if (!isAdmin) return;
    const sessionKey = `tl_tour_done_${currentUser?.username}`;
    const done = sessionStorage.getItem(sessionKey);
    if (done) return; // already ran this session
    const timer = setTimeout(() => {
      setTourLaunched(true);
      sessionStorage.setItem(sessionKey, '1');
    }, 1100);
    return () => clearTimeout(timer);
  }, [isAdmin, currentUser?.username]);

  // Customer tour - once per session
  useEffect(() => {
    if (!isCustomer) return;
    const sessionKey = `tl_ctour_done_${currentUser?.username}`;
    const done = sessionStorage.getItem(sessionKey);
    if (done) return;
    const timer = setTimeout(() => {
      setTourLaunched(true);
      sessionStorage.setItem(sessionKey, '1');
    }, 1100);
    return () => clearTimeout(timer);
  }, [isCustomer, currentUser?.username]);

  // Not logged in — show login
  if (!currentUser) {
    return (
      <>
        <LoadingSplash visible={appLoading} />
        <Login />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const PageComponent = PAGES[currentPage] || (isAdmin ? Dashboard : CustomerDashboard);
  const isFluid = currentPage === 'fluid_overview';

  return (
    <>
      <Sidebar currentPage={currentPage} onNavigate={navigate} />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          className={`page-wrap${isFluid ? ' fluid' : ''}`}
          initial={{ opacity: 0, y: isFluid ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: isFluid ? 0.5 : 0.28 }}
        >
          <PageComponent onNavigate={navigate} params={pageParams} notifications={notifications} />
        </motion.div>
      </AnimatePresence>
      {!isFluid && (isAdmin || isCustomer) && (
        <Chatbot />
      )}
      {!isFluid && (isAdmin || isCustomer) && (
        <Tour currentPage={currentPage} onNavigate={navigate} autoStart={tourLaunched} role={currentUser?.role} />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <LoadingSplash visible={appLoading} />
    </>
  );
}
