import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { FabricService } from '../fabric/fabric.service';
import { PresentationDataService } from '../presentation-api/presentation-data.service';
import { IssueKycDto } from './dto/issue-kyc.dto';
import { VerifyKycDto } from './dto/verify-kyc.dto';
import { RevokeKycDto } from './dto/revoke-kyc.dto';
import { KYC_OPERATION_TO_FUNCTION } from './kyc.types';
import type { KycOperationToFunction } from './kyc.types';

@Injectable()
export class KycService {
  constructor(
    private readonly fabricService: FabricService,
    private readonly dataService: PresentationDataService,
    @Inject(KYC_OPERATION_TO_FUNCTION)
    private readonly operationToFunction: KycOperationToFunction,
  ) {}

  async issue(payload: IssueKycDto) {
    // Generate deterministic credential ID from networkIdentityId
    const suffix = payload.networkIdentityId?.slice(-8).toUpperCase().replace(/[^A-Z0-9]/g, '') || Math.floor(Math.random() * 90000 + 10000).toString();
    const initials = payload.issuer?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'NN';
    const customerId = `CUST-${suffix}`;
    const metadata = payload as IssueKycDto & Partial<{
      customerName: string;
      email: string;
      phone: string;
      dateOfBirth: string;
      dob: string;
      address: string;
      nationalID: string;
    }>;

    const name = metadata.customerName
      || payload.networkIdentityId?.split('-').slice(1, -1).join(' ')
      || 'New Customer';
    const email = metadata.email || `customer-${suffix.toLowerCase()}@example.com`;
    const phone = metadata.phone || '+440000000000';
    const dateOfBirth = metadata.dateOfBirth || metadata.dob || '1990-01-01';
    const address = metadata.address || 'Address not provided';
    const nationalID = metadata.nationalID || `NID-${suffix}`;

    const createResult = await this.fabricService.submit('CreateCustomer', {
      customerID: customerId,
      fullName: name,
      dateOfBirth,
      email,
      phone,
      address,
      nationalID,
      issuingBank: payload.issuer || 'Lloyds',
      documentHash: payload.documentHash,
    });

    if (this.isFabricFailure(createResult) && !this.isAlreadyExistsFailure(createResult)) {
      throw new BadRequestException(`Failed to create customer on Fabric: ${this.getFabricError(createResult)}`);
    }

    const issueResult = await this.fabricService.submit(
      this.operationToFunction.issue,
      { customerID: customerId },
    );

    if (this.isFabricFailure(issueResult)) {
      throw new BadRequestException(`Failed to issue KYC on Fabric: ${this.getFabricError(issueResult)}`);
    }

    const fabricTxHash = this.getFabricTxHash(issueResult);

    const credentialId = `KYC-${initials}-${suffix}`;
    const txHash = fabricTxHash || `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    const expiresDate = new Date(); expiresDate.setFullYear(expiresDate.getFullYear() + 1);
    const expiresOn = expiresDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    await this.dataService.saveCredential({
      credentialId,
      customerId,
      avatar: initials,
      customerName: name,
      issuer: payload.issuer || 'Lloyds',
      expiresOn,
      status: 'Active',
      sharedWith: ['Lloyds'],
      txHash,
      did: `did:lloyds:0x${suffix.toLowerCase()}`,
      email,
      phone,
    } as any);

    // Write IssueKYC event to ledger_events
    await this.dataService.pushLedgerEvent(
      credentialId, 'IssueKYC',
      `Credential issued via branch onboarding. Document hash: ${payload.documentHash?.slice(0, 20)}...`,
      payload.issuer || 'Lloyds Branch Validator',
    );

    return {
      customerId,
      credentialId,
      txHash,
      status: 'Active',
      message: 'KYC credential issued and saved to registry',
    };
  }

  verify(payload: VerifyKycDto) {
    return this.fabricService.evaluate(this.operationToFunction.verify, payload);
  }

  getCredential(credentialId: string) {
    return this.fabricService.evaluate(this.operationToFunction.getCredential, { credentialId });
  }

  async revoke(payload: RevokeKycDto) {
    const credential = await this.dataService.getCredential(payload.credentialId);
    if (!credential) {
      throw new BadRequestException(`Credential ${payload.credentialId} not found`);
    }
    if (!credential.customerId) {
      throw new BadRequestException(`Credential ${payload.credentialId} is missing customerId mapping`);
    }

    const readCustomerResult = await this.fabricService.evaluate('ReadCustomer', {
      customerID: credential.customerId,
    });

    if (this.isFabricFailure(readCustomerResult)) {
      throw new BadRequestException(`Failed to read customer on Fabric: ${this.getFabricError(readCustomerResult)}`);
    }

    const customer = this.getFabricCustomer(readCustomerResult);
    const fabricResult = await this.fabricService.submit('UpdateCustomer', {
      customerID: credential.customerId,
      fullName: customer.fullName,
      dateOfBirth: customer.dateOfBirth,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      nationalID: customer.nationalId,
      issuingBank: customer.issuingBank,
      kycStatus: 'REVOKED',
      documentHash: customer.documentHash,
    });

    if (this.isFabricFailure(fabricResult)) {
      throw new BadRequestException(`Failed to revoke on Fabric: ${this.getFabricError(fabricResult)}`);
    }

    const verifyCustomerResult = await this.fabricService.evaluate('ReadCustomer', {
      customerID: credential.customerId,
    });

    if (this.isFabricFailure(verifyCustomerResult)) {
      throw new BadRequestException(`Failed to verify revoke on Fabric: ${this.getFabricError(verifyCustomerResult)}`);
    }

    const verifiedCustomer = this.getFabricCustomer(verifyCustomerResult);
    if (verifiedCustomer.kycStatus !== 'REVOKED') {
      throw new BadRequestException('Fabric customer status did not transition to REVOKED');
    }

    await this.dataService.updateCredential(payload.credentialId, { status: 'Revoked' });
    await this.dataService.pushLedgerEvent(payload.credentialId, 'ConsentRevoked', 'Revoked by admin', 'Admin');
    return { credentialId: payload.credentialId, status: 'Revoked' };
  }

  getHistory(credentialId: string) {
    return this.dataService.getEvents(credentialId);
  }

  private isFabricFailure(result: unknown): boolean {
    if (!result || typeof result !== 'object') {
      return false;
    }

    return 'success' in result && (result as { success?: boolean }).success === false;
  }

  private isAlreadyExistsFailure(result: unknown): boolean {
    const message = this.getFabricError(result).toLowerCase();
    return message.includes('already exists');
  }

  private getFabricError(result: unknown): string {
    if (!result || typeof result !== 'object') {
      return '';
    }

    const message = (result as { message?: string }).message;
    return typeof message === 'string' ? message : '';
  }

  private getFabricTxHash(result: unknown): string {
    if (!result || typeof result !== 'object') {
      return '';
    }

    const txId = (result as { txId?: string }).txId;
    return typeof txId === 'string' ? txId : '';
  }

  private getFabricCustomer(result: unknown): {
    fullName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    address: string;
    nationalId: string;
    issuingBank: string;
    kycStatus: string;
    documentHash: string;
  } {
    if (!result || typeof result !== 'object') {
      throw new BadRequestException('Invalid customer response from Fabric');
    }

    const rawData = (result as { data?: unknown }).data;
    let parsed: Record<string, unknown> | null = null;

    if (typeof rawData === 'string') {
      try {
        const value = JSON.parse(rawData);
        if (value && typeof value === 'object') {
          parsed = value as Record<string, unknown>;
        }
      } catch {
        throw new BadRequestException('Unable to parse customer payload from Fabric');
      }
    } else if (rawData && typeof rawData === 'object') {
      parsed = rawData as Record<string, unknown>;
    }

    if (!parsed) {
      throw new BadRequestException('Invalid customer response from Fabric');
    }

    return {
      fullName: String(parsed.fullName ?? ''),
      dateOfBirth: String(parsed.dateOfBirth ?? ''),
      email: String(parsed.email ?? ''),
      phone: String(parsed.phone ?? ''),
      address: String(parsed.address ?? ''),
      nationalId: String(parsed.nationalId ?? ''),
      issuingBank: String(parsed.issuingBank ?? ''),
      kycStatus: String(parsed.kycStatus ?? ''),
      documentHash: String(parsed.documentHash ?? ''),
    };
  }

}
