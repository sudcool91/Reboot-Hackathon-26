import { Inject, Injectable, Logger } from '@nestjs/common';
import { FabricService } from '../fabric/fabric.service';
import { SdkFabricGateway } from '../fabric/gateways/sdk-fabric.gateway';
import { PresentationDataService } from '../presentation-api/presentation-data.service';
import { IssueKycDto } from './dto/issue-kyc.dto';
import { VerifyKycDto } from './dto/verify-kyc.dto';
import { RevokeKycDto } from './dto/revoke-kyc.dto';
import { KYC_OPERATION_TO_FUNCTION } from './kyc.types';
import type { KycOperationToFunction } from './kyc.types';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly fabricService: FabricService,
    private readonly sdkGateway: SdkFabricGateway,
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

    // Try Fabric first: create customer on ledger, then issue KYC.
    let fabricTxHash = '';
    try {
      const contractService = this.sdkGateway.getSDK().getContractService();

      const createResult = await contractService.createCustomer({
        customerID: customerId,
        fullName: name,
        dateOfBirth,
        email,
        phone,
        address,
        nationalID,
        issuingBank: payload.issuer || 'Lloyds',
        documentHash: payload.documentHash || `HASH-${customerId}`,
      });

      if (!createResult.success && !createResult.message?.toLowerCase().includes('already exists')) {
        throw new Error(createResult.message);
      }

      const issueResult = await contractService.issueKYC(customerId);

      if (!issueResult.success) {
        throw new Error(issueResult.message);
      }

      fabricTxHash = issueResult.txId || '';
      this.logger.log(`Fabric IssueKYC success for ${customerId}, txId: ${fabricTxHash}`);
    } catch (err) {
      this.logger.error(`Fabric write failed in KycService.issue for ${customerId}: ${(err as Error).message}`, (err as Error).stack);
      // Keep UX resilient — credential still issued in DB, but txHash will be empty.
    }

    const credentialId = `KYC-${initials}-${suffix}`;
    // Use real Fabric txHash if available; empty string otherwise — never generate a fake hash.
    const txHash = fabricTxHash || '';
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
      txHash: txHash || null,
      fabricSuccess: !!fabricTxHash,
      status: 'Active',
      message: fabricTxHash
        ? 'KYC credential issued and committed to Fabric ledger'
        : 'KYC credential issued to registry (Fabric write failed — check backend logs)',
    };
  }

  verify(payload: VerifyKycDto) {
    return this.fabricService.evaluate(this.operationToFunction.verify, payload);
  }

  getCredential(credentialId: string) {
    return this.fabricService.evaluate(this.operationToFunction.getCredential, { credentialId });
  }

  async revoke(payload: RevokeKycDto) {
    try {
      await this.fabricService.submit(this.operationToFunction.revoke, payload);
    } catch (err) {
      this.logger.error(`Fabric revoke failed for ${payload.credentialId}: ${(err as Error).message}`);
    }
    await this.dataService.updateCredential(payload.credentialId, { status: 'Revoked' });
    await this.dataService.pushLedgerEvent(payload.credentialId, 'ConsentRevoked', 'Revoked by admin', 'Admin');
    return { credentialId: payload.credentialId, status: 'Revoked' };
  }

  getHistory(credentialId: string) {
    return this.dataService.getEvents(credentialId);
  }
}
