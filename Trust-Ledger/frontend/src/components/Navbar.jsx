import FluidButton from './FluidButton';

export default function Navbar({ crumb, onFluid, variant = 'default' }) {
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
            <span><span className="pill-dot"></span>block #48,221</span>
            <span>4/4 validators</span>
          </>
        ) : (
          <>
            <span className="pill pill-live"><span className="pill-dot"></span>Network healthy</span>
            <div className="icon-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A4A40" strokeWidth="2">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
          </>
        )}
        <div className="nav-av">AK</div>
      </div>
    </div>
  );
}
