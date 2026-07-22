import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export default function KycRegistry({ onNavigate }) {
  const rows = [
    { av: 'RS', name: 'Rohan Sharma', id: 'KYC-RS-88213', issuer: 'Lloyds', dots: [true,false,false], expires: '12 Jun 2027', status: 'Active', statusCls: 'tag-go' },
    { av: 'PN', name: 'Priya Nair', id: 'KYC-PN-44021', issuer: 'Partner bank', dots: [true,true,false], expires: '03 Apr 2027', status: 'Active', statusCls: 'tag-go' },
    { av: 'ST', name: 'Sara Thomas', id: 'KYC-ST-30187', issuer: 'Lloyds', dots: [true,false,false], expires: '19 Aug 2026', status: 'Expiring soon', statusCls: 'tag-warn' },
    { av: 'VD', name: 'Vikram Desai', id: 'KYC-VD-19042', issuer: 'Lloyds', dots: [false,false,false], expires: '—', status: 'Revoked', statusCls: 'tag-stop' },
    { av: 'MI', name: 'Meera Iyer', id: 'KYC-MI-55301', issuer: 'Lloyds', dots: [true,true,true], expires: '15 Jan 2028', status: 'Active', statusCls: 'tag-go' },
  ];

  return (
    <div className="main">
      <Navbar crumb="KYC registry" onFluid={() => onNavigate('fluid_overview')} />
      <div className="content">
        <div className="page-title">KYC registry</div>
        <div className="page-sub">Every customer's on-chain identity credential, where it was issued, and which products it has been used to unlock — one record, reused everywhere.</div>

        <motion.div className="stat-grid" initial="hidden" animate="show" variants={container}>
          {[
            { label: 'Total credentials issued', value: '12,884' },
            { label: 'Active', value: '12,401' },
            { label: 'Expiring within 90 days', value: '312' },
            { label: 'Revoked', value: '171' },
          ].map((s, i) => (
            <motion.div key={i} className="stat" variants={fadeUp}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="toolbar">
          <div className="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8B7E" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            Search by name, credential ID, or DID
          </div>
          <div className="filter-row">
            <span className="filter-chip on">All statuses</span>
            <span className="filter-chip">Active</span>
            <span className="filter-chip">Expiring soon</span>
            <span className="filter-chip">Revoked</span>
          </div>
        </div>

        <motion.div className="card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
          <table>
            <thead><tr><th>Customer</th><th>Credential ID</th><th>Issuer</th><th>Products unlocked</th><th>Expires</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td><div className="person"><div className="av">{r.av}</div>{r.name}</div></td>
                  <td><span className="mono-sm">{r.id}</span></td>
                  <td><span className="issuer-chip">{r.issuer}</span></td>
                  <td><div className="products-used">{r.dots.map((d,j) => <span key={j} className={`pdot${d?'':' muted'}`}></span>)}</div></td>
                  <td>{r.expires}</td>
                  <td><span className={`tag ${r.statusCls}`}>{r.status}</span></td>
                  <td><span className="row-link" onClick={() => onNavigate('ledger_explorer')}>View trail →</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
