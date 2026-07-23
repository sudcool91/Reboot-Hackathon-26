import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { getLoanApplications } from '../services/api';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const SEED = [
  { id: 'LN20458', initials: 'RS', name: 'Rohan Sharma',  product: 'Personal loan',  amount: '£300,000', creditScore: 782, kycSource: 'On-chain · Lloyds',    status: 'Auto-eligible', navigable: true },
  { id: 'LN20459', initials: 'VD', name: 'Vikram Desai',  product: 'Home loan',       amount: '£450,000', creditScore: null, kycSource: 'New · uploading docs', status: 'Pending docs',   navigable: false },
  { id: 'LN20460', initials: 'ST', name: 'Sara Thomas',   product: 'Vehicle loan',    amount: '£85,000',  creditScore: 688, kycSource: 'On-chain · Lloyds',    status: 'Manual review',  navigable: true },
  { id: 'LN20461', initials: 'PN', name: 'Priya Nair',    product: 'Personal loan',   amount: '£55,000',  creditScore: 801, kycSource: 'On-chain · Partner',   status: 'Auto-eligible',  navigable: false },
  { id: 'LN20462', initials: 'AS', name: 'Aditya Singh',  product: 'Business loan',   amount: '£120,000', creditScore: 738, kycSource: 'On-chain · Lloyds',    status: 'Manual review',  navigable: false },
];

const STATUS_TAG = { 'Auto-eligible': 'tag-go', 'Manual review': 'tag-stop', 'Pending docs': 'tag-warn' };
const ChainIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/></svg>;

export default function LoanApplications({ onNavigate }) {
  const [rows, setRows] = useState(SEED);

  useEffect(() => {
    getLoanApplications().then(data => {
      if (Array.isArray(data) && data.length > 0) setRows(data);
      else if (data?.applications?.length > 0) setRows(data.applications);
    });
  }, []);

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
              {rows.map((row, i) => {
                const isChain = row.kycSource?.startsWith('On-chain');
                return (
                  <tr key={row.id || i}>
                    <td><div className="person"><div className="av">{row.initials || row.name?.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>{row.name}</div></td>
                    <td><span className="product-chip">{row.product}</span></td>
                    <td>{row.amount}</td>
                    <td>{row.creditScore ?? '—'}</td>
                    <td>{isChain
                      ? <span className="chain-ref"><ChainIcon />{row.kycSource}</span>
                      : <span className="mono-sm">{row.kycSource}</span>}
                    </td>
                    <td><span className={`tag ${STATUS_TAG[row.status] || 'tag-mute'}`}>{row.status}</span></td>
                    <td>{row.navigable || row.id === 'LN20458'
                      ? <span className="row-link" onClick={() => onNavigate('loan_decision')}>Review →</span>
                      : <span className="mono-sm">awaiting</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
