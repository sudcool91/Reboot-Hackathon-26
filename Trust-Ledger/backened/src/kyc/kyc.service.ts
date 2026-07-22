import { Inject, Injectable } from '@nestjs/common';
import { FabricService } from '../fabric/fabric.service';
import { IssueKycDto } from './dto/issue-kyc.dto';
import { VerifyKycDto } from './dto/verify-kyc.dto';
import { RevokeKycDto } from './dto/revoke-kyc.dto';
import { KYC_OPERATION_TO_FUNCTION } from './kyc.types';
import type { KycOperationToFunction } from './kyc.types';

@Injectable()
export class KycService {
  constructor(
    private readonly fabricService: FabricService,
    @Inject(KYC_OPERATION_TO_FUNCTION)
    private readonly operationToFunction: KycOperationToFunction,
  ) {}

  issue(payload: IssueKycDto) {
    return this.fabricService.submit(this.operationToFunction.issue, payload);
  }

  verify(payload: VerifyKycDto) {
    return this.fabricService.evaluate(this.operationToFunction.verify, payload);
  }

  getCredential(credentialId: string) {
    return this.fabricService.evaluate(
      this.operationToFunction.getCredential,
      {
        credentialId,
      },
    );
  }

  revoke(payload: RevokeKycDto) {
    return this.fabricService.submit(this.operationToFunction.revoke, payload);
  }

  getHistory(credentialId: string) {
    return this.fabricService.evaluate(this.operationToFunction.getHistory, {
      credentialId,
    });
  }
}
