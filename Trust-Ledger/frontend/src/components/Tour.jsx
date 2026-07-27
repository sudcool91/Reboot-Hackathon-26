import { useState, useEffect, useCallback } from 'react';

const ADMIN_TOUR_STEPS = [
  { selector: '[data-page="dashboard"]', title: 'Everything starts here', desc: 'The sidebar is your map of the whole platform — applications, cards, the KYC registry, admin tools, and the blockchain layer, all one click away.', page: 'dashboard', icon: '🗺️' },
  { selector: '.fluid-btn', title: 'The story, in motion', desc: 'This button opens a fluid, scroll-driven explainer of why the platform exists — the thread literally connects each idea as you scroll.', page: 'dashboard', icon: '🎬' },
  { selector: '.block-num', title: 'Pending queue — act fast', desc: 'The pending action queue shows every loan application waiting for your decision. Approve or reject in one click — DB updates instantly.', page: 'admin_control_center', icon: '⚡' },
  { selector: '.trail', title: 'See the proof, not just the claim', desc: 'Every credential check is a real on-chain event. The ledger explorer shows the full audit trail — who verified what, and when.', page: 'ledger_explorer', icon: '🔗' },
];

const CUSTOMER_TOUR_STEPS = [
  // ── 3 steps on the customer dashboard ──────────────────────────────────
  {
    selector: '[data-tour="cd-hero"]',
    title: 'Welcome to your dashboard',
    desc: 'Your personal Lloyds DLT hub. Check KYC verification status, track all loan applications, and apply for new products across the entire Lloyds Banking Group — all from one place.',
    page: 'customer_dashboard',
    icon: '🏠',
    tag: 'Dashboard',
  },
  {
    selector: '[data-tour="cd-stats"]',
    title: 'Your live status at a glance',
    desc: 'Three real-time metrics: your KYC credential status (verified / pending / not issued), total product applications submitted, and how many banks your identity has been shared with.',
    page: 'customer_dashboard',
    icon: '📊',
    tag: 'Stats',
  },
  {
    selector: '[data-tour="cd-kyc"]',
    title: 'Your reusable identity credential',
    desc: 'Once admin approves your documents, your KYC credential is written to the blockchain — permanently. Every future Lloyds product application auto-attaches it. Upload once, reuse forever.',
    page: 'customer_dashboard',
    icon: '🔐',
    tag: 'KYC Credential',
  },
  // ── 3 steps on sidebar / navbar elements ───────────────────────────────
  {
    selector: '[data-tour="sb-customer-nav"]',
    title: 'Your navigation menu',
    desc: 'My Dashboard, Apply for product, Upload KYC documents, and the Ledger Explorer are always one click away in this sidebar. Navigate between them at any time — no data is lost.',
    page: 'customer_dashboard',
    icon: '🗺️',
    tag: 'Navigation',
  },
  {
    selector: '[data-tour="nav-bell"]',
    title: 'Notifications & activity feed',
    desc: 'The bell icon shows real-time notifications — KYC approved, loan decision made, credential share request received. The red badge count tells you how many unread events are waiting.',
    page: 'customer_dashboard',
    icon: '🔔',
    tag: 'Notifications',
  },
  {
    selector: '[data-tour="nav-wallet"]',
    title: 'Your blockchain wallet & profile',
    desc: 'Click your avatar to open your Hyperledger Fabric crypto wallet — showing your on-chain address, balance, and identity hash. This is your cryptographic proof of identity on the DLT network.',
    page: 'customer_dashboard',
    icon: '💳',
    tag: 'Wallet & Profile',
  },
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
    const margin = 18, cardW = 320, cardH = 240;
    const vw = window.innerWidth, vh = window.innerHeight;
    const placements = [
      { top: rect.top, left: rect.right + 20 },
      { top: rect.bottom + 18, left: rect.left },
      { top: rect.top - cardH - 18, left: rect.left },
      { top: rect.top, left: rect.left - cardW - 20 },
      { top: vh / 2 - cardH / 2, left: vw / 2 - cardW / 2 },
    ];
    let chosen = placements[4];
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
      if (retries < 12) setTimeout(() => renderStep(retries + 1), 250);
      return;
    }
    const pad = 10;
    setSpotlight({ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 });
    placeCard(rect);
  }, [index, getRect, placeCard, TOUR_STEPS]);

  useEffect(() => {
    if (!active) return;
    const step = TOUR_STEPS[index];
    if (currentPage !== step.page) {
      onNavigate(step.page);
      setTimeout(() => renderStep(0), 450);
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

  const step = TOUR_STEPS[index];
  const pct = ((index) / (TOUR_STEPS.length - 1)) * 100;

  return (
    <>
      {/* Tour veil */}
      <div className={`tour-veil${active ? ' active' : ''}`} />

      {/* Spotlight */}
      {active && spotlight && (
        <div className="tour-spotlight active" style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }} />
      )}

      {/* Tour card — enhanced */}
      {active && (
        <div className="tour-card active" style={{ top: cardPos.top, left: cardPos.left, width: 320 }}>
          {/* Top accent bar */}
          <div style={{ margin: '-1.4rem -1.5rem 1rem', borderRadius: '16px 16px 0 0', background: 'linear-gradient(90deg,#024731,#0B5C3F)', padding: '12px 18px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              {step.icon}
            </div>
            <div>
              <div style={{ fontSize: 9.5, color: '#8FCBAE', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
                Step {index + 1} of {TOUR_STEPS.length}
                {step.tag && <span style={{ marginLeft: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '1px 8px' }}>{step.tag}</span>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{step.title}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ margin: '-0.2rem -1.5rem 1rem', height: 3, background: '#E2E0D2' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#024731,#22C55E)', borderRadius: 2, width: `${pct}%`, transition: 'width 0.4s ease' }} />
          </div>

          <div className="tour-desc" style={{ fontSize: 13, lineHeight: 1.6 }}>{step.desc}</div>

          <div className="tour-foot">
            <div className="tour-dots">
              {TOUR_STEPS.map((_, i) => (
                <div key={i} className={`tour-dot${i === index ? ' on' : ''}`}
                  style={{ cursor: 'pointer', width: i === index ? 18 : 6, borderRadius: i === index ? 3 : '50%', transition: 'all 0.25s' }}
                  onClick={() => { setSpotlight(null); setIndex(i); }} />
              ))}
            </div>
            <div className="tour-btns">
              <button className="tour-skip" onClick={end}>Skip</button>
              <button className="tour-next" style={{ padding: '8px 20px', fontSize: 13 }} onClick={next}>
                {index === TOUR_STEPS.length - 1 ? '🎉 Finish' : 'Next →'}
              </button>
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

