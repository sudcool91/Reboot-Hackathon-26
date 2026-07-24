/**
 * Fabric Contract Service
 * 
 * Type-safe wrapper for Fabric chaincode interactions
 * Provides methods for all chaincode functions
 */

import { Logger } from '@nestjs/common';
import { Contract } from 'fabric-network';
import {
  CustomerDTO,
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerHistoryDTO,
  KYCVerificationDTO,
  ConsentDTO,
  QueryResultDTO,
  TransactionResultDTO,
} from '../dto/fabric-sdk.dto';

export class FabricContractService {
  private readonly logger = new Logger(FabricContractService.name);

  constructor(private readonly contract: Contract) {}

  // ============================================
  // Customer Management Methods
  // ============================================

  /**
   * Create a new customer on the blockchain
   */
  async createCustomer(data: CreateCustomerDTO): Promise<TransactionResultDTO> {
    try {
      const result = await this.contract.submitTransaction(
        'CreateCustomer',
        data.customerID,
        data.fullName,
        data.dateOfBirth,
        data.email,
        data.phone,
        data.address,
        data.nationalID,
        data.issuingBank,
        data.documentHash,
      );

      return {
        success: true,
        txId: result.toString(),
        message: `Customer ${data.customerID} created successfully`,
      };
    } catch (error) {
      this.logger.error(`Failed to create customer: ${error.message}`, error);
      return {
        success: false,
        txId: '',
        message: `Failed to create customer: ${error.message}`,
      };
    }
  }

