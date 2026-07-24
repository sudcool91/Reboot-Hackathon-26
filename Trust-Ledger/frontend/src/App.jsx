import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Tour from './components/Tour';
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

  // Global activity polling every 15s
  useEffect(() => {
    if (!currentUser) return;
    const poll = async () => {
      const { getDashboardActivity } = await import('./services/api');
      const data = await getDashboardActivity();
      if (data) setNotifications(data.activities || data || []);
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, [currentUser]);

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
        <Tour currentPage={currentPage} onNavigate={navigate} autoStart={tourLaunched} role={currentUser?.role} />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
