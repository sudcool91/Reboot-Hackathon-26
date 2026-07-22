import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function NewCustomerUpload({ onNavigate }) {
  return (
    <div className="main">
      <Navbar crumb="New customer upload" onFluid={() => onNavigate('fluid_overview')} />
      <div className="ncu-content">

        {/* Hero */}
        <motion.div className="ncu-hero" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
          <div className="ncu-hero-text">
            <div className="ncu-eyebrow">First time at Lloyds</div>
            <h1 className="ncu-h1">Let's get you verified — once, for everything.</h1>
            <p className="ncu-sub">No existing account means no shortcuts yet. Upload your documents below and we'll issue your on-chain KYC credential. Every loan, card, and product after this moment reuses it instantly.</p>
          </div>
          <div className="ncu-hero-progress">
            <svg width="92" height="92" viewBox="0 0 92 92">
              <circle cx="46" cy="46" r="40" fill="none" stroke="#E2EEE7" strokeWidth="8"/>
              <circle cx="46" cy="46" r="40" fill="none" stroke="#024731" strokeWidth="8" strokeLinecap="round"
                strokeDasharray="251.2" strokeDashoffset="100.5" transform="rotate(-90 46 46)"/>
              <text x="46" y="42" textAnchor="middle" fontSize="18" fontWeight="700" fill="#024731" fontFamily="-apple-system,sans-serif">3/5</text>
              <text x="46" y="58" textAnchor="middle" fontSize="9" fill="#4A4A40" fontFamily="-apple-system,sans-serif">uploaded</text>
            </svg>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="ncu-steps">
          <div className="ncu-step done">
            <div className="ncu-step-dot"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg></div>
            Basic details
          </div>
          <div className="ncu-step-line done"></div>
          <div className="ncu-step current"><div className="ncu-step-dot">2</div>Upload documents</div>
          <div className="ncu-step-line"></div>
          <div className="ncu-step"><div className="ncu-step-dot">3</div>Video KYC</div>
          <div className="ncu-step-line"></div>
          <div className="ncu-step"><div className="ncu-step-dot">4</div>Review &amp; submit</div>
        </div>

        {/* Document cards */}
        <motion.div className="ncu-grid" initial="hidden" animate="show" variants={container}>
          {/* Done cards */}
          {[
            { name: 'Photo ID', meta: 'pan_card_scan.pdf · 412 KB', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#024731" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h6M14 14h4"/></svg> },
            { name: 'Proof of identity (front + back)', meta: 'proof_of_identity.pdf · 1.1 MB', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#024731" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg> },
            { name: 'Address proof', meta: 'electricity_bill_may.pdf · 286 KB', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#024731" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg> },
          ].map((c, i) => (
            <motion.div key={i} className="ncu-card" variants={fadeUp}>
              <div className="ncu-card-top">
                <div className="ncu-card-icon">{c.icon}</div>
                <span className="ncu-status-chip done">Uploaded</span>
              </div>
              <div className="ncu-card-name">{c.name}</div>
              <div className="ncu-card-meta">{c.meta}</div>
              <div className="ncu-card-action">Replace file</div>
            </motion.div>
          ))}

          {/* Pending cards */}
          {[
            { name: 'Income proof', meta: 'Salary slip or Form 16, last 3 months', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2"><path d="M16 2v4M8 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/></svg> },
            { name: 'Bank statement', meta: 'Last 6 months, any existing account', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> },
          ].map((c, i) => (
            <motion.div key={i} className="ncu-card pending" variants={fadeUp}>
              <div className="ncu-card-top">
                <div className="ncu-card-icon pending">{c.icon}</div>
                <span className="ncu-status-chip pending">Required</span>
              </div>
              <div className="ncu-card-name">{c.name}</div>
              <div className="ncu-card-meta">{c.meta}</div>
              <div className="ncu-dropzone">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
                <span>Drag file here or <b>browse</b></span>
              </div>
            </motion.div>
          ))}

          {/* Upcoming */}
          <motion.div className="ncu-card upcoming" variants={fadeUp}>
            <div className="ncu-card-top">
              <div className="ncu-card-icon upcoming"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C8B7E" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div>
              <span className="ncu-status-chip upcoming">Next step</span>
            </div>
            <div className="ncu-card-name">Video KYC</div>
            <div className="ncu-card-meta">Live identity check, 3–5 minutes</div>
            <div className="ncu-card-action muted">Unlocks after uploads</div>
          </motion.div>
        </motion.div>

        <div className="ncu-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <div><b>Verification usually takes 24–48 hours</b> once all five documents are in and video KYC is complete. After that, this credential works everywhere — instantly.</div>
        </div>

        <button className="ncu-submit" disabled>Submit for verification — 2 documents remaining</button>
      </div>
    </div>
  );
}
