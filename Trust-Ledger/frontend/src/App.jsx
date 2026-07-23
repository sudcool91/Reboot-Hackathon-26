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
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [tourLaunched, setTourLaunched] = useState(false);

  const navigate = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

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
          <PageComponent onNavigate={navigate} />
        </motion.div>
      </AnimatePresence>
      {tourLaunched && !isFluid && (
        <Tour currentPage={currentPage} onNavigate={navigate} autoStart={true} />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
