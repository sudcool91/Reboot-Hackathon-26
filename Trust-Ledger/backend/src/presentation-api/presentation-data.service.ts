import { Injectable } from '@nestjs/common';

export type RegistryStatus = 'Active' | 'Expiring soon' | 'Revoked';
export type LoanStatus =
  | 'Auto-eligible'
  | 'Manual review'
  | 'Pending docs'
  | 'Approved'
  | 'Rejected';

export type LedgerAction =
  | 'IssueKYC'
  | 'ConsentGranted'
  | 'ConsentRevoked'
  | 'VerifyKYC'
  | 'LoanGranted'
  | 'LoanRejected';

export interface KycRegistryRecord {
  avatar: string;
  customerName: string;
  credentialId: string;
  issuer: string;
  expiresOn: string;
  status: RegistryStatus;
  sharedWith: string[];
  txHash: string;
  did: string;
}

export interface LoanApplicationRecord {
  applicationId: string;
  avatar: string;
  applicantName: string;
  product: string;
  amount: string;
  creditScore: number | null;
  kycSource: string;
  credentialId?: string;
  status: LoanStatus;
}

export interface LedgerEvent {
  credentialId: string;
  action: LedgerAction;
  timestamp: string;
  txHash: string;
  blockNumber: number;
  actor: string;
  description: string;
}

export interface PolicyRule {
  key: string;
  name: string;
  rule: string;
  enabled: boolean;
}

@Injectable()
export class PresentationDataService {
  private blockHeight = 48221;

  readonly registry = new Map<string, KycRegistryRecord>([
    [
      'KYC-RS-88213',
      {
        avatar: 'RS',
        customerName: 'Rohan Sharma',
        credentialId: 'KYC-RS-88213',
        issuer: 'Lloyds',
        expiresOn: '12 Jun 2027',
        status: 'Active',
        sharedWith: ['Lloyds'],
        txHash: '0x4a7f...e21b',
        did: 'did:lloyds:0x88213a..',
      },
    ],
    [
      'KYC-PN-44021',
      {
        avatar: 'PN',
        customerName: 'Priya Nair',
        credentialId: 'KYC-PN-44021',
        issuer: 'Partner bank',
        expiresOn: '03 Apr 2027',
        status: 'Active',
        sharedWith: ['Lloyds', 'Halifax'],
        txHash: '0x2b81...77ac',
        did: 'did:partner:0x44021f..',
      },
    ],
    [
      'KYC-ST-30187',
      {
        avatar: 'ST',
        customerName: 'Sara Thomas',
        credentialId: 'KYC-ST-30187',
        issuer: 'Lloyds',
        expiresOn: '19 Aug 2026',
        status: 'Expiring soon',
        sharedWith: ['Lloyds'],
        txHash: '0x33ad...19cf',
        did: 'did:lloyds:0x30187a..',
      },
    ],
    [
      'KYC-VD-19042',
      {
        avatar: 'VD',
        customerName: 'Vikram Desai',
        credentialId: 'KYC-VD-19042',
        issuer: 'Lloyds',
        expiresOn: '-',
        status: 'Revoked',
        sharedWith: [],
        txHash: '0x901c...1042',
        did: 'did:lloyds:0x19042e..',
      },
    ],
    [
      'KYC-MI-55301',
      {
        avatar: 'MI',
        customerName: 'Meera Iyer',
        credentialId: 'KYC-MI-55301',
        issuer: 'Lloyds',
        expiresOn: '15 Jan 2028',
        status: 'Active',
        sharedWith: ['Lloyds', 'Halifax', 'Credit bureau'],
        txHash: '0x10ff...5301',
        did: 'did:lloyds:0x55301b..',
      },
    ],
  ]);

