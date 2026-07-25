import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
    private readonly fabricGateway: SdkFabricGateway,
  ) {}

  async create(data: Partial<KycRequest>) {
    const req = this.repo.create(data);
    const savedReq = await this.repo.save(req);

    const customerId = this.buildFabricCustomerId(savedReq.id);
    const fabricCreate = await this.createCustomerOnFabric(savedReq, customerId);

    if (!fabricCreate.success) {
      await this.repo.delete(savedReq.id);
      throw new BadRequestException(`Failed to create customer on Fabric: ${fabricCreate.message}`);
    }

    savedReq.txHash = fabricCreate.txId || savedReq.txHash;
    return this.repo.save(savedReq);
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
      const initials = req.customerName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 3);
      req.credentialId = `KYC-${initials}-${Math.floor(Math.random() * 90000 + 10000)}`;
      req.txHash = '0x' + Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0'),
      ).join('');

      const customerId = this.buildFabricCustomerId(req.id);
      const fabricIssue = await this.issueKycOnFabric(customerId);
      if (!fabricIssue.success) {
        throw new BadRequestException(`Failed to approve customer on Fabric: ${fabricIssue.message}`);
      }
      req.txHash = fabricIssue.txId || req.txHash;

      // Auto-create or update kyc_credentials (registry) entry
      const expiresDate = new Date();
      expiresDate.setFullYear(expiresDate.getFullYear() + 2);
      const expiresOn = expiresDate.toISOString().split('T')[0];

      const existing = req.email
        ? await this.credRepo.findOne({ where: { email: req.email } })
        : null;

      if (existing) {
        existing.customerId = customerId;
        existing.credentialId = req.credentialId;
        existing.status = 'Active';
        existing.txHash = req.txHash;
        existing.expiresOn = expiresOn;
        await this.credRepo.save(existing);
      } else {
        const initials2 = req.customerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const cred = this.credRepo.create({
          credentialId: req.credentialId,
          customerId,
          avatar: initials2,
          customerName: req.customerName,
          email: req.email,
          phone: req.phone,
          issuer: 'Lloyds',
          expiresOn,
          status: 'Active',
          sharedWith: [],
          txHash: req.txHash,
        });
        await this.credRepo.save(cred);
      }
    }

    return this.repo.save(req);
  }

  private buildFabricCustomerId(requestId: number): string {
    return `CUST-REQ-${requestId}`;
  }

  private async createCustomerOnFabric(req: KycRequest, customerId: string) {
    const sdk = this.fabricGateway.getSDK();
    const contractService = sdk.getContractService();

    const result = await contractService.createCustomer({
      customerID: customerId,
      fullName: req.customerName,
      dateOfBirth: req.dob || '1990-01-01',
      email: req.email || '',
      phone: req.phone || '',
      address: req.address || '',
      nationalID: req.nationality || 'N/A',
      issuingBank: 'Lloyds Branch Validator',
      documentHash: `sha256:kyc-request-${req.id}`,
    });

    if (result.success) {
      this.logger.log(`Customer ${customerId} created on Fabric`);
    } else {
      this.logger.error(`Failed to create customer ${customerId} on Fabric: ${result.message}`);
    }

    return result;
  }

  private async issueKycOnFabric(customerId: string) {
    const sdk = this.fabricGateway.getSDK();
    const contractService = sdk.getContractService();

    const result = await contractService.executeFunction('IssueKYC', customerId);
    if (result.success) {
      this.logger.log(`IssueKYC succeeded on Fabric for ${customerId}`);
    } else {
      this.logger.error(`IssueKYC failed on Fabric for ${customerId}: ${result.message}`);
    }
    return result;
  }
}
