import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';

const ROADMAP = [
  {
    id: 'fraud_protection',
    label: 'Fraud & Scam Protection',
    icon: '🛡️',
    color: '#DC2626',
    lightBg: '#FFF5F5',
    border: '#FFCDD0',
    tag: 'AI + DLT',
    phase: 'Next release',
    phaseColor: '#DC2626',
    headline: 'Real-time AI fraud shield on the ledger',
    desc: 'Every transaction is analysed in real-time against a federated fraud model trained across all LBG entities — without ever sharing raw customer data. Suspicious patterns are flagged on-chain and instantly frozen, with a full immutable audit trail.',
    benefits: ['Sub-100ms fraud detection', 'Privacy-preserving federated AI', 'Cross-bank anomaly correlation', 'Immutable incident ledger'],
    techStack: 'Federated ML · Hyperledger Fabric · Real-time event streams',
    vision: 'Protecting over 26 million Lloyds customers from financial crime using blockchain-backed AI — a first for any UK high street bank.',
  },
  {
    id: 'digital_will',
    label: 'Digital Will',
    icon: '📜',
    color: '#6B46C1',
    lightBg: '#F5F0FF',
    border: '#D8C8FF',
    tag: 'Smart Contracts',
    phase: 'In planning',
    phaseColor: '#6B46C1',
    headline: 'Your will, immutable on-chain',
    desc: 'Create and store a legally binding digital will on the Hyperledger Fabric network. Assets, beneficiaries, and conditions are encoded as smart contracts — automatically executed upon verified proof of death, with no intermediary required.',
    benefits: ['Zero probate delays', 'Tamper-proof on-chain storage', 'Auto-execution via smart contract', 'Multi-signature beneficiary approval'],
    techStack: 'Hyperledger Fabric · Smart Contracts · ZK Proofs · DIDs',
    vision: 'Making estate management instant, transparent, and free from legal intermediaries for all LBG customers.',
  },
  {
    id: 'fixed_deposits',
    label: 'Fixed Deposits (FDs)',
    icon: '🏦',
    color: '#059669',
    lightBg: '#F0FBF6',
    border: '#B8E8D0',
    tag: 'KYC-Enabled Banking',
    phase: 'Research',
    phaseColor: '#059669',
    headline: 'FDs without re-KYC across Lloyds Group',
    desc: 'Standard fixed deposits offered by Lloyds Banking Group — no blockchain issuance. The innovation is that your KYC Credential is reused automatically, so you can open FDs across any LBG entity instantly without submitting documents again.',
    benefits: ['Zero re-KYC friction', 'Instant cross-entity FD opening', 'Reusable KYC Credential', 'Standard FD rates & FSCS protection'],
    techStack: 'Hyperledger Fabric · KYC Credentials · Reusable Identity',
    vision: 'Eliminating the friction of repeated identity checks — open fixed deposits across the entire Lloyds Group with a single verified credential.',
  },
  {
    id: 'corporate_bonds',
    label: 'Corporate Bonds',
    icon: '📈',
    color: '#1D4ED8',
    lightBg: '#EFF6FF',
    border: '#BFDBFE',
    tag: 'KYC-Enabled Capital Markets',
    phase: 'Exploration',
    phaseColor: '#1D4ED8',
    headline: 'Corporate bonds with KYC-powered onboarding',
    desc: 'Standard Lloyds Banking Group corporate bonds — not issued on Fabric. The DLT innovation is in compliance: your reusable KYC Credential eliminates the lengthy investor onboarding process, allowing instant verification across bond issuances.',
    benefits: ['No re-KYC per issuance', 'Instant investor onboarding', 'Reusable KYC Credential', 'Standard bond terms & FCA compliance'],
    techStack: 'Hyperledger Fabric · KYC Credentials · ISO 20022',
    vision: 'Bringing frictionless capital markets onboarding to LBG — verified once, invest anywhere across the Lloyds Group bond universe.',
  },
];

const TIMELINE = [
  { label: 'Now', desc: 'KYC credentials, multi-bank product marketplace, on-chain identity', color: '#024731', active: true },
  { label: 'Next', desc: 'Fraud & Scam Protection AI layer, enhanced credential portability', color: '#DC2626', active: false },
  { label: 'Soon', desc: 'Digital Will smart contracts, KYC-enabled Fixed Deposits', color: '#6B46C1', active: false },
  { label: 'Future', desc: 'Corporate Bond issuance, cross-border DLT settlements', color: '#1D4ED8', active: false },
];

