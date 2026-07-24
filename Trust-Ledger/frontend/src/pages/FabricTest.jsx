import { useState, useEffect } from 'react';
import {
  getFabricHealth,
  getAllCustomersFromChain,
  createCustomerOnChain,
  getCustomerFromChain,
  issueKycOnChain,
  grantConsentOnChain,
  verifyKycOnChain,
  getCustomerHistory,
} from '../services/api';

export default function FabricTest() {
  const [health, setHealth] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Check Fabric SDK health on load
  useEffect(() => {
    checkHealth();
    loadCustomers();
  }, []);

  const checkHealth = async () => {
    const result = await getFabricHealth();
    setHealth(result);
  };

  const loadCustomers = async () => {
    setLoading(true);
    const result = await getAllCustomersFromChain();
    if (result?.success) {
      setCustomers(result.data || []);
      setMessage('✅ Customers loaded from blockchain');
    } else {
      setMessage('❌ Failed to load customers');
    }
    setLoading(false);
  };

  const createTestCustomer = async () => {
    setLoading(true);
    const customerID = `CUST${Date.now()}`;
    const result = await createCustomerOnChain({
      customerID,
      fullName: 'Test Customer',
      dateOfBirth: '1990-01-01',
      email: 'test@example.com',
      phone: '1234567890',
      address: '123 Test Street',
      nationalID: 'TEST123',
      issuingBank: 'LLOYDS',
      documentHash: `hash_${Date.now()}`,
    });
    
    if (result?.success) {
      setMessage(`✅ Customer ${customerID} created!`);
      await loadCustomers();
    } else {
      setMessage(`❌ Failed: ${result?.message}`);
    }
    setLoading(false);
  };

  const selectCustomer = async (customerID) => {
    setLoading(true);
    const result = await getCustomerFromChain(customerID);
    if (result?.success) {
      setSelectedCustomer(result.data);
      setMessage(`✅ Customer ${customerID} loaded`);
      
      // Load history
      const historyResult = await getCustomerHistory(customerID);
      if (historyResult?.success) {
        setHistory(historyResult.data || []);
      }
    } else {
      setMessage(`❌ Failed to load customer`);
    }
    setLoading(false);
  };

  const issueKyc = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    const result = await issueKycOnChain(selectedCustomer.customerID);
    if (result?.success) {
      setMessage(`✅ KYC issued for ${selectedCustomer.customerID}`);
      await selectCustomer(selectedCustomer.customerID);
    } else {
      setMessage(`❌ Failed: ${result?.message}`);
    }
    setLoading(false);
  };

  const grantConsent = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    const result = await grantConsentOnChain(selectedCustomer.customerID);
    if (result?.success) {
      setMessage(`✅ Consent granted for ${selectedCustomer.customerID}`);
      await selectCustomer(selectedCustomer.customerID);
    } else {
      setMessage(`❌ Failed: ${result?.message}`);
    }
    setLoading(false);
  };

  const verifyKyc = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    const result = await verifyKycOnChain(selectedCustomer.customerID, 'HALIFAX');
    if (result?.success) {
      setMessage(`✅ KYC verified by Halifax for ${selectedCustomer.customerID}`);
    } else {
      setMessage(`❌ Failed: ${result?.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>🔗 Fabric SDK Test Page</h1>

      {/* Health Status */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Network Health</h2>
        {health ? (
          <div>
            <p>Status: {health.healthy ? '✅ Healthy' : '❌ Unhealthy'}</p>
            <p>Channel: {health.details?.channelName}</p>
            <p>Chaincode: {health.details?.chaincodeName}</p>
            <p>Organization: {health.details?.mspId}</p>
            <button onClick={checkHealth} style={buttonStyle}>🔄 Refresh</button>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#e3f2fd', borderRadius: '8px' }}>
          {message}
        </div>
      )}

      {/* Actions */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Actions</h2>
        <button onClick={createTestCustomer} disabled={loading} style={buttonStyle}>
          ➕ Create Test Customer
        </button>
        <button onClick={loadCustomers} disabled={loading} style={buttonStyle}>
          🔄 Reload Customers
        </button>
      </div>

      {/* Customer List */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Customers on Blockchain ({customers.length})</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
          {customers.map((customer) => (
            <div
              key={customer.customerID}
              onClick={() => selectCustomer(customer.customerID)}
              style={{
                padding: '15px',
                background: selectedCustomer?.customerID === customer.customerID ? '#e3f2fd' : 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <strong>{customer.fullName}</strong> - {customer.customerID}
              <br />
              <small>
                KYC: {customer.kycStatus} | Consent: {customer.consentGranted ? '✅' : '❌'} | 
                Bank: {customer.issuingBank}
              </small>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Customer Details */}
      {selectedCustomer && (
        <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>Selected Customer</h2>
          <pre style={{ background: 'white', padding: '15px', borderRadius: '8px', overflow: 'auto' }}>
            {JSON.stringify(selectedCustomer, null, 2)}
          </pre>

          <h3>Actions for {selectedCustomer.customerID}</h3>
          <button onClick={issueKyc} disabled={loading} style={buttonStyle}>
            ✓ Issue KYC
          </button>
          <button onClick={grantConsent} disabled={loading} style={buttonStyle}>
            🤝 Grant Consent
          </button>
          <button onClick={verifyKyc} disabled={loading} style={buttonStyle}>
            🔍 Verify KYC (Halifax)
          </button>

          {history.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3>Transaction History ({history.length})</h3>
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {history.map((record, idx) => (
                  <div key={idx} style={{ marginBottom: '10px', padding: '10px', background: 'white', borderRadius: '4px' }}>
                    <small>
                      <strong>TX:</strong> {record.txId}<br />
                      <strong>Timestamp:</strong> {record.timestamp}<br />
                      <strong>Status:</strong> {record.customer?.kycStatus}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                      background: 'rgba(0,0,0,0.8)', color: 'white', padding: '20px', borderRadius: '8px' }}>
          Loading...
        </div>
      )}
    </div>
  );
}

const buttonStyle = {
  padding: '10px 20px',
  margin: '5px',
  background: '#1976d2',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
};
