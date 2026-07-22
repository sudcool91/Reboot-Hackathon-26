import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function FluidOverview({ onNavigate }) {
  const threadFillRef = useRef(null);
  const threadFlameRef = useRef(null);
  const threadWrapRef = useRef(null);
  const spineSectionRef = useRef(null);
  const stemRowsRef = useRef([]);
  const futureSectionRef = useRef(null);

  useEffect(() => {
    const updateThread = () => {
      const spineSection = spineSectionRef.current;
      const threadFill = threadFillRef.current;
      const threadFlame = threadFlameRef.current;
      const threadWrap = threadWrapRef.current;
      if (!spineSection || !threadFill) return;

      const spineRect = spineSection.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const triggerLine = viewportH * 0.55;

      const scrolledIntoSpine = triggerLine - spineRect.top;
      const clamped = Math.min(Math.max(scrolledIntoSpine, 0), spineRect.height);
      const active = scrolledIntoSpine > 0 && scrolledIntoSpine < spineRect.height;

      if (threadWrap) threadWrap.classList.toggle('visible', scrolledIntoSpine > -40);
      threadFill.style.height = clamped + 'px';
      if (threadFlame) {
        threadFlame.style.top = clamped + 'px';
        threadFlame.classList.toggle('visible', active);
      }

      stemRowsRef.current.forEach(row => {
        if (!row) return;
        const r = row.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const shouldBeLit = center < triggerLine;
        row.classList.toggle('lit', shouldBeLit);
        const node = row.querySelector('.stem-node');
        if (node) node.classList.toggle('lit', shouldBeLit);
      });

      const futureSection = futureSectionRef.current;
      if (futureSection) {
        const fr = futureSection.getBoundingClientRect();
        const inView = fr.top < viewportH * 0.78 && fr.bottom > viewportH * 0.22;
        futureSection.classList.toggle('in', inView);
      }
    };

    window.addEventListener('scroll', updateThread, { passive: true });
    window.addEventListener('resize', updateThread);
    updateThread();
    return () => {
      window.removeEventListener('scroll', updateThread);
      window.removeEventListener('resize', updateThread);
    };
  }, []);

  return (
    <div className="fluid-page">
      <div className="fluid-bg-glow"></div>
      <div className="fluid-grain"></div>

      <button className="fluid-back" onClick={() => onNavigate('dashboard')}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Back to platform
      </button>

      {/* Hero */}
      <section className="fluid-hero">
        <div className="fluid-eyebrow">Distributed ledger technology · explained in 90 seconds</div>
        <h1 className="fluid-title">Verify once.<br/>Trust <span className="accent">everywhere</span>.</h1>
        <p className="fluid-subtitle">A KYC credential, issued once by Lloyds, cryptographically provable, never re-checked from scratch again. Follow the thread.</p>
        <div className="scroll-cue">
          <span>Scroll to follow the thread</span>
          <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
            <rect x="1" y="1" width="12" height="18" rx="6" stroke="#6FB897" strokeWidth="1.3"/>
            <circle cx="7" cy="6" r="1.6" fill="#4FD89A"/>
          </svg>
        </div>
      </section>

      {/* Spine section */}
      <div className="spine-section" ref={spineSectionRef}>
        {/* Thread */}
        <div className="thread-wrap" ref={threadWrapRef}>
          <div className="thread-track"></div>
          <div className="thread-fill" ref={threadFillRef}></div>
          <div className="thread-flame" ref={threadFlameRef}>
            <div className="flame-glow-halo"></div>
            <svg viewBox="0 0 40 56" style={{filter:'drop-shadow(0 0 6px rgba(232,124,42,0.6))'}}>
              <defs>
                <radialGradient id="flameOuterGrad" cx="50%" cy="78%" r="65%">
                  <stop offset="0%" stopColor="#FFD27A"/>
                  <stop offset="35%" stopColor="#F2954A"/>
                  <stop offset="75%" stopColor="#D9622B"/>
                  <stop offset="100%" stopColor="#B8451E"/>
                </radialGradient>
                <radialGradient id="flameMidGrad" cx="50%" cy="82%" r="60%">
                  <stop offset="0%" stopColor="#FFF4D6"/>
                  <stop offset="40%" stopColor="#FFC65C"/>
                  <stop offset="100%" stopColor="#F2954A"/>
                </radialGradient>
                <radialGradient id="flameCoreGrad" cx="50%" cy="88%" r="55%">
                  <stop offset="0%" stopColor="#FFFFFF"/>
                  <stop offset="50%" stopColor="#FFF0C2"/>
                  <stop offset="100%" stopColor="#FFD27A"/>
                </radialGradient>
              </defs>
              <path fill="url(#flameOuterGrad)" opacity="0.92">
                <animate attributeName="d" dur="0.9s" repeatCount="indefinite"
                  values="M20 4 C9 16 5 28 7 38 C9 48 14 53 20 53 C26 53 31 48 33 38 C35 28 31 16 20 4Z;M20 6 C11 17 6 27 8 37 C10 47 14 52 20 52 C27 52 32 46 32 37 C33 27 29 15 20 6Z;M20 3 C8 15 4 29 6 39 C8 49 15 54 20 54 C25 54 32 49 34 39 C36 28 30 14 20 3Z;M20 4 C9 16 5 28 7 38 C9 48 14 53 20 53 C26 53 31 48 33 38 C35 28 31 16 20 4Z"/>
              </path>
              <path fill="url(#flameMidGrad)" opacity="0.95">
                <animate attributeName="d" dur="0.65s" repeatCount="indefinite"
                  values="M20 12 C13 21 10 30 11 37 C12 45 16 49 20 49 C24 49 28 45 29 37 C30 30 26 20 20 12Z;M20 14 C14 22 11 29 12 36 C13 44 16 48 20 48 C25 48 29 43 28 36 C28 29 25 21 20 14Z;M20 11 C12 20 9 31 10 38 C11 46 16 50 20 50 C24 50 29 45 30 38 C31 30 27 19 20 11Z;M20 12 C13 21 10 30 11 37 C12 45 16 49 20 49 C24 49 28 45 29 37 C30 30 26 20 20 12Z"/>
              </path>
              <path fill="url(#flameCoreGrad)">
                <animate attributeName="d" dur="0.5s" repeatCount="indefinite"
                  values="M20 24 C16 29 15 35 16 39 C17 44 18 46 20 46 C22 46 23 44 24 39 C25 35 23 28 20 24Z;M20 26 C17 30 16 35 17 38 C18 43 18 45 20 45 C22 45 22 43 23 38 C23 34 22 29 20 26Z;M20 23 C15 28 14 36 15 40 C16 45 18 47 20 47 C22 47 24 44 25 40 C26 35 24 27 20 23Z;M20 24 C16 29 15 35 16 39 C17 44 18 46 20 46 C22 46 23 44 24 39 C25 35 23 28 20 24Z"/>
              </path>
            </svg>
            <span className="ember ember-1"></span>
            <span className="ember ember-2"></span>
            <span className="ember ember-3"></span>
          </div>
        </div>

        {/* Stem rows */}
        {[
          { dir: 'left', tag: 'The old way', h: 'Every bank starts from zero.', p: 'Same passport. Same utility bill. Same address proof — re-uploaded and re-checked every single time a customer applies somewhere new.', stat: { num: '48', label: 'hours, on average' } },
          { dir: 'right', tag: 'The Lloyds way', h: 'Verified once. Remembered forever.', p: 'The credential is hashed, signed, and committed to a shared ledger — any connected institution can confirm it\'s real without touching the documents.', stat: { num: '4.2', label: 'minutes, on-chain' } },
          { dir: 'left', tag: 'What stays private', h: 'Only proof travels. Never the documents.', p: 'Document hashes live on-chain. The actual identity documents and bank statements stay encrypted off-chain — no personally identifiable information ever touches the ledger.', stat: null },
          { dir: 'right', tag: 'Who can check it', h: 'Built for regulators, not against them.', p: 'A regulator runs its own observer node and sees the same verified history as everyone else — transparency without needing special access.', stat: null },
        ].map((row, i) => (
          <div key={i} className={`stem-row ${row.dir}`} ref={el => stemRowsRef.current[i] = el} data-stem={i}>
            {row.dir === 'left' && (
              <>
                <div className="stem-card">
                  <div className="stem-tag">{row.tag}</div>
                  <div className="stem-h">{row.h}</div>
                  <p className="stem-p">{row.p}</p>
                  {row.stat && <div className="stem-stat"><span className="stem-stat-num">{row.stat.num}</span><span className="stem-stat-label">{row.stat.label}</span></div>}
                </div>
                <div className="stem-node-col"><div className="stem-node"></div></div>
                <div className="stem-branch"></div>
              </>
            )}
            {row.dir === 'right' && (
              <>
                <div className="stem-node-col"><div className="stem-node"></div></div>
                <div className="stem-branch"></div>
                <div className="stem-card">
                  <div className="stem-tag">{row.tag}</div>
                  <div className="stem-h">{row.h}</div>
                  <p className="stem-p">{row.p}</p>
                  {row.stat && <div className="stem-stat"><span className="stem-stat-num">{row.stat.num}</span><span className="stem-stat-label">{row.stat.label}</span></div>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Future section */}
      <section className="future-section" ref={futureSectionRef}>
        <div className="future-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
          On the roadmap
        </div>
        <h2 className="future-h">Today it's one bank.<br/>Tomorrow it's <span className="accent">every bank.</span></h2>
        <p className="future-sub">The same credential Lloyds issues can be designed to extend across the industry — a shared trust network where any participating bank, NBFC, or fintech recognizes a customer's verified identity instantly.</p>

        <div className="bank-web">
          <svg viewBox="0 0 880 360">
            <path className="web-path" d="M440,180 L160,80"/>
            <path className="web-path" d="M440,180 L160,280"/>
            <path className="web-path" d="M440,180 L720,80"/>
            <path className="web-path" d="M440,180 L720,280"/>
            <path className="web-path" d="M440,180 L440,40"/>
            <path className="web-path" d="M160,80 L160,280" strokeDasharray="3 5"/>
            <path className="web-path" d="M720,80 L720,280" strokeDasharray="3 5"/>
            <circle className="web-particle" r="3" fill="#4FD89A"><animateMotion dur="3.4s" repeatCount="indefinite" path="M440,180 L160,80"/></circle>
            <circle className="web-particle" r="3" fill="#4FD89A"><animateMotion dur="3.4s" begin="0.6s" repeatCount="indefinite" path="M440,180 L160,280"/></circle>
            <circle className="web-particle" r="3" fill="#4FD89A"><animateMotion dur="3.4s" begin="1.2s" repeatCount="indefinite" path="M440,180 L720,80"/></circle>
            <circle className="web-particle" r="3" fill="#4FD89A"><animateMotion dur="3.4s" begin="1.8s" repeatCount="indefinite" path="M440,180 L720,280"/></circle>
            <circle className="web-particle" r="2.5" fill="#9FC9B3"><animateMotion dur="3.4s" begin="2.4s" repeatCount="indefinite" path="M440,180 L440,40"/></circle>
            <circle className="web-node-ring" cx="440" cy="180" r="32" stroke="#4FD89A"/>
            <circle cx="440" cy="180" r="32" fill="#0F5A3E" stroke="#4FD89A" strokeWidth="1.5"/>
            <text x="440" y="175" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#F2F0E6" fontFamily="-apple-system,sans-serif">LLOYDS</text>
            <text x="440" y="188" textAnchor="middle" fontSize="9" fill="#9FC9B3" fontFamily="-apple-system,sans-serif">issuer node</text>
            <circle cx="440" cy="40" r="18" fill="#0E2A1F" stroke="rgba(255,255,255,0.25)"/>
            <text x="440" y="44" textAnchor="middle" fontSize="8" fill="#B9D4C5" fontFamily="-apple-system,sans-serif">Regulator</text>
            <circle cx="160" cy="80" r="20" fill="#0E2A1F" stroke="rgba(255,255,255,0.25)"/>
            <text x="160" y="84" textAnchor="middle" fontSize="8.5" fill="#B9D4C5" fontFamily="-apple-system,sans-serif">Bank B</text>
            <circle cx="160" cy="280" r="20" fill="#0E2A1F" stroke="rgba(255,255,255,0.25)"/>
            <text x="160" y="284" textAnchor="middle" fontSize="8.5" fill="#B9D4C5" fontFamily="-apple-system,sans-serif">NBFC</text>
            <circle cx="720" cy="80" r="20" fill="#0E2A1F" stroke="rgba(255,255,255,0.25)"/>
            <text x="720" y="84" textAnchor="middle" fontSize="8.5" fill="#B9D4C5" fontFamily="-apple-system,sans-serif">Bank C</text>
            <circle cx="720" cy="280" r="20" fill="#0E2A1F" stroke="rgba(255,255,255,0.25)"/>
            <text x="720" y="284" textAnchor="middle" fontSize="8" fill="#B9D4C5" fontFamily="-apple-system,sans-serif">Fintech</text>
          </svg>
        </div>

        <div className="future-benefits">
          {[
            { num: '01', h: 'One KYC, industry-wide', p: 'A customer verified at Lloyds never repeats the process at a partner bank, NBFC, or fintech on the network.' },
            { num: '02', h: 'Shared fraud signal', p: 'A revoked or flagged credential is visible across every participating institution instantly — not siloed at one bank.' },
            { num: '03', h: 'Faster onboarding, lower cost', p: 'Every institution on the network saves the cost of re-verifying identity that\'s already been cryptographically proven.' },
          ].map((c, i) => (
            <div key={i} className="fb-card">
              <div className="fb-num">{c.num}</div>
              <div className="fb-h">{c.h}</div>
              <div className="fb-p">{c.p}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="fluid-closing">
        <p className="closing-quote">This isn't a faster form.<br/>It's a <span className="accent">trust layer</span> the entire lending industry can finally share.</p>
        <div className="closing-cta">
          <button className="cta-btn cta-primary" onClick={() => onNavigate('dashboard')}>Walk through the platform →</button>
          <button className="cta-btn cta-ghost" onClick={() => onNavigate('ledger_explorer')}>Inspect the ledger</button>
        </div>
      </section>
    </div>
  );
}
