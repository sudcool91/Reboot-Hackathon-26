import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export default function LoanApplications({ onNavigate }) {
  return (
    <div className="main">
      <Navbar crumb="Loan applications" onFluid={() => onNavigate('fluid_overview')} />
      <div className="content">
        <div className="page-title-row">
          <div>
            <div className="page-title">Loan applications</div>
            <div className="page-sub">Every secured and unsecured lending product, in one queue — filtered by type, status, and KYC source.</div>
          </div>
        </div>

        <div className="product-tabs">
          {[['All products','47',true],['Personal loans','18'],['Home loans','9'],['Vehicle loans','6'],['Business loans','4']].map(([label,count,on],i) => (
            <div key={i} className={`ptab${on?' on':''}`}>{label} <span className="ptab-count">{count}</span></div>
          ))}
        </div>

        <motion.div className="stat-grid" initial="hidden" animate="show" variants={container}>
          {[
            { label: 'Total applications', value: '47', tag: '12% up vs yesterday', tagStyle: { background: '#E2EEE7', color: '#024731' } },
            { label: 'Auto-eligible', value: '29', tag: '62% of queue', tagStyle: { background: '#E2EEE7', color: '#024731' } },
            { label: 'Manual review', value: '11', tag: 'needs decision', tagStyle: { background: '#FCEBEB', color: '#A32D2D' } },
            { label: 'Pending documents', value: '7', tag: 'awaiting upload', tagStyle: { background: '#FAEEDA', color: '#854F0B' } },
          ].map((s, i) => (
            <motion.div key={i} className="stat" variants={fadeUp}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <span className="stat-tag" style={s.tagStyle}>{s.tag}</span>
            </motion.div>
          ))}
        </motion.div>

        <div className="toolbar">
          <div className="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8B7E" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            Search applicant or ID
          </div>
          <div className="filter-row">
            <span className="filter-chip on">All statuses</span>
            <span className="filter-chip">Auto-eligible</span>
            <span className="filter-chip">Manual review</span>
            <span className="filter-chip">Pending docs</span>
          </div>
        </div>

        <motion.div className="card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
          <table>
            <thead><tr><th>Applicant</th><th>Product</th><th>Amount</th><th>Credit score</th><th>KYC source</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr>
                <td><div className="person"><div className="av">RS</div>Rohan Sharma</div></td>
                <td><span className="product-chip">Personal loan</span></td>
                <td>£300,000</td><td>782</td>
                <td><span className="chain-ref"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/></svg>On-chain · Lloyds</span></td>
                <td><span className="tag tag-go">Auto-eligible</span></td>
                <td><span className="row-link" onClick={() => onNavigate('loan_decision')}>Review →</span></td>
              </tr>
              <tr>
                <td><div className="person"><div className="av">VD</div>Vikram Desai</div></td>
                <td><span className="product-chip">Home loan</span></td>
                <td>£450,000</td><td>—</td>
                <td><span className="mono-sm">New · uploading docs</span></td>
                <td><span className="tag tag-warn">Pending docs</span></td>
                <td><span className="mono-sm">awaiting</span></td>
              </tr>
              <tr>
                <td><div className="person"><div className="av">ST</div>Sara Thomas</div></td>
                <td><span className="product-chip">Vehicle loan</span></td>
                <td>£85,000</td><td>688</td>
                <td><span className="chain-ref"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/></svg>On-chain · Lloyds</span></td>
                <td><span className="tag tag-stop">Manual review</span></td>
                <td><span className="row-link">Review →</span></td>
              </tr>
              <tr>
                <td><div className="person"><div className="av">PN</div>Priya Nair</div></td>
                <td><span className="product-chip">Personal loan</span></td>
                <td>£55,000</td><td>801</td>
                <td><span className="chain-ref"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/></svg>On-chain · Partner</span></td>
                <td><span className="tag tag-go">Auto-eligible</span></td>
                <td><span className="row-link">Review →</span></td>
              </tr>
              <tr>
                <td><div className="person"><div className="av">AS</div>Aditya Singh</div></td>
                <td><span className="product-chip">Business loan</span></td>
                <td>£120,000</td><td>738</td>
                <td><span className="chain-ref"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/></svg>On-chain · Lloyds</span></td>
                <td><span className="tag tag-stop">Manual review</span></td>
                <td><span className="row-link">Review →</span></td>
              </tr>
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
