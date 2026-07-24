import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CredentialShareRequest } from '../database/entities/credential-share-request.entity';

@Injectable()
export class CredentialShareService {
  constructor(
    @InjectRepository(CredentialShareRequest)
    private readonly repo: Repository<CredentialShareRequest>,
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
    req.status = decision;
    req.adminRemark = remark;
    req.decidedBy = decidedBy;
    req.decidedAt = new Date();
    return this.repo.save(req);
  }
}
