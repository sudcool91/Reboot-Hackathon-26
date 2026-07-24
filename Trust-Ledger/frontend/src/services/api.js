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

// ── Auth ───────────────────────────────────────────────────────────────────
export const loginUser   = (username, password) => req('POST', '/api/v1/auth/login', { username, password });
export const registerUser = (data) => req('POST', '/api/v1/auth/register', data);

// ── KYC Requests (customer → admin approval flow) ─────────────────────────
export const submitKycRequest  = (data) => req('POST', '/api/v1/kyc-requests', data);
export const getKycRequests    = (status) => req('GET', `/api/v1/kyc-requests${status ? `?status=${status}` : ''}`);
export const getKycRequestsByEmail = (email) => req('GET', `/api/v1/kyc-requests?email=${encodeURIComponent(email)}`);
export const decideKycRequest  = (id, decision, remark, decidedBy) =>
  req('PATCH', `/api/v1/kyc-requests/${id}/decide`, { decision, remark, decidedBy });

// ── Credential Share Requests ──────────────────────────────────────────────
export const submitShareRequest   = (data) => req('POST', '/api/v1/credential-share-requests', data);
export const getShareRequests     = (status) => req('GET', `/api/v1/credential-share-requests${status ? `?status=${status}` : ''}`);
export const getShareRequestsByEmail = (email) => req('GET', `/api/v1/credential-share-requests?email=${encodeURIComponent(email)}`);
export const decideShareRequest   = (id, decision, remark, decidedBy) =>
  req('PATCH', `/api/v1/credential-share-requests/${id}/decide`, { decision, remark, decidedBy });

