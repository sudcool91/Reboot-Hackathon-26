import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycRequest } from '../database/entities/kyc-request.entity';
import { KycRequestsService } from './kyc-requests.service';
import { KycRequestsController } from './kyc-requests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([KycRequest])],
  controllers: [KycRequestsController],
  providers: [KycRequestsService],
  exports: [KycRequestsService],
})
export class KycRequestsModule {}
