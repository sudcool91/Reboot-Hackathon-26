const BASE = 'http://localhost:3000';

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

// ── Loan Decision ──────────────────────────────────────────────────────────
export const getLoanDecision      = (applicationId) => req('GET', `/api/v1/loan-applications/${applicationId}/decision`);
export const decideLoan           = (applicationId, decision, remark, actor) =>
  req('POST', `/api/v1/loan-applications/${applicationId}/decision`, { decision, remark, actor });

// ── Ledger Explorer ────────────────────────────────────────────────────────
export const getLedgerExplorer    = (credentialId) => req('GET', `/api/v1/ledger-explorer/${credentialId}`);

// ── Admin ──────────────────────────────────────────────────────────────────
export const getAdminControlCenter = () => req('GET', '/api/v1/admin-control-center');

// ── KYC core ──────────────────────────────────────────────────────────────
export const issueKyc   = (networkIdentityId, documentHash, issuer) =>
  req('POST', '/api/v1/kyc/issue', { networkIdentityId, documentHash, issuer });
export const verifyKyc  = (credentialId) =>
  req('POST', '/api/v1/kyc/verify', { credentialId });
export const revokeKyc  = (credentialId, reason) =>
  req('POST', '/api/v1/kyc/revoke', { credentialId, reason });
export const getKycHistory = (credentialId) =>
  req('GET', `/api/v1/kyc/history/${credentialId}`);
