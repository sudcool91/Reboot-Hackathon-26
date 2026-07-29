/**
 * Fabric SDK Main Class
 * 
 * Orchestrates all SDK components and provides unified interface
 */

import { Logger } from '@nestjs/common';
import { FabricNetworkConfig } from './config/fabric-sdk.config';
import { FabricWalletManager } from './wallet/fabric-wallet.manager';
import { FabricConnectionManager } from './connection/fabric-connection.manager';
import { FabricGatewayManager } from './gateway/fabric-gateway.manager';
import { FabricContractService } from './contract/fabric-contract.service';

export class FabricSDK {
  private readonly logger = new Logger(FabricSDK.name);
  private walletManager: FabricWalletManager;
  private connectionManager: FabricConnectionManager;
  private gatewayManager: FabricGatewayManager;
  private contractService: FabricContractService | null = null;
  private initialized = false;

  constructor(private readonly config: FabricNetworkConfig) {
    this.walletManager = new FabricWalletManager(config);
    this.connectionManager = new FabricConnectionManager(config);
    this.gatewayManager = new FabricGatewayManager(
      config,
      this.walletManager,
      this.connectionManager,
    );
  }

  /**
   * Initialize the SDK (one-time setup)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('SDK already initialized');
      return;
    }

    try {
      this.logger.log('Initializing Fabric SDK...');

      // Initialize wallet
      await this.walletManager.initialize();

      // Load connection profile
      this.connectionManager.loadConnectionProfile();

      // Validate connection profile
      if (!this.connectionManager.validateConnectionProfile()) {
        throw new Error('Connection profile validation failed');
      }

      // Connect to network
      await this.gatewayManager.connect();

      // Initialize contract service
      const contract = this.gatewayManager.getContract();
      this.contractService = new FabricContractService(contract);

      this.initialized = true;
      this.logger.log('Fabric SDK initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize SDK: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get contract service for chaincode interactions
   */
  getContractService(): FabricContractService {
    if (!this.contractService) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
    return this.contractService;
  }

  /**
   * Get wallet manager
   */
  getWalletManager(): FabricWalletManager {
    return this.walletManager;
  }

  /**
   * Get gateway manager
   */
  getGatewayManager(): FabricGatewayManager {
    return this.gatewayManager;
  }

  /**
   * Get connection manager
   */
  getConnectionManager(): FabricConnectionManager {
    return this.connectionManager;
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Disconnect from network
   */
  async disconnect(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await this.gatewayManager.disconnect();
    this.contractService = null;
    this.initialized = false;
    this.logger.log('SDK disconnected');
  }

  /**
   * Reconnect to network
   */
  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.initialize();
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      channelName: this.config.channelName,
      chaincodeName: this.config.chaincodeName,
      mspId: this.config.mspId,
      userId: this.config.userId,
      connected: this.gatewayManager.isConnected(),
      initialized: this.initialized,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    details: Record<string, any>;
  }> {
    try {
      const details: Record<string, any> = {
        ...this.getNetworkInfo(),
      };

      // Try a simple query to check connectivity
      if (this.initialized && this.contractService) {
        try {
          await this.contractService.getAllCustomers();
          details.chaincodeAccessible = true;
        } catch (error) {
          details.chaincodeAccessible = false;
          details.chaincodeError = error.message;
        }
      }

      const healthy =
        this.initialized &&
        this.gatewayManager.isConnected() &&
        details.chaincodeAccessible;

      return {
        healthy,
        details,
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error.message,
        },
      };
    }
  }
}
