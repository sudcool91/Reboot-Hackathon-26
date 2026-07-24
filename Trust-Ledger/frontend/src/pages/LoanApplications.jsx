import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { getLoanApplications } from '../services/api';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const STATUS_TAG = {
  'Auto-eligible': 'tag-go', 'Approved': 'tag-go',
  'Manual review': 'tag-stop', 'Pending docs': 'tag-warn',
  'Rejected': 'tag-bad',
};

const PRODUCT_TABS = ['All products', 'Personal loan', 'Home loan', 'Vehicle loan', 'Business loan'];
const STATUS_FILTERS = ['All statuses', 'Auto-eligible', 'Manual review', 'Pending docs', 'Approved', 'Rejected'];

const ChainIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/>
  </svg>
);

export default function LoanApplications({ onNavigate, notifications = [] }) {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productTab, setProductTab] = useState('All products');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    getLoanApplications().then(data => {
      const arr = Array.isArray(data) ? data : data?.applications || [];
      setAllRows([...arr].reverse());
    }).finally(() => setLoading(false));
  }, []);

  // Derived filtered rows
  const filtered = allRows.filter(row => {
    const matchProduct = productTab === 'All products' ||
      (row.product || '').toLowerCase().includes(productTab.toLowerCase());
    const matchStatus = statusFilter === 'All statuses' || row.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (row.applicantName || row.name || '').toLowerCase().includes(q) ||
      (row.id || row.applicationId || '').toLowerCase().includes(q) ||
      (row.product || '').toLowerCase().includes(q);
    return matchProduct && matchStatus && matchSearch;
  });

  // Live counts
  const counts = {
    total: allRows.length,
    autoEligible: allRows.filter(r => r.status === 'Auto-eligible' || r.status === 'Approved').length,
    manual: allRows.filter(r => r.status === 'Manual review').length,
    pending: allRows.filter(r => r.status === 'Pending docs').length,
  };

  const productCount = (tab) => tab === 'All products' ? allRows.length
    : allRows.filter(r => (r.product || '').toLowerCase().includes(tab.toLowerCase())).length;

  return (
    <div className="main">
      <Navbar crumb="Loan applications" onFluid={() => onNavigate('fluid_overview')} notifications={notifications} />
      <div className="content">
        <div className="page-title-row">
          <div>
            <div className="page-title">Loan applications</div>
            <div className="page-sub">Every secured and unsecured lending product, in one queue — filtered by type, status, and KYC source.</div>
          </div>
          <button className="btn-primary" style={{fontSize:12,padding:'8px 16px'}} onClick={() => onNavigate('customer_application')}>
            + New application
          </button>
        </div>

        {/* Product tabs */}
        <div className="product-tabs">
          {PRODUCT_TABS.map(tab => (
            <div key={tab}
              className={`ptab${productTab === tab ? ' on' : ''}`}
              onClick={() => setProductTab(tab)}
              style={{ cursor: 'pointer' }}>
              {tab} <span className="ptab-count">{productCount(tab)}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <motion.div className="stat-grid" initial="hidden" animate="show" variants={container}>
          {[
            { label: 'Total applications',  value: counts.total,       tag: 'in system',        tagStyle: { background: '#E2EEE7', color: '#024731' },  filter: 'All statuses' },
            { label: 'Auto-eligible',        value: counts.autoEligible, tag: 'click to filter',  tagStyle: { background: '#E2EEE7', color: '#024731' },  filter: 'Auto-eligible' },
            { label: 'Manual review',        value: counts.manual,       tag: 'needs decision',   tagStyle: { background: '#FCEBEB', color: '#A32D2D' },  filter: 'Manual review' },
            { label: 'Pending documents',    value: counts.pending,      tag: 'awaiting upload',  tagStyle: { background: '#FAEEDA', color: '#854F0B' },  filter: 'Pending docs' },
          ].map((s, i) => (
            <motion.div key={i} className="stat" variants={fadeUp}
              onClick={() => setStatusFilter(s.filter)}
              style={{ cursor: 'pointer', outline: statusFilter === s.filter ? '2px solid #0B5C3F' : 'none', borderRadius: 12 }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <span className="stat-tag" style={s.tagStyle}>{s.tag}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Search + Status filter */}
        <div className="toolbar">
          <div className="search-box" style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8B7E" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#1A1A14', width: '100%', marginLeft: 6 }}
              placeholder="Search applicant, product or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <span onClick={() => setSearch('')} style={{ cursor: 'pointer', color: '#9A9A8A', fontSize: 12, marginLeft: 4 }}>✕</span>
            )}
          </div>
          <div className="filter-row">
            {STATUS_FILTERS.map(f => (
              <span key={f}
                className={`filter-chip${statusFilter === f ? ' on' : ''}`}
                onClick={() => setStatusFilter(f)}
                style={{ cursor: 'pointer' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Table */}
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9A9A8A', fontSize: 13 }}>⏳ Loading applications...</div>
          ) : (
          <table>
            <thead>
              <tr>
                <th>Applicant</th><th>Product</th><th>Amount</th>
                <th>Credit score</th><th>KYC source</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', opacity: 0.4, padding: '40px 0' }}>
                  {allRows.length === 0 ? '📋 No applications yet — submit one from the customer portal.' : 'No applications match the current filters.'}
                </td></tr>
              )}
              {filtered.map((row, i) => {
                const id = row.id || row.applicationId;
                const name = row.applicantName || row.name || '—';
                const av = row.avatar || name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                const isChain = (row.kycSource || '').startsWith('On-chain');
                const canReview = row.status === 'Auto-eligible' || row.status === 'Manual review' || row.status === 'Approved' || row.status === 'Rejected';
                return (
                  <motion.tr key={id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td>
                      <div className="person">
                        <div className="av">{av}</div>
                        <div>
                          <div>{name}</div>
                          <div style={{ fontSize: 10, color: '#9A9A8A', fontFamily: 'monospace' }}>{id}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="product-chip">{row.product}</span></td>
                    <td>{(row.amount || '').replace('GBP', '£')}</td>
                    <td>
                      {row.creditScore ? (
                        <span style={{
                          fontWeight: 700, fontSize: 13,
                          color: row.creditScore >= 750 ? '#024731' : row.creditScore >= 650 ? '#854F0B' : '#A32D2D'
                        }}>{row.creditScore}</span>
                      ) : <span style={{ opacity: 0.35 }}>—</span>}
                    </td>
                    <td>
                      {isChain
                        ? <span className="chain-ref"><ChainIcon />{row.kycSource}</span>
                        : <span className="mono-sm">{row.kycSource}</span>}
                    </td>
                    <td><span className={`tag ${STATUS_TAG[row.status] || 'tag-mute'}`}>{row.status}</span></td>
                    <td>
                      {canReview
                        ? <span className="row-link" onClick={() => onNavigate('loan_decision', { applicationId: id })}>Review →</span>
                        : <span className="mono-sm" style={{ opacity: 0.45 }}>awaiting</span>}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          )}
        </motion.div>

        {filtered.length > 0 && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#9A9A8A', marginTop: 12 }}>
            Showing {filtered.length} of {allRows.length} applications
          </div>
        )}
      </div>
    </div>
  );
}

