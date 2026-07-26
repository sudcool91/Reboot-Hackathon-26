/**
 * Fabric SDK Controller
 * 
 * REST API endpoints for Fabric network interactions using the SDK
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SdkFabricGateway } from './gateways/sdk-fabric.gateway';
import { BlockchainCustomerService } from './blockchain-customer.service';
import type { CreateBlockchainCustomerDto } from './blockchain-customer.service';
import type {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  KYCVerificationDTO,
  ConsentDTO,
} from '../fabric-sdk';

@Controller('fabric-sdk')
export class FabricSdkController {
  private readonly logger = new Logger(FabricSdkController.name);

  constructor(
    private readonly sdkGateway: SdkFabricGateway,
    private readonly blockchainCustomerService: BlockchainCustomerService,
  ) {}

  // ============================================
  // Health & Info
  // ============================================

  @Get('health')
  async healthCheck() {
    try {
      const sdk = this.sdkGateway.getSDK();
      return await sdk.healthCheck();
    } catch (error) {
      return {
        healthy: false,
        details: { error: error.message },
      };
    }
  }

  @Get('info')
  async getNetworkInfo() {
    try {
      const sdk = this.sdkGateway.getSDK();
      return sdk.getNetworkInfo();
    } catch (error) {
      return { error: error.message };
    }
  }

  // ============================================
  // Customer Operations
  // ============================================

  @Post('customers')
  @HttpCode(HttpStatus.CREATED)
  async createCustomer(@Body() createCustomerDto: CreateCustomerDTO) {
    try {
      const sdk = this.sdkGateway.getSDK();
      const contractService = sdk.getContractService();
      return await contractService.createCustomer(createCustomerDto);
    } catch (error) {
      this.logger.error(`Create customer failed: ${error.message}`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('customers')
  async getAllCustomers() {
    try {
      const sdk = this.sdkGateway.getSDK();
      const contractService = sdk.getContractService();
      return await contractService.getAllCustomers();
    } catch (error) {
      this.logger.error(`Get all customers failed: ${error.message}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('customers/:customerID')
  async getCustomer(@Param('customerID') customerID: string) {
    try {
      const sdk = this.sdkGateway.getSDK();
      const contractService = sdk.getContractService();
      return await contractService.readCustomer(customerID);
    } catch (error) {
      this.logger.error(`Get customer failed: ${error.message}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put('customers/:customerID')
  async updateCustomer(
    @Param('customerID') customerID: string,
    @Body() updateCustomerDto: Omit<UpdateCustomerDTO, 'customerID'>,
  ) {
    try {
      const sdk = this.sdkGateway.getSDK();
      const contractService = sdk.getContractService();
      return await contractService.updateCustomer({
        customerID,
        ...updateCustomerDto,
      });
    } catch (error) {
      this.logger.error(`Update customer failed: ${error.message}`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Delete('customers/:customerID')
  async deleteCustomer(@Param('customerID') customerID: string) {
    try {
      const sdk = this.sdkGateway.getSDK();
      const contractService = sdk.getContractService();
      return await contractService.deleteCustomer(customerID);
    } catch (error) {
      this.logger.error(`Delete customer failed: ${error.message}`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('customers/:customerID/exists')
  async customerExists(@Param('customerID') customerID: string) {
    try {
      const sdk = this.sdkGateway.getSDK();
      const contractService = sdk.getContractService();
      return await contractService.customerExists(customerID);
    } catch (error) {
      this.logger.error(`Check customer exists failed: ${error.message}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('customers/:customerID/history')
  async getCustomerHistory(@Param('customerID') customerID: string) {
    try {
      const sdk = this.sdkGateway.getSDK();
      const contractService = sdk.getContractService();
      return await contractService.getCustomerHistory(customerID);
    } catch (error) {
      this.logger.error(`Get customer history failed: ${error.message}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================
  // KYC Operations
  // ============================================

  @Post('kyc/:customerID/issue')
  @HttpCode(HttpStatus.OK)
  async issueKYC(@Param('customerID') customerID: string) {
    try {
      const sdk = this.sdkGateway.getSDK();
      const contractService = sdk.getContractService();
      return await contractService.issueKYC(customerID);
    } catch (error) {
      this.logger.error(`Issue KYC failed: ${error.message}`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post('kyc/verify')
  @HttpCode(HttpStatus.OK)
  async verifyKYC(@Body() verifyKYCDto: KYCVerificationDTO) {
    try {
      const sdk = this.sdkGateway.getSDK();
      const contractService = sdk.getContractService();
      return await contractService.verifyKYC(verifyKYCDto);
    } catch (error) {
      this.logger.error(`Verify KYC failed: ${error.message}`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ============================================
  // Consent Operations
  // ============================================

  @Post('consent/grant')
  @HttpCode(HttpStatus.OK)
  async grantConsent(@Body() consentDto: ConsentDTO) {
    try {
      const sdk = this.sdkGateway.getSDK();
      const contractService = sdk.getContractService();
      return await contractService.grantConsent(consentDto);
    } catch (error) {
      this.logger.error(`Grant consent failed: ${error.message}`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post('consent/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeConsent(@Body() consentDto: ConsentDTO) {
    try {
      const sdk = this.sdkGateway.getSDK();
      const contractService = sdk.getContractService();
      return await contractService.revokeConsent(consentDto);
    } catch (error) {
      this.logger.error(`Revoke consent failed: ${error.message}`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ============================================
  // Utility Operations
  // ============================================

  @Post('init-ledger')
  @HttpCode(HttpStatus.OK)
  async initLedger() {
    try {
      const sdk = this.sdkGateway.getSDK();
      const contractService = sdk.getContractService();
      return await contractService.initLedger();
    } catch (error) {
      this.logger.error(`Init ledger failed: ${error.message}`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ============================================
  // Admin: Blockchain Customer Management (Fabric → DB)
  // ============================================

  @Post('admin/customers')
  @HttpCode(HttpStatus.CREATED)
  async adminCreateCustomer(@Body() dto: CreateBlockchainCustomerDto) {
    try {
      const result = await this.blockchainCustomerService.createAndStore(dto);
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          stage: result.stage,
          fabricTxId: result.fabricTxId,
        };
      }
      return {
        success: true,
        customer: result.customer,
        fabricTxId: result.fabricTxId,
        message: `Customer ${dto.customerID} created on Fabric and saved to database`,
      };
    } catch (error) {
      this.logger.error(`Admin create customer failed: ${error.message}`, error);
      return {
        success: false,
        error: error.message,
        stage: 'validation',
      };
    }
  }

  @Get('admin/customers')
  async adminGetAllCustomers() {
    try {
      const customers = await this.blockchainCustomerService.findAll();
      return { success: true, data: customers, count: customers.length };
    } catch (error) {
      this.logger.error(`Admin get customers failed: ${error.message}`, error);
      return { success: false, error: error.message, data: [] };
    }
  }
}
