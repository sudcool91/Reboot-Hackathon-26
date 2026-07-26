import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainCustomer } from '../database/entities/blockchain-customer.entity';
import { SdkFabricGateway } from './gateways/sdk-fabric.gateway';

export interface CreateBlockchainCustomerDto {
  customerID: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  address?: string;
  nationalID?: string;
  nationality?: string;
  issuingBank?: string;
  documentHash?: string;
}

@Injectable()
export class BlockchainCustomerService {
  private readonly logger = new Logger(BlockchainCustomerService.name);

  constructor(
    @InjectRepository(BlockchainCustomer)
    private readonly repo: Repository<BlockchainCustomer>,
    private readonly sdkGateway: SdkFabricGateway,
  ) {}

  private getContractService() {
    return this.sdkGateway.getSDK().getContractService();
  }

  async createAndStore(dto: CreateBlockchainCustomerDto): Promise<{
    success: boolean;
    customer?: BlockchainCustomer;
    fabricTxId?: string;
    error?: string;
    stage?: string;
  }> {
    const { customerID, fullName, dateOfBirth, email, phone, address, nationalID, nationality, issuingBank, documentHash } = dto;

    if (!customerID?.trim()) throw new BadRequestException('customerID is required');
    if (!fullName?.trim())   throw new BadRequestException('fullName is required');
    if (!email?.trim())      throw new BadRequestException('email is required');

    const existing = await this.repo.findOne({ where: { customerID: customerID.trim() } });
    if (existing) throw new BadRequestException(`Customer ${customerID} already exists in the system`);

    this.logger.log(`Creating customer ${customerID} on Fabric...`);
    const contractService = this.getContractService();

    const fabricResult = await contractService.createCustomer({
      customerID:   customerID.trim(),
      fullName:     fullName.trim(),
      dateOfBirth:  dateOfBirth || '',
      email:        email.trim(),
      phone:        phone || '',
      address:      address || '',
      nationalID:   nationalID || nationality || 'PENDING',
      issuingBank:  issuingBank || 'LloydsBankingGroup',
      documentHash: documentHash || `HASH-${customerID.trim()}-${Date.now()}`,
    });

    if (!fabricResult.success) {
      this.logger.error(`Fabric creation failed for ${customerID}: ${fabricResult.message}`);
      return { success: false, error: fabricResult.message, stage: 'fabric' };
    }

    this.logger.log(`Customer ${customerID} committed to Fabric. TxID: ${fabricResult.txId}`);

    let fabricData: any = null;
    try {
      const queryResult = await contractService.readCustomer(customerID.trim());
      if (queryResult.success) fabricData = queryResult.data;
    } catch (readErr) {
      this.logger.warn(`Could not read back from Fabric (continuing): ${readErr.message}`);
    }

    const record = this.repo.create({
      customerID:      customerID.trim(),
      fullName:        fabricData?.fullName     || fullName.trim(),
      dateOfBirth:     fabricData?.dateOfBirth  || dateOfBirth || '',
      email:           fabricData?.email        || email.trim(),
      phone:           fabricData?.phone        || phone || '',
      address:         fabricData?.address      || address || '',
      nationalID:      fabricData?.nationalId   || nationalID || nationality || 'PENDING',
      issuingBank:     fabricData?.issuingBank  || issuingBank || 'LloydsBankingGroup',
      kycStatus:       fabricData?.kycStatus    || 'PENDING',
      consentGranted:  fabricData?.consentGranted ?? false,
      documentHash:    fabricData?.documentHash || documentHash || `HASH-${customerID}-${Date.now()}`,
      fabricTxId:      fabricResult.txId || '',
      fabricCreatedAt: fabricData?.createdAt   || new Date().toISOString(),
    });

    try {
      const saved = await this.repo.save(record);
      this.logger.log(`Customer ${customerID} saved to PostgreSQL`);
      return { success: true, customer: saved, fabricTxId: fabricResult.txId };
    } catch (dbErr) {
      this.logger.error(`DB save failed for ${customerID}: ${dbErr.message}`);
      return {
        success: false,
        error: `Customer created on Fabric (txId: ${fabricResult.txId}) but DB save failed: ${dbErr.message}`,
        stage: 'database',
        fabricTxId: fabricResult.txId,
      };
    }
  }

  async findAll(): Promise<BlockchainCustomer[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(customerID: string): Promise<BlockchainCustomer | null> {
    return this.repo.findOne({ where: { customerID } });
  }
}
