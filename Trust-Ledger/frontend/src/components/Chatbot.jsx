import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BOT_NAME = 'Lloyds AI';

/* ── Knowledge base ─────────────────────────────────────────── */
const KB = [
  { q: ['what is this platform', 'what does this do', 'about this', 'what is lloyds dlt'], a: "This is the **Lloyds DLT Lending Platform** — a blockchain-powered system built on Hyperledger Fabric. It enables reusable KYC identity credentials, multi-bank product applications, and a real-time on-chain audit trail. You verify your identity once, and that credential is reused across all Lloyds Banking Group products automatically." },
  { q: ['what is kyc', 'kyc credential', 'identity verification', 'verify identity'], a: "**KYC (Know Your Customer)** is the identity verification process. On this platform, once an admin approves your submitted documents, a cryptographic KYC credential is issued and stored on Hyperledger Fabric. It's reusable — you never need to re-verify for another Lloyds product." },
  { q: ['how to apply', 'apply for loan', 'apply for product', 'apply for credit', 'home loan', 'personal loan', 'vehicle loan', 'business loan', 'credit card'], a: "Go to **Apply for Product** in the sidebar. You'll see 5 products:\n• Personal Loan (up to £250k)\n• Home Loan (mortgage)\n• Vehicle Loan (up to £100k)\n• Business Loan (up to £500k)\n• Credit Card\n\nYour KYC credential is automatically attached. There's also a **Future Scope** toggle showing upcoming blockchain products." },
  { q: ['upload documents', 'submit kyc', 'kyc documents', 'how to upload'], a: "Go to **Upload KYC documents** in the sidebar. Fill in your name, email, and phone (auto-filled if you're logged in), upload your documents, and submit. An admin will review and issue your credential. You'll see the status update live on your dashboard." },
  { q: ['dashboard', 'my dashboard', 'customer dashboard'], a: "Your **Customer Dashboard** shows:\n• KYC credential status (verified / pending / not issued)\n• All your loan applications and their statuses\n• Credential share requests with banks\n• Quick actions to apply for products\n\nHit Refresh at any time to get live updates." },
  { q: ['admin', 'admin dashboard', 'admin control center', 'admin panel'], a: "The **Admin Control Center** (admin-only) lets you:\n• Approve or reject KYC requests\n• View all product applications\n• Manage credential share requests\n• Create customer accounts\n• View the loan application queue" },
  { q: ['ledger explorer', 'blockchain ledger', 'audit trail', 'on-chain'], a: "The **Ledger Explorer** shows the real-time on-chain activity feed — every KYC credential issued, loan approved/rejected, and credential share event is recorded as an immutable block. You can see block numbers, timestamps, and transaction hashes." },
  { q: ['notification', 'bell', 'alerts'], a: "The **bell icon** in the top-right navbar shows real-time notifications — KYC approved, loan decisions, share requests, and activity events. The red badge shows the count of unread events." },
  { q: ['wallet', 'crypto wallet', 'blockchain wallet'], a: "Click the **avatar/initials** button in the top-right navbar to open your **Crypto Wallet**. It shows your Hyperledger Fabric wallet address, identity hash, and on-chain balance — your cryptographic proof of identity on the DLT network." },
  { q: ['future products', 'future roadmap', 'upcoming', 'digital will', 'corporate bonds', 'fixed deposit', 'fraud protection', 'coming soon'], a: "The **Future Roadmap** page (sidebar → Future roadmap) shows 4 upcoming products:\n• 🛡️ **Fraud & Scam Protection** — AI-powered real-time fraud detection on-chain\n• 📜 **Digital Will** — Smart contract-based wills, auto-executed on-chain\n• 🏦 **Fixed Deposits (FDs)** — Standard LBG FDs, no re-KYC needed thanks to reusable KYC Credentials\n• 📈 **Corporate Bonds** — Standard bonds with instant KYC-powered investor onboarding\n\nNone are available yet but you can explore each in detail." },
  { q: ['share credential', 'credential share', 'share with bank'], a: "When you apply via a specific bank, a **credential share request** is created. The bank can then use your verified identity to fast-track your application. You can approve or decline share requests from your Customer Dashboard." },
  { q: ['login', 'sign in', 'sign up', 'create account', 'register'], a: "Accounts are created by an admin in the **Admin Control Center**. Once created, you'll receive credentials to log in. Customer accounts are also auto-created when an admin approves a KYC request." },
  { q: ['loan decision', 'loan ledger', 'loan status', 'application status'], a: "The **Loan Application Ledger** (admin → Loan decision) shows every application as a blockchain-style record. Click any card to expand and see full details — applicant info, policy engine trace, credit score, and transaction hash." },
  { q: ['hyperledger', 'fabric', 'blockchain technology', 'how does blockchain work here'], a: "This platform runs on **Hyperledger Fabric** — a permissioned enterprise blockchain. Unlike public blockchains, only authorised participants (Lloyds entities) can write to the ledger. KYC credentials, loan decisions, and identity events are all recorded as immutable transactions." },
  { q: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'], a: "Hi there! 👋 I'm the **Lloyds DLT Assistant**. I can answer questions about this platform — KYC credentials, loan applications, the blockchain ledger, future products, and more. What would you like to know?" },
  { q: ['thank', 'thanks', 'thank you'], a: "You're welcome! Is there anything else I can help you with about the Lloyds DLT platform? 😊" },
];

function findAnswer(q) {
  const lower = q.toLowerCase().trim();
  let best = null;
  let bestScore = 0;
  for (const item of KB) {
    for (const kw of item.q) {
      if (lower.includes(kw)) {
        const score = kw.length;
        if (score > bestScore) { bestScore = score; best = item.a; }
      }
    }
  }
  return best || "I'm not sure about that specific question. Try asking about: KYC credentials, loan applications, the admin dashboard, the ledger explorer, future roadmap products, or how the blockchain works here. 🏦";
}

function formatMsg(text) {
  // Bold **text**, newlines, bullet points
  const parts = text.split('\n');
  return parts.map((line, i) => {
    const boldParts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {boldParts.map((p, j) => j % 2 === 1 ? <b key={j} style={{ color: '#024731' }}>{p}</b> : p)}
        {i < parts.length - 1 && <br />}
      </span>
    );
  });
}