  readonly applications = new Map<string, LoanApplicationRecord>([
    [
      'LN20458',
      {
        applicationId: 'LN20458',
        avatar: 'RS',
        applicantName: 'Rohan Sharma',
        product: 'Personal loan',
        amount: 'GBP 300,000',
        creditScore: 782,
        kycSource: 'On-chain · Lloyds',
        credentialId: 'KYC-RS-88213',
        status: 'Auto-eligible',
      },
    ],
    [
      'LN20459',
      {
        applicationId: 'LN20459',
        avatar: 'VD',
        applicantName: 'Vikram Desai',
        product: 'Home loan',
        amount: 'GBP 450,000',
        creditScore: null,
        kycSource: 'New · uploading docs',
        status: 'Pending docs',
      },
    ],
    [
      'LN20460',
      {
        applicationId: 'LN20460',
        avatar: 'ST',
        applicantName: 'Sara Thomas',
        product: 'Vehicle loan',
        amount: 'GBP 85,000',
        creditScore: 688,
        kycSource: 'On-chain · Lloyds',
        credentialId: 'KYC-ST-30187',
        status: 'Manual review',
      },
    ],
    [
      'LN20461',
      {
        applicationId: 'LN20461',
        avatar: 'PN',
        applicantName: 'Priya Nair',
        product: 'Personal loan',
        amount: 'GBP 55,000',
        creditScore: 801,
        kycSource: 'On-chain · Partner',
        credentialId: 'KYC-PN-44021',
        status: 'Auto-eligible',
      },
    ],
    [
      'LN20462',
      {
        applicationId: 'LN20462',
        avatar: 'AS',
        applicantName: 'Aditya Singh',
        product: 'Business loan',
        amount: 'GBP 120,000',
        creditScore: 738,
        kycSource: 'On-chain · Lloyds',
        credentialId: 'KYC-MI-55301',
        status: 'Manual review',
      },
    ],
  ]);

  readonly ledgerEvents: LedgerEvent[] = [
    {
      credentialId: 'KYC-RS-88213',
      action: 'IssueKYC',
      timestamp: '2026-06-12T10:14:00Z',
      txHash: '0x4a7f...e21b',
      blockNumber: 44102,
      actor: 'Lloyds validator',
      description:
        'Credential hash committed after identity verification at issuing bank.',
    },
    {
      credentialId: 'KYC-RS-88213',
      action: 'ConsentGranted',
      timestamp: '2026-06-12T10:15:00Z',
      txHash: '0x2b81...77ac',
      blockNumber: 44103,
      actor: 'Customer consent service',
      description:
        'Customer consent granted for cross-bank KYC verification within network.',
    },
    {
      credentialId: 'KYC-RS-88213',
      action: 'VerifyKYC',
      timestamp: '2026-06-23T09:02:00Z',
      txHash: '0x7e21...4bcd',
      blockNumber: 48221,
      actor: 'Halifax loan engine',
      description: 'Loan application check requested; credential returned valid.',
    },
  ];

  readonly policies: PolicyRule[] = [
    {
      key: 'auto_eligible_threshold',
      name: 'Auto-eligible threshold',
      rule: 'amount <= 50000 and credit_score >= 700 and kyc.valid = true',
      enabled: true,
    },
    {
      key: 'manual_review_trigger',
      name: 'Manual review trigger',
      rule: 'credit_score < 700 or amount > 50000',
      enabled: true,
    },
    {
      key: 'revocation_cascade',
      name: 'Revocation cascade',
      rule: 'on revokeKYC() mark open applications as high risk',
      enabled: true,
    },
    {
      key: 'cross_bank_trust',
      name: 'Cross-bank credential trust',
      rule: 'accept verifyKYC() from network validated issuers only',
      enabled: true,
    },
  ];

  getBlockHeight() {
    return this.blockHeight;
  }

  pushLedgerEvent(
    credentialId: string,
    action: LedgerAction,
    description: string,
    actor: string,
  ) {
    this.blockHeight += 1;

    this.ledgerEvents.push({
      credentialId,
      action,
      description,
      actor,
      blockNumber: this.blockHeight,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random()
        .toString(16)
        .slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    });
  }
}
