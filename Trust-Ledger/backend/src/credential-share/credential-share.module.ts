import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredentialShareRequest } from '../database/entities/credential-share-request.entity';
import { KycCredential } from '../database/entities/kyc-credential.entity';
import { KycRequest } from '../database/entities/kyc-request.entity';
import { CredentialShareService } from './credential-share.service';
import { CredentialShareController } from './credential-share.controller';
import { FabricModule } from '../fabric/fabric.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CredentialShareRequest, KycCredential, KycRequest]),
    FabricModule,
  ],
  controllers: [CredentialShareController],
  providers: [CredentialShareService],
  exports: [CredentialShareService],
})
export class CredentialShareModule {}
