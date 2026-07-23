import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycCredential } from '../database/entities/kyc-credential.entity';
import { LoanApplication } from '../database/entities/loan-application.entity';
import { LedgerEvent } from '../database/entities/ledger-event.entity';

export type RegistryStatus = 'Active' | 'Expiring soon' | 'Revoked';
export type LoanStatus = 'Auto-eligible' | 'Manual review' | 'Pending docs' | 'Approved' | 'Rejected';
export type LedgerAction = 'IssueKYC' | 'ConsentGranted' | 'ConsentRevoked' | 'VerifyKYC' | 'LoanGranted' | 'LoanRejected';

export interface KycRegistryRecord {
  avatar: string; customerName: string; credentialId: string; issuer: string;
  expiresOn: string; status: RegistryStatus; sharedWith: string[]; txHash: string; did: string;
}

export interface LoanApplicationRecord {
  applicationId: string; avatar: string; applicantName: string; product: string;
  amount: string; creditScore: number | null; kycSource: string; credentialId?: string; status: LoanStatus;
}

export interface PolicyRule { key: string; name: string; rule: string; enabled: boolean; }

const SEED_CREDENTIALS: Partial<KycCredential>[] = [
  { credentialId: 'KYC-RS-88213', avatar: 'RS', customerName: 'Rohan Sharma',  issuer: 'Lloyds',       expiresOn: '12 Jun 2027', status: 'Active',        sharedWith: ['Lloyds'],                             txHash: '0x4a7f...e21b', did: 'did:lloyds:0x88213a..' },
  { credentialId: 'KYC-PN-44021', avatar: 'PN', customerName: 'Priya Nair',   issuer: 'Partner bank', expiresOn: '03 Apr 2027', status: 'Active',        sharedWith: ['Lloyds', 'Halifax'],                  txHash: '0x2b81...77ac', did: 'did:partner:0x44021f..' },
  { credentialId: 'KYC-ST-30187', avatar: 'ST', customerName: 'Sara Thomas',  issuer: 'Lloyds',       expiresOn: '19 Aug 2026', status: 'Expiring soon', sharedWith: ['Lloyds'],                             txHash: '0x33ad...19cf', did: 'did:lloyds:0x30187a..' },
  { credentialId: 'KYC-VD-19042', avatar: 'VD', customerName: 'Vikram Desai', issuer: 'Lloyds',       expiresOn: '-',           status: 'Revoked',       sharedWith: [],                                     txHash: '0x901c...1042', did: 'did:lloyds:0x19042e..' },
  { credentialId: 'KYC-MI-55301', avatar: 'MI', customerName: 'Meera Iyer',   issuer: 'Lloyds',       expiresOn: '15 Jan 2028', status: 'Active',        sharedWith: ['Lloyds', 'Halifax', 'Credit bureau'], txHash: '0x10ff...5301', did: 'did:lloyds:0x55301b..' },
];

const SEED_APPLICATIONS: Partial<LoanApplication>[] = [
  { applicationId: 'LN20458', avatar: 'RS', applicantName: 'Rohan Sharma',  product: 'Personal loan', amount: 'GBP 300,000', creditScore: 782,  kycSource: 'On-chain · Lloyds',   credentialId: 'KYC-RS-88213', status: 'Auto-eligible' },
  { applicationId: 'LN20459', avatar: 'VD', applicantName: 'Vikram Desai',  product: 'Home loan',     amount: 'GBP 450,000', creditScore: null, kycSource: 'New · uploading docs',                             status: 'Pending docs' },
  { applicationId: 'LN20460', avatar: 'ST', applicantName: 'Sara Thomas',   product: 'Vehicle loan',  amount: 'GBP 85,000',  creditScore: 688,  kycSource: 'On-chain · Lloyds',   credentialId: 'KYC-ST-30187', status: 'Manual review' },
  { applicationId: 'LN20461', avatar: 'PN', applicantName: 'Priya Nair',    product: 'Personal loan', amount: 'GBP 55,000',  creditScore: 801,  kycSource: 'On-chain · Partner',  credentialId: 'KYC-PN-44021', status: 'Auto-eligible' },
  { applicationId: 'LN20462', avatar: 'AS', applicantName: 'Aditya Singh',  product: 'Business loan', amount: 'GBP 120,000', creditScore: 738,  kycSource: 'On-chain · Lloyds',   credentialId: 'KYC-MI-55301', status: 'Manual review' },
];

