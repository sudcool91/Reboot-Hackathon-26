import { useState, useEffect, useCallback } from 'react';

const ADMIN_TOUR_STEPS = [
  { selector: '[data-page="dashboard"]', title: 'Everything starts here', desc: 'The sidebar is your map of the whole platform — applications, cards, the KYC registry, admin tools, and the blockchain layer, all one click away.', page: 'dashboard' },
  { selector: '.fluid-btn', title: 'The story, in motion', desc: 'This button opens a fluid, scroll-driven explainer of why the platform exists — the thread literally connects each idea as you scroll.', page: 'dashboard' },
  { selector: '.block-num', title: 'Pending queue — act fast', desc: 'The pending action queue shows every loan application waiting for your decision. Approve or reject in one click — DB updates instantly.', page: 'admin_control_center' },
  { selector: '.trail', title: 'See the proof, not just the claim', desc: 'Every credential check is a real on-chain event. The ledger explorer shows the full audit trail — who verified what, and when.', page: 'ledger_explorer' },
];

const CUSTOMER_TOUR_STEPS = [
  { selector: '[data-page="customer_dashboard"]', title: 'Your dashboard', desc: 'See your KYC status, all your loan applications, and credential share requests — all in one place. Hit Refresh any time to get the latest status.', page: 'customer_dashboard' },
  { selector: '.btn-primary', title: 'Apply for a product', desc: 'Select from personal loans, home loans, vehicle loans and business loans. Your verified identity is reused automatically — no re-uploading.', page: 'customer_application' },
  { selector: '.ncu-hero', title: 'Upload your documents once', desc: 'Submit your KYC documents here. Once approved by admin your credential is issued and reused across all Lloyds products permanently.', page: 'new_customer_upload' },
  { selector: '.trail', title: 'Your audit trail on the ledger', desc: 'Every identity check is written on-chain. View your full credential history — immutable, transparent, yours.', page: 'ledger_explorer' },
];

export default function Tour({ currentPage, onNavigate, autoStart = false, role = 'admin' }) {
  const TOUR_STEPS = role === 'customer' ? CUSTOMER_TOUR_STEPS : ADMIN_TOUR_STEPS;
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);

  // Auto-start tour on mount if requested
  useEffect(() => {
    if (autoStart) {
      const t = setTimeout(() => { setIndex(0); setActive(true); }, 300);
      return () => clearTimeout(t);
    }
  }, [autoStart]);
  const [spotlight, setSpotlight] = useState(null);
  const [cardPos, setCardPos] = useState({ top: 100, left: 100 });

  const getRect = useCallback((selector) => {
    const el = document.querySelector(selector);
    return el ? el.getBoundingClientRect() : null;
  }, []);

  const placeCard = useCallback((rect) => {
    if (!rect) return;
    const pad = 8, margin = 18, cardW = 300, cardH = 200;
    const vw = window.innerWidth, vh = window.innerHeight;
    const placements = [
      { top: rect.top, left: rect.right + 20 },
      { top: rect.bottom + 18, left: rect.left },
      { top: rect.top - cardH - 18, left: rect.left },
      { top: rect.top, left: rect.left - cardW - 20 },
    ];
    let chosen = placements[1];
    for (const p of placements) {
      if (p.left >= margin && p.left + cardW <= vw - margin && p.top >= margin && p.top + cardH <= vh - margin) { chosen = p; break; }
    }
    setCardPos({
      top: Math.min(Math.max(chosen.top, margin), vh - cardH - margin),
      left: Math.min(Math.max(chosen.left, margin), vw - cardW - margin),
    });
  }, []);

  const renderStep = useCallback((retries = 0) => {
    const step = TOUR_STEPS[index];
    const rect = getRect(step.selector);
    if (!rect) {
      if (retries < 6) setTimeout(() => renderStep(retries + 1), 150);
      return;
    }
    const pad = 8;
    setSpotlight({ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 });
    placeCard(rect);
  }, [index, getRect, placeCard]);

  useEffect(() => {
    if (!active) return;
    const step = TOUR_STEPS[index];
    if (currentPage !== step.page) {
      onNavigate(step.page);
      setTimeout(() => renderStep(0), 200);
    } else {
      renderStep(0);
    }
  }, [active, index, currentPage]);

  const startTour = () => { setIndex(0); setActive(true); };
  const next = () => {
    if (index >= TOUR_STEPS.length - 1) { setActive(false); return; }
    setSpotlight(null);
    setIndex(i => i + 1);
  };
  const end = () => setActive(false);

  return (
    <>
      {/* Tour veil */}
      <div className={`tour-veil${active ? ' active' : ''}`} />

      {/* Spotlight */}
      {active && spotlight && (
        <div className="tour-spotlight active" style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }} />
      )}

      {/* Tour card */}
      {active && (
        <div className="tour-card active" style={{ top: cardPos.top, left: cardPos.left }}>
          <div className="tour-step-label">Step {index + 1} of {TOUR_STEPS.length}</div>
          <div className="tour-title">{TOUR_STEPS[index].title}</div>
          <div className="tour-desc">{TOUR_STEPS[index].desc}</div>
          <div className="tour-foot">
            <div className="tour-dots">
              {TOUR_STEPS.map((_, i) => <div key={i} className={`tour-dot${i === index ? ' on' : ''}`} />)}
            </div>
            <div className="tour-btns">
              <button className="tour-skip" onClick={end}>Skip</button>
              <button className="tour-next" onClick={next}>{index === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Launcher */}
      {!active && (
        <button className="tour-launcher" onClick={startTour}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" fill="rgba(255,255,255,0.15)" stroke="currentColor"/>
          </svg>
          Take a tour
        </button>
      )}
    </>
  );
}
