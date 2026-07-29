/**
 * Fabric SDK Module Exports
 * 
 * Central export point for all SDK components
 */

// Main SDK
export { FabricSDK } from './fabric-sdk';

// Configuration
export type { FabricNetworkConfig } from './config/fabric-sdk.config';
export {
  LLOYDS_FABRIC_CONFIG,
  HALIFAX_FABRIC_CONFIG,
  getFabricConfig,
} from './config/fabric-sdk.config';

// DTOs
export { KYCStatus, BankType } from './dto/fabric-sdk.dto';
export type {
  CustomerDTO,
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerHistoryDTO,
  KYCVerificationDTO,
  ConsentDTO,
  QueryResultDTO,
  TransactionResultDTO,
} from './dto/fabric-sdk.dto';

// Managers
export { FabricWalletManager } from './wallet/fabric-wallet.manager';
export { FabricConnectionManager } from './connection/fabric-connection.manager';
export { FabricGatewayManager } from './gateway/fabric-gateway.manager';

// Services
export { FabricContractService } from './contract/fabric-contract.service';
