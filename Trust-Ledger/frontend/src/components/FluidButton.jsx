export default function FluidButton({ onClick }) {
  return (
    <button className="fluid-btn" onClick={onClick}>
      <span className="fluid-btn-halo"></span>
      <span className="fluid-btn-inner">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
        </svg>
        Overview
      </span>
    </button>
  );
}
