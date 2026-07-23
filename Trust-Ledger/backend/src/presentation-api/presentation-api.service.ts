import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PresentationDataService } from './presentation-data.service';

interface DecisionPayload { decision: 'grant' | 'reject'; remark?: string; actor?: string; }
interface ConsentPayload { bank: string; action: 'share' | 'revoke'; }

@Injectable()
export class PresentationApiService {
  constructor(private readonly data: PresentationDataService) {}

  async getDashboardSummary() {
    const applications = await this.data.getApplications();
    const registry = await this.data.getRegistry();
    return {
      applicationsReceived: applications.length,
      fastTrackedViaOnChainKyc: applications.filter(a => a.status === 'Auto-eligible').length,
      pendingDocuments: applications.filter(a => a.status === 'Pending docs').length,
      activeCredentials: registry.filter(r => r.status === 'Active').length,
      credentialsIssued: registry.length,
      averageDecisionTime: '4.2 min',
      blockHeight: this.data.getBlockHeight(),
      validatorSync: '4/4',
    };
  }

  getDashboardActivity() {
    return [
      { type: 'loan',       text: 'Anita accepted LN20458 for Rohan Sharma',                    at: '2 min ago' },
      { type: 'compliance', text: 'Compliance flagged credential KYC-VD-19042',                  at: '38 min ago' },
      { type: 'ledger',     text: 'New credential issued for Meera Iyer at block #48,201',       at: '1 hr ago' },
      { type: 'network',    text: 'Partner bank queried verifyKYC()',                             at: '3 hrs ago' },
    ];
  }

  getNetworkTopology() {
    return {
      consensus: 'RAFT',
      blockHeight: this.data.getBlockHeight(),
      nodes: [
        { name: 'Lloyds hub',          role: 'validator', canWrite: true,  status: 'online' },
        { name: 'Halifax',             role: 'validator', canWrite: true,  status: 'online' },
        { name: 'Bank of Scotland',    role: 'validator', canWrite: true,  status: 'online' },
        { name: 'Credit bureau',       role: 'validator', canWrite: true,  status: 'online' },
        { name: 'Regulator observer',  role: 'observer',  canWrite: false, status: 'online' },
      ],
    };
  }

  async getKycRegistry(status?: string) {
    return this.data.getRegistry(status);
  }

  async updateConsent(credentialId: string, payload: ConsentPayload) {
    const record = await this.data.getCredential(credentialId);
    if (!record) throw new NotFoundException(`Credential ${credentialId} not found`);
    const bank = payload.bank?.trim();
    if (!bank) throw new BadRequestException('bank is required');
    const bankExists = record.sharedWith.includes(bank);
    if (payload.action === 'share' && !bankExists) {
      record.sharedWith.push(bank);
      await this.data.updateCredential(credentialId, { sharedWith: record.sharedWith });
      await this.data.pushLedgerEvent(credentialId, 'ConsentGranted', `Consent shared with ${bank}`, 'Consent service');
    }
    if (payload.action === 'revoke' && bankExists) {
      record.sharedWith = record.sharedWith.filter(v => v !== bank);
      await this.data.updateCredential(credentialId, { sharedWith: record.sharedWith });
      await this.data.pushLedgerEvent(credentialId, 'ConsentRevoked', `Consent revoked for ${bank}`, 'Consent service');
    }
    return { credentialId, sharedWith: record.sharedWith, message: payload.action === 'share' ? `Consent shared with ${bank}` : `Consent revoked for ${bank}` };
  }

  async getLoanApplications() {
    return this.data.getApplications();
  }

