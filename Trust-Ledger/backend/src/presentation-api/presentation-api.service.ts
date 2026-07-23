import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PresentationDataService } from './presentation-data.service';

interface DecisionPayload {
  decision: 'grant' | 'reject';
  remark?: string;
  actor?: string;
}

interface ConsentPayload {
  bank: string;
  action: 'share' | 'revoke';
}

@Injectable()
export class PresentationApiService {
  constructor(private readonly data: PresentationDataService) {}

  getDashboardSummary() {
    const applications = Array.from(this.data.applications.values());
    const registry = Array.from(this.data.registry.values());

    const autoEligibleCount = applications.filter(
      (application) => application.status === 'Auto-eligible',
    ).length;

    const pendingDocsCount = applications.filter(
      (application) => application.status === 'Pending docs',
    ).length;

    const activeCredentials = registry.filter(
      (record) => record.status === 'Active',
    ).length;

    return {
      applicationsReceived: applications.length,
      fastTrackedViaOnChainKyc: autoEligibleCount,
      pendingDocuments: pendingDocsCount,
      activeCredentials,
      credentialsIssued: registry.length,
      averageDecisionTime: '4.2 min',
      blockHeight: this.data.getBlockHeight(),
      validatorSync: '4/4',
    };
  }

  getDashboardActivity() {
    return [
      {
        type: 'loan',
        text: 'Anita accepted LN20458 for Rohan Sharma',
        at: '2 min ago',
      },
      {
        type: 'compliance',
        text: 'Compliance flagged credential KYC-VD-19042',
        at: '38 min ago',
      },
      {
        type: 'ledger',
        text: 'New credential issued for Meera Iyer at block #48,201',
        at: '1 hr ago',
      },
      {
        type: 'network',
        text: 'Partner bank queried verifyKYC()',
        at: '3 hrs ago',
      },
    ];
  }

  getNetworkTopology() {
    return {
      consensus: 'RAFT',
      blockHeight: this.data.getBlockHeight(),
      nodes: [
        { name: 'Lloyds hub', role: 'validator', canWrite: true, status: 'online' },
        { name: 'Halifax', role: 'validator', canWrite: true, status: 'online' },
        {
          name: 'Bank of Scotland',
          role: 'validator',
          canWrite: true,
          status: 'online',
        },
        {
          name: 'Credit bureau',
          role: 'validator',
          canWrite: true,
          status: 'online',
        },
        {
          name: 'Regulator observer',
          role: 'observer',
          canWrite: false,
          status: 'online',
        },
      ],
    };
  }

  getKycRegistry(status?: string) {
    const rows = Array.from(this.data.registry.values());

    if (!status || status.toLowerCase() === 'all') {
      return rows;
    }

    return rows.filter(
      (record) => record.status.toLowerCase() === status.toLowerCase(),
    );
  }

  updateConsent(credentialId: string, payload: ConsentPayload) {
    const record = this.data.registry.get(credentialId);
    if (!record) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    const bank = payload.bank?.trim();
    if (!bank) {
      throw new BadRequestException('bank is required');
    }

    const bankExists = record.sharedWith.includes(bank);
    if (payload.action === 'share' && !bankExists) {
      record.sharedWith.push(bank);
      this.data.pushLedgerEvent(
        record.credentialId,
        'ConsentGranted',
        `Consent shared with ${bank}`,
        'Consent service',
      );
    }

    if (payload.action === 'revoke' && bankExists) {
      record.sharedWith = record.sharedWith.filter((value) => value !== bank);
      this.data.pushLedgerEvent(
        record.credentialId,
        'ConsentRevoked',
        `Consent revoked for ${bank}`,
        'Consent service',
      );
    }

    return {
      credentialId: record.credentialId,
      sharedWith: record.sharedWith,
      message:
        payload.action === 'share'
          ? `Consent shared with ${bank}`
          : `Consent revoked for ${bank}`,
    };
  }

  getLoanApplications() {
    return Array.from(this.data.applications.values());
  }

