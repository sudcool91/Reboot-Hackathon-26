export default function Sidebar({ currentPage, onNavigate }) {
  const link = (page, label, badge, icon) => (
    <button
      className={`sb-link${currentPage === page ? ' on' : ''}`}
      data-page={page}
      onClick={() => onNavigate(page)}
    >
      <span className="sb-link-left">
        {icon}
        {label}
      </span>
      {badge && <span className="sb-badge-m">{badge}</span>}
    </button>
  );

  return (
    <aside className={`sidebar${currentPage === 'fluid_overview' ? ' hidden-for-fluid' : ''}`}>
      <div className="sb-brand" onClick={() => onNavigate('dashboard')}>
        <div className="sb-mark">L</div>
        <span className="sb-name">LLOYDS</span>
      </div>
      <div className="sb-tagline">DLT lending &amp; reusable KYC platform</div>

      <div className="sb-label">Platform</div>
      {link('dashboard', 'Dashboard', null,
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
          <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
        </svg>
      )}
      {link('loan_applications', 'Loan applications', '47',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/>
        </svg>
      )}
      {link('credit_cards', 'Credit cards', '23',
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

      <div className="sb-foot">
        <div className="sb-av">AK</div>
        <div>
          <div className="sb-fname">Anita Kulkarni</div>
          <div className="sb-frole">Senior loan admin</div>
        </div>
      </div>
    </aside>
  );
}