  async getLoanDecision(applicationId: string) {
    const application = await this.data.getApplication(applicationId);
    if (!application) throw new NotFoundException(`Application ${applicationId} not found`);
    const credential = application.credentialId ? await this.data.getCredential(application.credentialId) : null;
    const credentialActive = credential?.status === 'Active';
    return {
      application,
      kyc: credential ? { credentialId: credential.credentialId, issuer: credential.issuer, status: credential.status, verified: credentialActive } : null,
      verdictTrace: [
        { step: 'IssueKYC()',        ok: true,                    note: 'Credential exists on-chain' },
        { step: 'VerifyKYC()',       ok: Boolean(credential),     note: credential ? 'Credential resolved' : 'No credential linked' },
        { step: 'Credential Active', ok: credentialActive,        note: credentialActive ? 'Status is active' : 'Not active or unavailable' },
        { step: 'Policy Decision',   ok: application.status === 'Auto-eligible' || application.status === 'Approved', note: application.status === 'Auto-eligible' || application.status === 'Approved' ? 'Auto-approve rule matched' : 'Manual review or pending docs' },
      ],
    };
  }

  async decideLoan(applicationId: string, payload: DecisionPayload) {
    const application = await this.data.getApplication(applicationId);
    if (!application) throw new NotFoundException(`Application ${applicationId} not found`);
    const actor = payload.actor?.trim() || 'Senior admin';
    const newStatus = payload.decision === 'grant' ? 'Approved' : 'Rejected';
    await this.data.updateApplication(applicationId, { status: newStatus, decision: payload.decision, remark: payload.remark, decidedBy: actor });
    if (application.credentialId) {
      await this.data.pushLedgerEvent(application.credentialId, payload.decision === 'grant' ? 'LoanGranted' : 'LoanRejected', `Loan ${payload.decision} for ${applicationId}`, actor);
    }
    return { applicationId, status: newStatus, actor, remark: payload.remark ?? null, message: payload.decision === 'grant' ? 'Loan granted and written to ledger' : 'Loan rejected and written to ledger' };
  }

  async getLedgerExplorer(credentialId: string) {
    const credential = await this.data.getCredential(credentialId);
    if (!credential) throw new NotFoundException(`Credential ${credentialId} not found`);
    const events = await this.data.getEvents(credentialId);
    return {
      credential: { credentialId: credential.credentialId, subject: credential.customerName, did: credential.did, issuer: credential.issuer, status: credential.status, expiresOn: credential.expiresOn },
      events,
    };
  }

  async getAdminControlCenter() {
    const applications = await this.data.getApplications();
    return {
      roles: [
        { name: 'Loan officer',        tier: 'Tier 1',   users: 14, description: 'Reviews applications and decides low-risk cases.' },
        { name: 'Senior admin',        tier: 'Tier 2',   users: 5,  description: 'Can issue or revoke credentials and configure policy engine rules.' },
        { name: 'Compliance officer',  tier: 'Tier 2',   users: 3,  description: 'Can audit and revoke credentials across the network.' },
        { name: 'Regulator observer',  tier: 'External', users: 2,  description: 'Read-only view into ledger and anonymized application state.' },
      ],
      permissions: [
        { capability: 'View applications',       loanOfficer: true,        seniorAdmin: true,  complianceOfficer: true,  regulatorObserver: 'anonymized' },
        { capability: 'Accept or reject loans',  loanOfficer: 'up_to_50k', seniorAdmin: true,  complianceOfficer: false, regulatorObserver: false },
        { capability: 'Call verifyKYC()',         loanOfficer: true,        seniorAdmin: true,  complianceOfficer: true,  regulatorObserver: true },
        { capability: 'Call issueKYC()',          loanOfficer: false,       seniorAdmin: true,  complianceOfficer: false, regulatorObserver: false },
        { capability: 'Call revokeKYC()',         loanOfficer: false,       seniorAdmin: true,  complianceOfficer: true,  regulatorObserver: false },
      ],
      policies: this.data.policies,
      queueSummary: {
        autoEligible:  applications.filter(a => a.status === 'Auto-eligible' || a.status === 'Approved').length,
        manualReview:  applications.filter(a => a.status === 'Manual review' || a.status === 'Rejected').length,
        pendingDocs:   applications.filter(a => a.status === 'Pending docs').length,
      },
    };
  }
}
