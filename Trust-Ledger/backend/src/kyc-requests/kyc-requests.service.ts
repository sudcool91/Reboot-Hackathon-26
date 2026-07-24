import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycRequest } from '../database/entities/kyc-request.entity';

@Injectable()
export class KycRequestsService {
  constructor(
    @InjectRepository(KycRequest)
    private readonly repo: Repository<KycRequest>,
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
    }

    return this.repo.save(req);
  }
}
