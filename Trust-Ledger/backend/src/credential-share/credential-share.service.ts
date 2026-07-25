import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CredentialShareRequest } from '../database/entities/credential-share-request.entity';
import { KycCredential } from '../database/entities/kyc-credential.entity';
import { KycRequest } from '../database/entities/kyc-request.entity';
import { FabricService } from '../fabric/fabric.service';

@Injectable()
export class CredentialShareService {
  constructor(
    @InjectRepository(CredentialShareRequest)
    private readonly repo: Repository<CredentialShareRequest>,
    @InjectRepository(KycCredential)
    private readonly credentialRepo: Repository<KycCredential>,
    @InjectRepository(KycRequest)
    private readonly kycRequestRepo: Repository<KycRequest>,
    private readonly fabricService: FabricService,
  ) {}

  create(data: Partial<CredentialShareRequest>) {
    const req = this.repo.create(data);
    return this.repo.save(req);
  }

  findAll(status?: string) {
    if (status) return this.repo.find({ where: { status }, order: { createdAt: 'DESC' } });
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByEmail(email: string) {
    return this.repo.find({ where: { customerEmail: email }, order: { createdAt: 'DESC' } });
  }

  async decide(id: number, decision: 'approved' | 'rejected', remark: string, decidedBy: string) {
    const req = await this.repo.findOne({ where: { id } });
    if (!req) return null;

    if (decision === 'approved') {
      const credential = await this.credentialRepo.findOne({ where: { credentialId: req.credentialId } });
      if (!credential) {
        throw new NotFoundException(`Credential ${req.credentialId} not found`);
      }

      if (!credential.customerId) {
        const approvedRequest = await this.kycRequestRepo.findOne({
          where: { credentialId: req.credentialId, status: 'approved' },
          order: { id: 'DESC' },
        });

        if (approvedRequest?.id) {
          credential.customerId = `CUST-REQ-${approvedRequest.id}`;
          await this.credentialRepo.save(credential);
        }
      }

      if (!credential.customerId) {
        throw new BadRequestException(`Credential ${req.credentialId} is missing customerId mapping`);
      }

      const fabricResult = await this.fabricService.submit('GrantConsent', {
        customerID: credential.customerId,
      });

      if (this.isFabricFailure(fabricResult)) {
        const fabricError = this.getFabricError(fabricResult).toLowerCase();
        const alreadyGranted = fabricError.includes('consent already granted') || fabricError.includes('already granted');
        if (!alreadyGranted) {
          throw new BadRequestException(`Failed to grant consent on Fabric: ${this.getFabricError(fabricResult)}`);
        }
      }

      if (!credential.sharedWith.includes(req.targetBank)) {
        credential.sharedWith = [...credential.sharedWith, req.targetBank];
        await this.credentialRepo.save(credential);
      }
    }

    req.status = decision;
    req.adminRemark = remark;
    req.decidedBy = decidedBy;
    req.decidedAt = new Date();
    return this.repo.save(req);
  }

  private isFabricFailure(result: unknown): boolean {
    if (!result || typeof result !== 'object') {
      return false;
    }
    return 'success' in result && (result as { success?: boolean }).success === false;
  }

  private getFabricError(result: unknown): string {
    if (!result || typeof result !== 'object') {
      return 'Unknown Fabric error';
    }
    const message = (result as { message?: string }).message;
    return typeof message === 'string' && message ? message : 'Unknown Fabric error';
  }
}
