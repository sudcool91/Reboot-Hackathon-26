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
    const fastTracked = applications.filter(a => a.status === 'Auto-eligible' || a.status === 'Approved').length;
    const fastTrackedPct = applications.length ? Math.round((fastTracked / applications.length) * 100) : 0;
    return {
      totalApplications: applications.length,
      fastTracked,
      fastTrackedPct,
      avgDecisionTime: '4.2 min',
      credentialsOnLedger: registry.length,
      activeCredentials: registry.filter(r => r.status === 'Active').length,
      pendingDocuments: applications.filter(a => a.status === 'Pending docs').length,
      blockHeight: this.data.getBlockHeight(),
      validatorSync: '4/4',
    };
  }

  async getDashboardActivity() {
    const events = await this.data.getAllRecentEvents(10);
    const applications = await this.data.getApplications();
    const appMap = new Map(applications.map(a => [a.credentialId, a]));

    const ACTION_LABEL: Record<string, string> = {
      IssueKYC: 'New credential issued',
      ConsentGranted: 'Consent granted',
      ConsentRevoked: 'Consent revoked',
      VerifyKYC: 'Credential verified',
      LoanGranted: 'Loan granted',
      LoanRejected: 'Loan rejected',
    };

    return events.map(e => {
      const app = appMap.get(e.credentialId);
      const name = app?.applicantName || e.credentialId;
      const label = ACTION_LABEL[e.action] || e.action;
      const ago = e.timestamp ? this.timeAgo(new Date(e.timestamp)) : '';
      return {
        type: e.action,
        credentialId: e.credentialId,
        actor: e.actor,
        text: `${label} — ${name}`,
        description: e.description,
        blockNumber: e.blockNumber,
        txHash: e.txHash,
        at: ago,
        timestamp: e.timestamp,
      };
    });
  }

  private timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} days ago`;
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

  async createLoanApplication(body: any) {
    // Generate unique application ID
    const count = await this.data.getApplications();
    const nextNum = 20458 + count.length + 1;
    const applicationId = `LN${nextNum}`;

    const newApp = await this.data.saveApplication({
      applicationId,
      avatar: body.avatar || (body.applicantName || 'XX').slice(0, 2).toUpperCase(),
      applicantName: body.applicantName,
      customerName: body.applicantName,
      product: body.product,
      amount: body.amount,
      kycSource: body.kycSource || 'New · customer portal',
      status: body.status || 'Pending docs',
      creditScore: body.creditScore ? parseInt(body.creditScore) : (body.creditScoreSelf ? parseInt(body.creditScoreSelf) : null),
      email: body.email || null,
      phone: body.phone || null,
      dob: body.dob || null,
      address: body.address || null,
      employmentStatus: body.employmentStatus || null,
      annualIncome: body.annualIncome ? String(body.annualIncome) : undefined,
      purpose: body.purpose || undefined,
      loanTerm: body.loanTerm ? String(body.loanTerm) : undefined,
      existingDebts: body.existingDebts ? String(body.existingDebts) : undefined,
      targetBank: body.targetBank || null,
      shareConsent: !!body.shareConsent,
      credentialId: body.credentialId || null,
    });

    // Push a ledger event for tracking
    await this.data.pushLedgerEvent(
      applicationId,
      'IssueKYC',
      `New application submitted by ${body.applicantName} for ${body.product}`,
      'Customer portal',
    );

    return { ...newApp, message: 'Application received and queued for review' };
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
      const desc = payload.decision === 'grant'
        ? `Loan application approved — ${application.product} ${application.amount || ''} for ${application.customerName || application.applicantName || applicationId}.`
        : `Loan application for ${application.product} (${application.customerName || application.applicantName || applicationId}) was declined.`;
      await this.data.pushLedgerEvent(application.credentialId, payload.decision === 'grant' ? 'LoanGranted' : 'LoanRejected', desc, actor);
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
