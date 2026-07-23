import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { KycService } from './kyc.service';
import { IssueKycDto } from './dto/issue-kyc.dto';
import { VerifyKycDto } from './dto/verify-kyc.dto';
import { RevokeKycDto } from './dto/revoke-kyc.dto';

@Controller('api/v1/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('issue')
  issue(@Body() body: IssueKycDto) {
    return this.kycService.issue(body);
  }

  @Post('verify')
  verify(@Body() body: VerifyKycDto) {
    return this.kycService.verify(body);
  }

  @Get('history/:credentialId')
  getHistory(@Param('credentialId') credentialId: string) {
    return this.kycService.getHistory(credentialId);
  }

  @Get(':credentialId')
  getCredential(@Param('credentialId') credentialId: string) {
    return this.kycService.getCredential(credentialId);
  }

  @Post('revoke')
  revoke(@Body() body: RevokeKycDto) {
    return this.kycService.revoke(body);
  }
}
