import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { FabricModule } from '../fabric/fabric.module';
import { KYC_OPERATION_TO_FUNCTION } from './kyc.types';
import { PresentationApiModule } from '../presentation-api/presentation-api.module';

@Module({
  imports: [FabricModule, PresentationApiModule],
  controllers: [KycController],
  providers: [
    KycService,
    {
      provide: KYC_OPERATION_TO_FUNCTION,
      useValue: {
        issue: 'IssueKYC',
        verify: 'VerifyKYC',
        getCredential: 'GetCredential',
        revoke: 'RevokeKYC',
        getHistory: 'GetHistory',
      },
    },
  ],
})
export class KycModule {}
