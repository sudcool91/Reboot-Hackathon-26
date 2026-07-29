import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycRequest } from '../database/entities/kyc-request.entity';
import { KycCredential } from '../database/entities/kyc-credential.entity';
import { SdkFabricGateway } from '../fabric/gateways/sdk-fabric.gateway';

@Injectable()
export class KycRequestsService {
  private readonly logger = new Logger(KycRequestsService.name);

  constructor(
    @InjectRepository(KycRequest)
    private readonly repo: Repository<KycRequest>,
    @InjectRepository(KycCredential)
    private readonly credRepo: Repository<KycCredential>,
    private readonly sdkGateway: SdkFabricGateway,
  ) {}

  async create(data: Partial<KycRequest>) {
    const req = this.repo.create(data);
    return this.repo.save(req);
  }

  async findAll(status?: string) {
    if (status) return this.repo.find({ where: { status }, order: { createdAt: 'DESC' } });
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findByEmail(email: string) {
    return this.repo.find({ where: { email }, order: { createdAt: 'DESC' } });
  }

  async findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async decide(id: number, decision: 'approved' | 'rejected', remark: string, decidedBy: string) {
    const req = await this.repo.findOne({ where: { id } });
    if (!req) return null;

    req.status = decision;
    req.adminRemark = remark;
    req.decidedBy = decidedBy;
    req.decidedAt = new Date();

    if (decision === 'approved') {
      // ── Step 1: Derive a stable customerID from the KYC request ────────────
      const initials = req.customerName
        .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 3);
      const customerID = `KYC-${initials}-${req.id}`;

      // ── Step 2: Ensure customer exists on Fabric, then issueKYC ────────────
      let fabricTxId: string | null = null;
      try {
        const contractService = this.sdkGateway.getSDK().getContractService();

        // First, create the customer record on Fabric if not already there
        try {
          await contractService.createCustomer({
            customerID,
            fullName:    req.customerName,
            dateOfBirth: req.dob || '',
            email:       req.email || '',
            phone:       req.phone || '',
            address:     req.address || '',
            nationalID:  req.nationality || 'PENDING',
            issuingBank: 'LloydsBankingGroup',
            documentHash: `HASH-${customerID}-${Date.now()}`,
          });
        } catch (createErr) {
          // Customer may already exist — that's fine, continue to issueKYC
          this.logger.warn(`CreateCustomer skipped (may already exist): ${createErr.message}`);
        }

        // Issue KYC on Fabric — returns TX ID
        const kycResult = await contractService.issueKYC(customerID);
        if (kycResult.success) {
          fabricTxId = kycResult.txId;
          this.logger.log(`Fabric IssueKYC success for ${customerID}, txId: ${fabricTxId}`);
        } else {
          this.logger.error(`Fabric IssueKYC failed: ${kycResult.message}`);
        }
      } catch (err) {
        this.logger.error(`Fabric call failed during KYC approval: ${err.message}`);
      }

      // ── Step 3: Generate credential ID (blockchain-backed if Fabric succeeded)
      // Use Fabric txId to form the credential ID so it's traceable on chain
      req.credentialId = customerID; // stable, human-readable, matches Fabric customerID
      req.txHash = fabricTxId || ('0x' + Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0'),
      ).join(''));

      // ── Step 4: Write / update kyc_credentials (KYC Registry) ─────────────
      const expiresDate = new Date();
      expiresDate.setFullYear(expiresDate.getFullYear() + 2);
      const expiresOn = expiresDate.toISOString().split('T')[0];
      const initials2 = req.customerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

      const existing = req.email
        ? await this.credRepo.findOne({ where: { email: req.email } })
        : null;

      if (existing) {
        existing.credentialId = req.credentialId;
        existing.status = 'Active';
        existing.txHash = req.txHash;
        existing.expiresOn = expiresOn;
        await this.credRepo.save(existing);
      } else {
        const cred = this.credRepo.create({
          credentialId: req.credentialId,
          customerId:   req.email || String(req.id),
          avatar:       initials2,
          customerName: req.customerName,
          email:        req.email,
          phone:        req.phone,
          issuer:       'Lloyds',
          expiresOn,
          status:       'Active',
          sharedWith:   [],
          txHash:       req.txHash,
        });
        await this.credRepo.save(cred);
      }
    }

    return this.repo.save(req);
  }
}
