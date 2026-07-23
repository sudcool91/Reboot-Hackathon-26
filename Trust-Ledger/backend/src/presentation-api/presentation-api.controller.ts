import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PresentationApiService } from './presentation-api.service';

interface ConsentBody {
  bank: string;
  action: 'share' | 'revoke';
}

interface DecisionBody {
  decision: 'grant' | 'reject';
  remark?: string;
  actor?: string;
}

@Controller('api/v1')
export class PresentationApiController {
  constructor(private readonly presentationApiService: PresentationApiService) {}

  @Get('dashboard/summary')
  getDashboardSummary() {
    return this.presentationApiService.getDashboardSummary();
  }

  @Get('dashboard/activity')
  getDashboardActivity() {
    return this.presentationApiService.getDashboardActivity();
  }

  @Get('dashboard/network')
  getNetworkTopology() {
    return this.presentationApiService.getNetworkTopology();
  }

  @Get('kyc-registry')
  getKycRegistry(@Query('status') status?: string) {
    return this.presentationApiService.getKycRegistry(status);
  }

  @Post('kyc-registry/:credentialId/consent')
  updateConsent(
    @Param('credentialId') credentialId: string,
    @Body() body: ConsentBody,
  ) {
    return this.presentationApiService.updateConsent(credentialId, body);
  }

  @Get('loan-applications')
  getLoanApplications() {
    return this.presentationApiService.getLoanApplications();
  }

  @Post('loan-applications')
  createLoanApplication(@Body() body: any) {
    return this.presentationApiService.createLoanApplication(body);
  }

  @Get('loan-applications/:applicationId/decision')
  getLoanDecision(@Param('applicationId') applicationId: string) {
    return this.presentationApiService.getLoanDecision(applicationId);
  }

  @Post('loan-applications/:applicationId/decision')
  decideLoan(
    @Param('applicationId') applicationId: string,
    @Body() body: DecisionBody,
  ) {
    return this.presentationApiService.decideLoan(applicationId, body);
  }

  @Get('ledger-explorer/:credentialId')
  getLedgerExplorer(@Param('credentialId') credentialId: string) {
    return this.presentationApiService.getLedgerExplorer(credentialId);
  }

  @Get('admin-control-center')
  getAdminControlCenter() {
    return this.presentationApiService.getAdminControlCenter();
  }
}
