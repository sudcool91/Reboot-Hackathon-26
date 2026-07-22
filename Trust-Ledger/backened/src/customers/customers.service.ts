import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { FabricService } from '../fabric/fabric.service';

type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface CustomerRecord extends CreateCustomerDto {
  id: string;
  kycRef: string;
  txHash: string;
  kycStatus: KycStatus;
  sharedWith: string[];
  createdAt: string;
  approvedAt?: string;
  approvalTxHash?: string;
  rejectionTxHash?: string;
  consentTxHash?: string;
  revokeTxHash?: string;
}

@Injectable()
export class CustomersService {
  private readonly customers: CustomerRecord[] = [];

  constructor(private readonly fabricService: FabricService) {}

  create(createCustomerDto: CreateCustomerDto) {
    const id = `CUST-${Date.now()}`;
    const initials = this.getInitials(createCustomerDto.name);

    const newCustomer: CustomerRecord = {
      id,
      ...createCustomerDto,
      kycRef: `KYC-${initials}-${Math.floor(10000 + Math.random() * 90000)}`,
      txHash: this.generateTxHash(),
      kycStatus: 'PENDING',
      sharedWith: [],
      createdAt: new Date().toISOString(),
    };

    this.customers.push(newCustomer);
    return newCustomer;
  }

  findAll() {
    return this.customers;
  }

  findOne(id: string) {
    const customer = this.customers.find((value) => value.id === id);
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    return customer;
  }

  async approve(id: string) {
    const customer = this.findOne(id);
    customer.kycStatus = 'VERIFIED';
    customer.approvedAt = new Date().toISOString();

    customer.approvalTxHash = await this.submitLedgerCommand(
      'ApproveKYC',
      {
        customerId: customer.id,
        credentialId: customer.kycRef,
      },
    );

    return {
      id: customer.id,
      kycStatus: customer.kycStatus,
      approvalTxHash: customer.approvalTxHash,
      approvedAt: customer.approvedAt,
    };
  }

  async reject(id: string) {
    const customer = this.findOne(id);
    customer.kycStatus = 'REJECTED';

    customer.rejectionTxHash = await this.submitLedgerCommand('RejectKYC', {
      customerId: customer.id,
      credentialId: customer.kycRef,
    });

    return {
      id: customer.id,
      kycStatus: customer.kycStatus,
      rejectionTxHash: customer.rejectionTxHash,
    };
  }

  async shareConsent(id: string, bank: string) {
    const customer = this.findOne(id);
    const bankName = this.toBankName(bank);

    if (!customer.sharedWith.includes(bankName)) {
      customer.sharedWith.push(bankName);
    }

    customer.consentTxHash = await this.submitLedgerCommand('GrantConsent', {
      customerId: customer.id,
      credentialId: customer.kycRef,
      bank: bankName,
    });

    return {
      id: customer.id,
      sharedWith: customer.sharedWith,
      consentTxHash: customer.consentTxHash,
    };
  }

  async revokeConsent(id: string, bank: string) {
    const customer = this.findOne(id);
    const bankName = this.toBankName(bank);

    customer.sharedWith = customer.sharedWith.filter((item) => item !== bankName);

    customer.revokeTxHash = await this.submitLedgerCommand('RevokeConsent', {
      customerId: customer.id,
      credentialId: customer.kycRef,
      bank: bankName,
    });

    return {
      id: customer.id,
      sharedWith: customer.sharedWith,
      revokeTxHash: customer.revokeTxHash,
    };
  }

  private getInitials(name: string) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private generateTxHash() {
    return `0x${randomBytes(32).toString('hex')}`;
  }

  private toBankName(bank: string) {
    const cleanValue = bank?.trim();
    if (!cleanValue) {
      throw new BadRequestException('bank is required');
    }

    return cleanValue;
  }

  private async submitLedgerCommand(functionName: string, payload: unknown) {
    // Local mode keeps customer flows independent while chaincode is being developed.
    if (process.env.CUSTOMER_LEDGER_MODE !== 'fabric') {
      return this.generateTxHash();
    }

    const result = await this.fabricService.submit(functionName, payload);
    if (result && typeof result === 'object' && 'txHash' in result) {
      const txHash = (result as { txHash?: unknown }).txHash;
      if (typeof txHash === 'string' && txHash.length > 0) {
        return txHash;
      }
    }

    return this.generateTxHash();
  }
}
