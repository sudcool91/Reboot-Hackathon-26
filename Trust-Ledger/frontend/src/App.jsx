import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Tour from './components/Tour';
import { ToastContainer } from './components/Toast';
import { StoreProvider, useStore } from './store';
import Dashboard from './pages/Dashboard';
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

const PAGES = {
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

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}

function AppInner() {
  const { toasts, dismissToast } = useStore();

  const [currentPage, setCurrentPage] = useState(() => {
    try { return localStorage.getItem('tl_page') || 'dashboard'; } catch { return 'dashboard'; }
  });
  const [pageParams, setPageParams] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tl_params') || '{}'); } catch { return {}; }
  });
  const [tourLaunched, setTourLaunched] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const navigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    try { localStorage.setItem('tl_page', page); localStorage.setItem('tl_params', JSON.stringify(params)); } catch {}
    window.scrollTo(0, 0);
  };

  // Global activity polling every 15s — feeds notification bell + dashboard
  useEffect(() => {
    const poll = async () => {
      const { getDashboardActivity } = await import('./services/api');
      const data = await getDashboardActivity();
      if (data) setNotifications(data.activities || data || []);
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, []);

  // Auto-launch tour after 1.1s on first load
  useEffect(() => {
    const timer = setTimeout(() => setTourLaunched(true), 1100);
    return () => clearTimeout(timer);
  }, []);

  const PageComponent = PAGES[currentPage] || Dashboard;
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
      {tourLaunched && !isFluid && (
        <Tour currentPage={currentPage} onNavigate={navigate} autoStart={true} />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