  getLoanDecision(applicationId: string) {
    const application = this.data.applications.get(applicationId);
    if (!application) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    const credential = application.credentialId
      ? this.data.registry.get(application.credentialId)
      : undefined;

    const credentialActive = credential?.status === 'Active';

    return {
      application,
      kyc: credential
        ? {
            credentialId: credential.credentialId,
            issuer: credential.issuer,
            status: credential.status,
            verified: credentialActive,
          }
        : null,
      verdictTrace: [
        { step: 'IssueKYC()', ok: true, note: 'Credential exists on-chain' },
        {
          step: 'VerifyKYC()',
          ok: Boolean(credential),
          note: credential ? 'Credential resolved' : 'No credential linked',
        },
        {
          step: 'Credential Active',
          ok: credentialActive,
          note: credentialActive ? 'Status is active' : 'Not active or unavailable',
        },
        {
          step: 'Policy Decision',
          ok: application.status === 'Auto-eligible' || application.status === 'Approved',
          note:
            application.status === 'Auto-eligible' ||
            application.status === 'Approved'
              ? 'Auto-approve rule matched'
              : 'Manual review or pending docs',
        },
      ],
    };
  }

  decideLoan(applicationId: string, payload: DecisionPayload) {
    const application = this.data.applications.get(applicationId);
    if (!application) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    const actor = payload.actor?.trim() || 'Senior admin';
    application.status = payload.decision === 'grant' ? 'Approved' : 'Rejected';

    if (application.credentialId) {
      this.data.pushLedgerEvent(
        application.credentialId,
        payload.decision === 'grant' ? 'LoanGranted' : 'LoanRejected',
        `Loan ${payload.decision} for ${application.applicationId}`,
        actor,
      );
    }

    return {
      applicationId: application.applicationId,
      status: application.status,
      actor,
      remark: payload.remark ?? null,
      message:
        payload.decision === 'grant'
          ? 'Loan granted and written to ledger'
          : 'Loan rejected and written to ledger',
    };
  }

  getLedgerExplorer(credentialId: string) {
    const credential = this.data.registry.get(credentialId);
    if (!credential) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    return {
      credential: {
        credentialId: credential.credentialId,
        subject: credential.customerName,
        did: credential.did,
        issuer: credential.issuer,
        status: credential.status,
        expiresOn: credential.expiresOn,
      },
      events: this.data.ledgerEvents
        .filter((event) => event.credentialId === credentialId)
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    };
  }

  getAdminControlCenter() {
    const applications = Array.from(this.data.applications.values());

    const autoEligible = applications.filter(
      (application) =>
        application.status === 'Auto-eligible' || application.status === 'Approved',
    ).length;

    const manualReview = applications.filter(
      (application) =>
        application.status === 'Manual review' || application.status === 'Rejected',
    ).length;

    const pendingDocs = applications.filter(
      (application) => application.status === 'Pending docs',
    ).length;

    return {
      roles: [
        {
          name: 'Loan officer',
          tier: 'Tier 1',
          users: 14,
          description: 'Reviews applications and decides low-risk cases.',
        },
        {
          name: 'Senior admin',
          tier: 'Tier 2',
          users: 5,
          description:
            'Can issue or revoke credentials and configure policy engine rules.',
        },
        {
          name: 'Compliance officer',
          tier: 'Tier 2',
          users: 3,
          description: 'Can audit and revoke credentials across the network.',
        },
        {
          name: 'Regulator observer',
          tier: 'External',
          users: 2,
          description: 'Read-only view into ledger and anonymized application state.',
        },
      ],
      permissions: [
        {
          capability: 'View applications',
          loanOfficer: true,
          seniorAdmin: true,
          complianceOfficer: true,
          regulatorObserver: 'anonymized',
        },
        {
          capability: 'Accept or reject loans',
          loanOfficer: 'up_to_50k',
          seniorAdmin: true,
          complianceOfficer: false,
          regulatorObserver: false,
        },
        {
          capability: 'Call verifyKYC()',
          loanOfficer: true,
          seniorAdmin: true,
          complianceOfficer: true,
          regulatorObserver: true,
        },
        {
          capability: 'Call issueKYC()',
          loanOfficer: false,
          seniorAdmin: true,
          complianceOfficer: false,
          regulatorObserver: false,
        },
        {
          capability: 'Call revokeKYC()',
          loanOfficer: false,
          seniorAdmin: true,
          complianceOfficer: true,
          regulatorObserver: false,
        },
      ],
      policies: this.data.policies,
      queueSummary: {
        autoEligible,
        manualReview,
        pendingDocs,
      },
    };
  }
}
