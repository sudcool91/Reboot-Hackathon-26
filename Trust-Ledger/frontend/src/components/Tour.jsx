import { useState, useEffect, useCallback } from 'react';

const TOUR_STEPS = [
  { selector: '[data-page="dashboard"]', title: 'Everything starts here', desc: 'The sidebar is your map of the whole platform — applications, cards, the KYC registry, admin tools, and the blockchain layer, all one click away.', page: 'dashboard' },
  { selector: '.fluid-btn', title: 'The story, in motion', desc: 'This button opens a fluid, scroll-driven explainer of why the platform exists — the thread literally connects each idea as you scroll.', page: 'dashboard' },
  { selector: '.ncu-hero', title: 'A clear path for new customers', desc: 'First-time applicants upload documents here in one guided flow — clean steps, live progress, and no confusion about what is still needed.', page: 'new_customer_upload' },
  { selector: '.role-card.mine', title: 'Built for admins, with real control', desc: 'Admins see exactly what they are allowed to do — roles, permissions, and policy rules are explicit, not buried in settings.', page: 'admin_control_center' },
  { selector: '.trail', title: 'See the proof, not just the claim', desc: 'Every credential check is a real on-chain event. The ledger explorer shows the full audit trail — who verified what, and when.', page: 'ledger_explorer' },
];

export default function Tour({ currentPage, onNavigate, autoStart = false }) {
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
            <circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4"/>
            <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
          </svg>
          Take a tour
        </button>
      )}
    </>
  );
}
