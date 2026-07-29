import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CredentialShareService } from './credential-share.service';

@Controller('api/v1/credential-share-requests')
export class CredentialShareController {
  constructor(private readonly service: CredentialShareService) {}

  @Post()
  create(@Body() body: any) { return this.service.create(body); }

  @Get()
  findAll(@Query('status') status?: string, @Query('email') email?: string) {
    if (email) return this.service.findByEmail(email);
    return this.service.findAll(status);
  }

  @Patch(':id/decide')
  decide(
    @Param('id') id: string,
    @Body() body: { decision: 'approved' | 'rejected'; remark?: string; decidedBy?: string },
  ) {
    return this.service.decide(Number(id), body.decision, body.remark || '', body.decidedBy || 'Admin');
  }
}