const SEED_EVENTS = [
  { credentialId: 'KYC-RS-88213', action: 'IssueKYC',       txHash: '0x4a7f...e21b', blockNumber: 44102, actor: 'Lloyds validator',         description: 'Credential hash committed after identity verification at issuing bank.' },
  { credentialId: 'KYC-RS-88213', action: 'ConsentGranted', txHash: '0x2b81...77ac', blockNumber: 44103, actor: 'Customer consent service', description: 'Customer consent granted for cross-bank KYC verification within network.' },
  { credentialId: 'KYC-RS-88213', action: 'VerifyKYC',      txHash: '0x7e21...4bcd', blockNumber: 48221, actor: 'Halifax loan engine',       description: 'Loan application check requested; credential returned valid.' },
];

@Injectable()
export class PresentationDataService implements OnModuleInit {
  private blockHeight = 48221;

  readonly policies: PolicyRule[] = [
    { key: 'auto_eligible_threshold', name: 'Auto-eligible threshold',     rule: 'amount <= 50000 and credit_score >= 700 and kyc.valid = true', enabled: true },
    { key: 'manual_review_trigger',   name: 'Manual review trigger',       rule: 'credit_score < 700 or amount > 50000',                        enabled: true },
    { key: 'revocation_cascade',      name: 'Revocation cascade',          rule: 'on revokeKYC() mark open applications as high risk',          enabled: true },
    { key: 'cross_bank_trust',        name: 'Cross-bank credential trust', rule: 'accept verifyKYC() from network validated issuers only',      enabled: true },
  ];

  constructor(
    @InjectRepository(KycCredential)  private readonly credentialRepo: Repository<KycCredential>,
    @InjectRepository(LoanApplication) private readonly applicationRepo: Repository<LoanApplication>,
    @InjectRepository(LedgerEvent)    private readonly eventRepo: Repository<LedgerEvent>,
  ) {}

  async onModuleInit() { await this.seedIfEmpty(); }

  private async seedIfEmpty() {
    const count = await this.credentialRepo.count();
    if (count > 0) return;
    for (const c of SEED_CREDENTIALS) await this.credentialRepo.save(this.credentialRepo.create(c));
    for (const a of SEED_APPLICATIONS) await this.applicationRepo.save(this.applicationRepo.create(a));
    for (const e of SEED_EVENTS) await this.eventRepo.save(this.eventRepo.create(e));
  }

  getBlockHeight() { return this.blockHeight; }

  async getRegistry(status?: string): Promise<KycCredential[]> {
    const all = await this.credentialRepo.find({ order: { createdAt: 'ASC' } });
    if (!status || status.toLowerCase() === 'all') return all;
    return all.filter(r => r.status.toLowerCase() === status.toLowerCase());
  }

  async getCredential(credentialId: string): Promise<KycCredential | null> {
    return this.credentialRepo.findOneBy({ credentialId });
  }

  async saveCredential(data: Partial<KycCredential>): Promise<KycCredential> {
    return this.credentialRepo.save(this.credentialRepo.create(data));
  }

  async updateCredential(credentialId: string, data: Partial<KycCredential>): Promise<KycCredential | null> {
    await this.credentialRepo.update({ credentialId }, data);
    return this.credentialRepo.findOneBy({ credentialId });
  }

  async getApplications(): Promise<LoanApplication[]> {
    return this.applicationRepo.find({ order: { createdAt: 'ASC' } });
  }

  async getApplication(applicationId: string): Promise<LoanApplication | null> {
    return this.applicationRepo.findOneBy({ applicationId });
  }

  async saveApplication(data: Partial<LoanApplication>): Promise<LoanApplication> {
    return this.applicationRepo.save(this.applicationRepo.create(data));
  }

  async updateApplication(applicationId: string, data: Partial<LoanApplication>): Promise<LoanApplication | null> {
    await this.applicationRepo.update({ applicationId }, data);
    return this.applicationRepo.findOneBy({ applicationId });
  }

  async getEvents(credentialId: string): Promise<LedgerEvent[]> {
    return this.eventRepo.find({ where: { credentialId }, order: { timestamp: 'ASC' } });
  }

  async getAllRecentEvents(limit = 10): Promise<LedgerEvent[]> {
    return this.eventRepo.find({ order: { timestamp: 'DESC' }, take: limit });
  }

  async pushLedgerEvent(credentialId: string, action: LedgerAction, description: string, actor: string): Promise<LedgerEvent> {
    this.blockHeight += 1;
    return this.eventRepo.save(this.eventRepo.create({
      credentialId, action, description, actor,
      blockNumber: this.blockHeight,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    }));
  }
}
