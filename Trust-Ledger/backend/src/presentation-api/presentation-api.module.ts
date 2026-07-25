import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PresentationApiController } from './presentation-api.controller';
import { PresentationApiService } from './presentation-api.service';
import { PresentationDataService } from './presentation-data.service';
import { KycCredential } from '../database/entities/kyc-credential.entity';
import { LoanApplication } from '../database/entities/loan-application.entity';
import { LedgerEvent } from '../database/entities/ledger-event.entity';
import { FabricModule } from '../fabric/fabric.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KycCredential, LoanApplication, LedgerEvent]),
    FabricModule,
  ],
  controllers: [PresentationApiController],
  providers: [PresentationApiService, PresentationDataService],
  exports: [PresentationDataService],
})
export class PresentationApiModule {}