  /**
   * Read a customer from the blockchain
   */
  async readCustomer(customerID: string): Promise<QueryResultDTO<CustomerDTO>> {
    try {
      const result = await this.contract.evaluateTransaction(
        'ReadCustomer',
        customerID,
      );

      const customer = JSON.parse(result.toString()) as CustomerDTO;

      return {
        success: true,
        data: customer,
      };
    } catch (error) {
      this.logger.error(`Failed to read customer: ${error.message}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update customer details on the blockchain
   */
  async updateCustomer(data: UpdateCustomerDTO): Promise<TransactionResultDTO> {
    try {
      const result = await this.contract.submitTransaction(
        'UpdateCustomer',
        data.customerID,
        JSON.stringify(data),
      );

      return {
        success: true,
        txId: result.toString(),
        message: `Customer ${data.customerID} updated successfully`,
      };
    } catch (error) {
      this.logger.error(`Failed to update customer: ${error.message}`, error);
      return {
        success: false,
        txId: '',
        message: `Failed to update customer: ${error.message}`,
      };
    }
  }

  /**
   * Delete a customer from the blockchain
   */
  async deleteCustomer(customerID: string): Promise<TransactionResultDTO> {
    try {
      const result = await this.contract.submitTransaction(
        'DeleteCustomer',
        customerID,
      );

      return {
        success: true,
        txId: result.toString(),
        message: `Customer ${customerID} deleted successfully`,
      };
    } catch (error) {
      this.logger.error(`Failed to delete customer: ${error.message}`, error);
      return {
        success: false,
        txId: '',
        message: `Failed to delete customer: ${error.message}`,
      };
    }
  }

  /**
   * Check if a customer exists
   */
  async customerExists(customerID: string): Promise<QueryResultDTO<boolean>> {
    try {
      const result = await this.contract.evaluateTransaction(
        'CustomerExists',
        customerID,
      );

      const exists = result.toString() === 'true';

      return {
        success: true,
        data: exists,
      };
    } catch (error) {
      this.logger.error(`Failed to check customer existence: ${error.message}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================
  // KYC Management Methods
  // ============================================

  /**
   * Issue KYC verification for a customer
   */
  async issueKYC(customerID: string): Promise<TransactionResultDTO> {
    try {
      const result = await this.contract.submitTransaction('IssueKYC', customerID);

      return {
        success: true,
        txId: result.toString(),
        message: `KYC issued for customer ${customerID}`,
      };
    } catch (error) {
      this.logger.error(`Failed to issue KYC: ${error.message}`, error);
      return {
        success: false,
        txId: '',
        message: `Failed to issue KYC: ${error.message}`,
      };
    }
  }

  /**
   * Verify KYC from another bank
   */
  async verifyKYC(data: KYCVerificationDTO): Promise<TransactionResultDTO> {
    try {
      const result = await this.contract.submitTransaction(
        'VerifyKYC',
        data.customerID,
        data.requestingBank,
      );

      return {
        success: true,
        txId: result.toString(),
        message: `KYC verified for customer ${data.customerID} by ${data.requestingBank}`,
      };
    } catch (error) {
      this.logger.error(`Failed to verify KYC: ${error.message}`, error);
      return {
        success: false,
        txId: '',
        message: `Failed to verify KYC: ${error.message}`,
      };
    }
  }

  /**
   * Grant consent for KYC sharing
   */
  async grantConsent(data: ConsentDTO): Promise<TransactionResultDTO> {
    try {
      const result = await this.contract.submitTransaction(
        'GrantConsent',
        data.customerID,
      );

      return {
        success: true,
        txId: result.toString(),
        message: `Consent granted for customer ${data.customerID}`,
      };
    } catch (error) {
      this.logger.error(`Failed to grant consent: ${error.message}`, error);
      return {
        success: false,
        txId: '',
        message: `Failed to grant consent: ${error.message}`,
      };
    }
  }

  /**
   * Revoke consent for KYC sharing
   */
  async revokeConsent(data: ConsentDTO): Promise<TransactionResultDTO> {
    try {
      const result = await this.contract.submitTransaction(
        'RevokeConsent',
        data.customerID,
      );

      return {
        success: true,
        txId: result.toString(),
        message: `Consent revoked for customer ${data.customerID}`,
      };
    } catch (error) {
      this.logger.error(`Failed to revoke consent: ${error.message}`, error);
      return {
        success: false,
        txId: '',
        message: `Failed to revoke consent: ${error.message}`,
      };
    }
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Get all customers from the blockchain
   */
  async getAllCustomers(): Promise<QueryResultDTO<CustomerDTO[]>> {
    try {
      const result = await this.contract.evaluateTransaction('GetAllCustomers');

      const customers = JSON.parse(result.toString()) as CustomerDTO[];

      return {
        success: true,
        data: customers,
      };
    } catch (error) {
      this.logger.error(`Failed to get all customers: ${error.message}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get customer history (all modifications)
   */
  async getCustomerHistory(
    customerID: string,
  ): Promise<QueryResultDTO<CustomerHistoryDTO[]>> {
    try {
      const result = await this.contract.evaluateTransaction(
        'GetCustomerHistory',
        customerID,
      );

      const history = JSON.parse(result.toString()) as CustomerHistoryDTO[];

      return {
        success: true,
        data: history,
      };
    } catch (error) {
      this.logger.error(`Failed to get customer history: ${error.message}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Initialize ledger with sample data
   */
  async initLedger(): Promise<TransactionResultDTO> {
    try {
      const result = await this.contract.submitTransaction('InitLedger');

      return {
        success: true,
        txId: result.toString(),
        message: 'Ledger initialized successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to init ledger: ${error.message}`, error);
      return {
        success: false,
        txId: '',
        message: `Failed to init ledger: ${error.message}`,
      };
    }
  }

  /**
   * Execute custom chaincode function
   */
  async executeFunction(
    functionName: string,
    ...args: string[]
  ): Promise<TransactionResultDTO> {
    try {
      const result = await this.contract.submitTransaction(functionName, ...args);

      return {
        success: true,
        txId: result.toString(),
        message: `Function ${functionName} executed successfully`,
        data: result.toString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to execute function ${functionName}: ${error.message}`,
        error,
      );
      return {
        success: false,
        txId: '',
        message: `Failed to execute function: ${error.message}`,
      };
    }
  }

  /**
   * Query custom chaincode function
   */
  async queryFunction(functionName: string, ...args: string[]): Promise<QueryResultDTO<any>> {
    try {
      const result = await this.contract.evaluateTransaction(functionName, ...args);

      return {
        success: true,
        data: result.toString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to query function ${functionName}: ${error.message}`,
        error,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
