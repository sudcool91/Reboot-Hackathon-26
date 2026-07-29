import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycRequest } from '../database/entities/kyc-request.entity';
import { KycCredential } from '../database/entities/kyc-credential.entity';
import { KycRequestsService } from './kyc-requests.service';
import { KycRequestsController } from './kyc-requests.controller';
import { FabricModule } from '../fabric/fabric.module';

@Module({
  imports: [TypeOrmModule.forFeature([KycRequest, KycCredential]), FabricModule],
  controllers: [KycRequestsController],
  providers: [KycRequestsService],
  exports: [KycRequestsService],
})
export class KycRequestsModule {}