const SUGGESTIONS = [
  'What is this platform?',
  'How do I apply for a loan?',
  'What are future products?',
  'How does KYC work?',
  'What is the ledger explorer?',
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm the **Lloyds DLT Assistant** 🏦\n\nAsk me anything about this platform — KYC, loans, the blockchain ledger, or upcoming products.", ts: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, messages]);

  // Stop pulsing after user opens
  useEffect(() => { if (open) setPulse(false); }, [open]);

  const send = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput('');
    setMessages(m => [...m, { from: 'user', text: q, ts: new Date() }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { from: 'bot', text: findAnswer(q), ts: new Date() }]);
    }, 600 + Math.random() * 400);
  };

  const fmtTime = (d) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              position: 'fixed', bottom: 140, right: 24, zIndex: 600,
              width: 360, height: 520, borderRadius: 22,
              background: '#fff', border: '1.5px solid #E2E0D2',
              boxShadow: '0 24px 64px rgba(2,71,49,0.18), 0 4px 20px rgba(0,0,0,0.1)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#024731,#0B5C3F)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏦</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{BOT_NAME}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4DFF9A', display: 'inline-block' }}/>
                    Platform assistant · always online
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>✕</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                  {m.from === 'bot' && (
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: '#E2EEE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, marginBottom: 2 }}>🏦</div>
                  )}
                  <div style={{ maxWidth: '78%' }}>
                    <div style={{
                      padding: '9px 13px', borderRadius: m.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: m.from === 'user' ? 'linear-gradient(135deg,#024731,#0B5C3F)' : '#F8F7F2',
                      border: m.from === 'user' ? 'none' : '1px solid #E8E6DC',
                      color: m.from === 'user' ? '#fff' : '#1A1A14',
                      fontSize: 12.5, lineHeight: 1.65,
                    }}>
                      {formatMsg(m.text)}
                    </div>
                    <div style={{ fontSize: 9.5, color: '#B0AFA8', marginTop: 3, textAlign: m.from === 'user' ? 'right' : 'left', paddingLeft: m.from === 'bot' ? 4 : 0 }}>
                      {fmtTime(m.ts)}
                    </div>
                  </div>
                </motion.div>
              ))}
              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: '#E2EEE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🏦</div>
                  <div style={{ background: '#F8F7F2', border: '1px solid #E8E6DC', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        style={{ width: 7, height: 7, borderRadius: '50%', background: '#B0AFA8' }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 2 && (
              <div style={{ padding: '0 14px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s)} style={{ background: '#F0FAF4', border: '1px solid #C6E8D4', color: '#024731', fontSize: 10.5, fontWeight: 600, padding: '5px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid #E8E6DC', display: 'flex', gap: 8, flexShrink: 0 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask about KYC, loans, the ledger…"
                style={{ flex: 1, border: '1.5px solid #E2E0D2', borderRadius: 12, padding: '9px 13px', fontSize: 12.5, outline: 'none', background: '#FAFAF7', color: '#1A1A14', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#024731'}
                onBlur={e => e.target.style.borderColor = '#E2E0D2'}
              />
              <button onClick={() => send()} disabled={!input.trim()} style={{
                width: 38, height: 38, borderRadius: 12, border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                background: input.trim() ? 'linear-gradient(135deg,#024731,#0B5C3F)' : '#E2E0D2',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Launcher button ── */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
        title="Chat with Lloyds AI"
        style={{
          position: 'fixed', bottom: 86, right: 24, zIndex: 600,
          width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: open ? '#1A1A14' : 'linear-gradient(135deg,#024731,#0B5C3F)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(2,71,49,0.45)',
          fontSize: 22, fontFamily: 'inherit',
        }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}
              style={{ fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.15 }}>
              💬
            </motion.span>
          )}
        </AnimatePresence>
        {/* Pulse ring */}
        {pulse && !open && (
          <motion.div
            animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid #4DFF9A', pointerEvents: 'none' }}
          />
        )}
      </motion.button>
    </>
  );
}
