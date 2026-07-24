import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { KycRequestsService } from './kyc-requests.service';

@Controller('api/v1/kyc-requests')
export class KycRequestsController {
  constructor(private readonly service: KycRequestsService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('email') email?: string) {
    if (email) return this.service.findByEmail(email);
    return this.service.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Patch(':id/decide')
  decide(
    @Param('id') id: string,
    @Body() body: { decision: 'approved' | 'rejected'; remark?: string; decidedBy?: string },
  ) {
    return this.service.decide(
      Number(id),
      body.decision,
      body.remark || '',
      body.decidedBy || 'Admin',
    );
  }
}
