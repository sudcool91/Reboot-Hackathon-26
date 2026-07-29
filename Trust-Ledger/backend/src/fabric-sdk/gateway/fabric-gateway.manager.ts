/**
 * Fabric Gateway Manager
 * 
 * Manages gateway connections to Fabric network
 */

import { Gateway, Network, Contract, GatewayOptions } from 'fabric-network';
import { Logger } from '@nestjs/common';
import type { FabricNetworkConfig } from '../config/fabric-sdk.config';
import { FabricWalletManager } from '../wallet/fabric-wallet.manager';
import { FabricConnectionManager } from '../connection/fabric-connection.manager';

export class FabricGatewayManager {
  private readonly logger = new Logger(FabricGatewayManager.name);
  private gateway: Gateway | null = null;
  private network: Network | null = null;
  private contract: Contract | null = null;

  constructor(
    private readonly config: FabricNetworkConfig,
    private readonly walletManager: FabricWalletManager,
    private readonly connectionManager: FabricConnectionManager,
  ) {}

  /**
   * Connect to Fabric network
   */
  async connect(): Promise<void> {
    try {
      // Ensure wallet is initialized
      if (!(await this.walletManager.identityExists(this.config.userId))) {
        await this.walletManager.importAdminIdentity();
      }

      // Get connection profile
      const connectionProfile = this.connectionManager.getConnectionProfile();

      // Configure gateway options - sequence 2, OR policy, fixed wallet + grpcOptions
      const gatewayOptions: GatewayOptions = {
        wallet: this.walletManager.getWallet(),
        identity: this.config.userId,
        discovery: {
          enabled: true,   // Discovery needed for peer population; identity now valid
          asLocalhost: true,
        },
      };

      // Create gateway instance
      this.gateway = new Gateway();
      await this.gateway.connect(connectionProfile, gatewayOptions);

      this.logger.log(
        `Connected to Fabric gateway as ${this.config.userId} (${this.config.mspId})`,
      );

      // Get network and contract
      await this.initializeNetwork();
    } catch (error) {
      this.logger.error(`Failed to connect to Fabric network: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Initialize network and contract
   */
  private async initializeNetwork(): Promise<void> {
    if (!this.gateway) {
      throw new Error('Gateway not connected');
    }

    // Get network (channel)
    this.network = await this.gateway.getNetwork(this.config.channelName);
    this.logger.log(`Connected to channel: ${this.config.channelName}`);

    // Get contract (chaincode)
    this.contract = this.network.getContract(this.config.chaincodeName);
    this.logger.log(`Connected to chaincode: ${this.config.chaincodeName}`);
  }

  /**
   * Get gateway instance
   */
  getGateway(): Gateway {
    if (!this.gateway) {
      throw new Error('Gateway not connected. Call connect() first.');
    }
    return this.gateway;
  }

  /**
   * Get network instance
   */
  getNetwork(): Network {
    if (!this.network) {
      throw new Error('Network not initialized. Call connect() first.');
    }
    return this.network;
  }

  /**
   * Get contract instance
   */
  getContract(): Contract {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call connect() first.');
    }
    return this.contract;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return !!this.gateway && !!this.network && !!this.contract;
  }

  /**
   * Disconnect from Fabric network
   */
  async disconnect(): Promise<void> {
    if (this.gateway) {
      this.gateway.disconnect();
      this.gateway = null;
      this.network = null;
      this.contract = null;
      this.logger.log('Disconnected from Fabric gateway');
    }
  }

  /**
   * Reconnect to Fabric network
   */
  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }

  /**
   * Get current identity
   */
  getCurrentIdentity(): string {
    return this.config.userId;
  }

  /**
   * Get current MSP ID
   */
  getCurrentMSPId(): string {
    return this.config.mspId;
  }
}