function ProductCard({ p, expanded, onToggle }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#fff', border: `1.5px solid ${expanded ? p.color + '44' : '#E8E6DC'}`,
        borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
        boxShadow: expanded ? `0 8px 32px ${p.color}18` : '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      onClick={onToggle}
    >
      {/* Colour stripe */}
      <div style={{ height: 4, background: p.color, opacity: 0.8 }} />

      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: p.lightBg, border: `1.5px solid ${p.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
              {p.icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A14', lineHeight: 1.2 }}>{p.label}</div>
              <div style={{ fontSize: 11, color: '#9A9A8A', marginTop: 3 }}>{p.headline}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <span style={{ background: p.lightBg, border: `1px solid ${p.border}`, color: p.color, fontSize: 9.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{p.tag}</span>
            <span style={{ background: '#F8F7F2', border: '1px solid #E2E0D2', color: p.phaseColor, fontSize: 9.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{p.phase}</span>
          </div>
        </div>

        {/* Expand/collapse chevron */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: '#6A6A5A', lineHeight: 1.5, flex: 1, paddingRight: 16 }}>
            {p.desc.substring(0, 100)}…
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} style={{ color: p.color, flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </motion.div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: 18, borderTop: `1px solid ${p.border}`, marginTop: 16 }}>
                <p style={{ fontSize: 13, color: '#4A4A40', lineHeight: 1.7, marginBottom: 18 }}>{p.desc}</p>

                {/* Vision callout */}
                <div style={{ background: p.lightBg, border: `1px solid ${p.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 18, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: p.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Vision</div>
                    <div style={{ fontSize: 12, color: '#4A4A40', lineHeight: 1.6 }}>{p.vision}</div>
                  </div>
                </div>

                {/* Benefits */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#6A6A5A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Key benefits</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {p.benefits.map((b, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#FAFAF7', border: '1px solid #E8E6DC', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#1A1A14' }}>
                        <span style={{ color: p.color, fontWeight: 800 }}>✓</span> {b}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech stack */}
                <div style={{ background: '#F8F7F2', border: '1px solid #E2E0D2', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 16 }}>⛓️</span>
                  <div>
                    <div style={{ fontSize: 9.5, color: '#9A9A8A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Technology</div>
                    <div style={{ fontSize: 12, color: '#024731', fontFamily: 'monospace', marginTop: 2, fontWeight: 600 }}>{p.techStack}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function FutureRoadmap({ onNavigate, notifications = [] }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="main">
      <Navbar crumb="Future roadmap" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
      <div className="content" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg,#024731 0%,#0B5C3F 60%,#1D4ED8 100%)', borderRadius: 24, padding: '40px 44px', marginBottom: 36, color: '#fff', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative chain nodes */}
          <svg style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '40%', opacity: 0.08 }} viewBox="0 0 400 220" preserveAspectRatio="xMaxYMid slice">
            {[[60,40],[140,100],[220,30],[300,120],[360,60],[380,170],[100,170],[240,160]].map(([x,y],i,arr) => (
              <g key={i}>
                <circle cx={x} cy={y} r="6" fill="#fff"/>
                {i > 0 && <line x1={x} y1={y} x2={arr[i-1][0]} y2={arr[i-1][1]} stroke="#fff" strokeWidth="1.5"/>}
              </g>
            ))}
          </svg>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 700, marginBottom: 18, color: '#A8F0C8', letterSpacing: '0.05em' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4DFF9A', display: 'inline-block', boxShadow: '0 0 8px #4DFF9A' }}/>
              LLOYDS DLT INNOVATION ROADMAP
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 12, lineHeight: 1.2 }}>
              The future of banking,<br/>built on blockchain.
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', maxWidth: 520, lineHeight: 1.7 }}>
              Beyond KYC and lending — Lloyds Banking Group is building the next generation of financial products on Hyperledger Fabric. Here's what's coming.
            </div>
          </div>
        </motion.div>

        {/* ── Timeline strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 36 }}>
          {TIMELINE.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ background: t.active ? 'linear-gradient(135deg,#024731,#0B5C3F)' : '#fff', border: `1.5px solid ${t.active ? 'transparent' : '#E8E6DC'}`, borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
              {t.active && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.08),transparent)' }}/>}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {t.active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4DFF9A', display: 'inline-block', boxShadow: '0 0 6px #4DFF9A' }}/>}
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.active ? '#fff' : t.color }}>{t.label}</div>
                </div>
                <div style={{ fontSize: 11, color: t.active ? 'rgba(255,255,255,0.75)' : '#6A6A5A', lineHeight: 1.55 }}>{t.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Section title ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1A1A14' }}>Upcoming products</div>
            <div style={{ fontSize: 13, color: '#6A6A5A', marginTop: 3 }}>Click any card to explore the full blockchain vision</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E2EEE7', border: '1px solid #C6E8D4', borderRadius: 20, padding: '6px 14px', fontSize: 11, color: '#024731', fontWeight: 700 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}/>
            {ROADMAP.length} products in pipeline
          </div>
        </div>

        {/* ── Product cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 16 }}>
          {ROADMAP.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <ProductCard p={p} expanded={expanded === p.id} onToggle={() => setExpanded(e => e === p.id ? null : p.id)} />
            </motion.div>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ marginTop: 40, background: '#F8F7F2', border: '1.5px solid #E2E0D2', borderRadius: 20, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1A14', marginBottom: 6 }}>Ready to use what's live today?</div>
            <div style={{ fontSize: 13, color: '#6A6A5A' }}>KYC credentials, multi-bank product applications, and the ledger explorer are all live.</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" onClick={() => onNavigate('customer_application')}>Apply for a product →</button>
            <button className="btn-ghost" onClick={() => onNavigate('ledger_explorer')}>View ledger</button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
