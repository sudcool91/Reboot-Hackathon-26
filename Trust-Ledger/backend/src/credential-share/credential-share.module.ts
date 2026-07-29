import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredentialShareRequest } from '../database/entities/credential-share-request.entity';
import { CredentialShareService } from './credential-share.service';
import { CredentialShareController } from './credential-share.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CredentialShareRequest])],
  controllers: [CredentialShareController],
  providers: [CredentialShareService],
  exports: [CredentialShareService],
})
export class CredentialShareModule {}
