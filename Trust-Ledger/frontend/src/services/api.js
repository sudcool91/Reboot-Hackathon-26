// Backend runs on port 3001 by default
const BASE = 'http://localhost:3001';

async function req(method, path, body) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[API] ${method} ${path} failed:`, e.message);
    return null;
  }
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export const getDashboardSummary  = () => req('GET', '/api/v1/dashboard/summary');
export const getDashboardActivity = () => req('GET', '/api/v1/dashboard/activity');
export const getNetworkTopology   = () => req('GET', '/api/v1/dashboard/network');

// ── KYC Registry ───────────────────────────────────────────────────────────
export const getKycRegistry       = (status) => req('GET', `/api/v1/kyc-registry${status ? `?status=${status}` : ''}`);
export const updateConsent        = (credentialId, bank, action) =>
  req('POST', `/api/v1/kyc-registry/${credentialId}/consent`, { bank, action });

// ── Loan Applications ──────────────────────────────────────────────────────
export const getLoanApplications  = () => req('GET', '/api/v1/loan-applications');
export const submitApplication    = (data) => req('POST', '/api/v1/loan-applications', data);

// ── Loan Decision ──────────────────────────────────────────────────────────
export const getLoanDecision      = (applicationId) => req('GET', `/api/v1/loan-applications/${applicationId}/decision`);
export const decideLoan           = (applicationId, decision, remark, actor) =>
  req('POST', `/api/v1/loan-applications/${applicationId}/decision`, { decision, remark, actor });

// ── Ledger Explorer ────────────────────────────────────────────────────────
export const getLedgerExplorer    = (credentialId) => req('GET', `/api/v1/ledger-explorer/${credentialId}`);

// ── Admin ──────────────────────────────────────────────────────────────────
export const getAdminControlCenter = () => req('GET', '/api/v1/admin-control-center');

// ── KYC core ──────────────────────────────────────────────────────────────
export const issueKyc   = (networkIdentityId, documentHash, issuer, extra = {}) =>
  req('POST', '/api/v1/kyc/issue', { networkIdentityId, documentHash, issuer, ...extra });
export const verifyKyc  = (credentialId) =>
  req('POST', '/api/v1/kyc/verify', { credentialId });
export const revokeKyc  = (credentialId, reason) =>
  req('POST', '/api/v1/kyc/revoke', { credentialId, reason });
export const getKycHistory = (credentialId) =>
  req('GET', `/api/v1/kyc/history/${credentialId}`);

// ── File Upload ────────────────────────────────────────────────────────────
export const uploadDocument = async (file, docType, customerId) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    formData.append('customerId', customerId || 'guest');
    const res = await fetch(`${BASE}/api/v1/uploads`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('[API] upload failed:', e.message);
    return null;
  }
};

// ══════════════════════════════════════════════════════════════════════════
// ── FABRIC SDK API (Direct Blockchain Access) ─────────────────────────────
// ══════════════════════════════════════════════════════════════════════════

// ── Health & Info ──────────────────────────────────────────────────────────
export const getFabricHealth = () => req('GET', '/fabric-sdk/health');
export const getFabricInfo = () => req('GET', '/fabric-sdk/info');

// ── Customer Operations (Blockchain) ───────────────────────────────────────
export const createCustomerOnChain = (customer) => req('POST', '/fabric-sdk/customers', customer);
export const getAllCustomersFromChain = () => req('GET', '/fabric-sdk/customers');
export const getCustomerFromChain = (customerID) => req('GET', `/fabric-sdk/customers/${customerID}`);
export const updateCustomerOnChain = (customerID, updates) => req('PUT', `/fabric-sdk/customers/${customerID}`, updates);
export const deleteCustomerFromChain = (customerID) => req('DELETE', `/fabric-sdk/customers/${customerID}`);
export const checkCustomerExists = (customerID) => req('GET', `/fabric-sdk/customers/${customerID}/exists`);
export const getCustomerHistory = (customerID) => req('GET', `/fabric-sdk/customers/${customerID}/history`);

// ── KYC Operations (Blockchain) ────────────────────────────────────────────
export const issueKycOnChain = (customerID) => req('POST', `/fabric-sdk/kyc/${customerID}/issue`);
export const verifyKycOnChain = (customerID, requestingBank) => 
  req('POST', '/fabric-sdk/kyc/verify', { customerID, requestingBank });

// ── Consent Operations (Blockchain) ────────────────────────────────────────
export const grantConsentOnChain = (customerID) => req('POST', '/fabric-sdk/consent/grant', { customerID });
export const revokeConsentOnChain = (customerID) => req('POST', '/fabric-sdk/consent/revoke', { customerID });

// ── Utility ────────────────────────────────────────────────────────────────
export const initLedger = () => req('POST', '/fabric-sdk/init-ledger');

