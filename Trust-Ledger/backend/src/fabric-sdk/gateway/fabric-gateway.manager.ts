/**
 * Fabric Gateway Manager
 *
 * Uses @hyperledger/fabric-gateway (compatible with Fabric v3.x)
 */

import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Gateway, Network, hash, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '@nestjs/common';
import type { FabricNetworkConfig } from '../config/fabric-sdk.config';
import { FabricWalletManager } from '../wallet/fabric-wallet.manager';
import { FabricConnectionManager } from '../connection/fabric-connection.manager';

export class FabricGatewayManager {
  private readonly logger = new Logger(FabricGatewayManager.name);
  private gateway: Gateway | null = null;
  private network: Network | null = null;
  private contract: Contract | null = null;
  private grpcClient: grpc.Client | null = null;

  constructor(
    private readonly config: FabricNetworkConfig,
    // kept for interface compatibility — not used with the new SDK
    private readonly walletManager: FabricWalletManager,
    private readonly connectionManager: FabricConnectionManager,
  ) {}

  /** Resolve a path relative to the backend project root */
  private resolvePath(...parts: string[]): string {
    return path.resolve(process.cwd(), ...parts);
  }

  /** Build a gRPC client for peer0.org1 */
  private buildGrpcClient(): grpc.Client {
    const tlsCertPath = this.resolvePath('..', 'fabric-network', 'organizations',
      'peerOrganizations', 'org1.example.com', 'tlsca', 'tlsca.org1.example.com-cert.pem');
    const tlsCert = fs.readFileSync(tlsCertPath);
    const credentials = grpc.credentials.createSsl(tlsCert);
    return new grpc.Client(
      this.config.peerEndpoint,
      credentials,
      { 'grpc.ssl_target_name_override': this.config.peerHostAlias },
    );
  }

  /** Read the admin cert + private key from the MSP signcerts/keystore */
  private readAdminIdentity(): { cert: Buffer; key: crypto.KeyObject } {
    const mspBase = this.resolvePath('..', 'fabric-network', 'organizations',
      'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp');

    const certPath = path.join(mspBase, 'signcerts', 'cert.pem');
    const keystoreDir = path.join(mspBase, 'keystore');
    const keyFiles = fs.readdirSync(keystoreDir).filter(f => f.endsWith('_sk'));
    if (keyFiles.length === 0) throw new Error(`No private key found in ${keystoreDir}`);
    const keyPath = path.join(keystoreDir, keyFiles[0]);

    const cert = fs.readFileSync(certPath);
    const key = crypto.createPrivateKey(fs.readFileSync(keyPath));
    return { cert, key };
  }

  /**
   * Connect to Fabric network using @hyperledger/fabric-gateway (Fabric v3.x compatible)
   */
  async connect(): Promise<void> {
    try {
      this.grpcClient = this.buildGrpcClient();
      const { cert, key } = this.readAdminIdentity();

      this.gateway = connect({
        client: this.grpcClient,
        identity: { mspId: this.config.mspId, credentials: cert },
        signer: signers.newPrivateKeySigner(key),
        hash: hash.sha256,
      });

      this.network  = this.gateway.getNetwork(this.config.channelName);
      this.logger.log(`Connected to channel: ${this.config.channelName}`);

      this.contract = this.network.getContract(this.config.chaincodeName);
      this.logger.log(`Connected to chaincode: ${this.config.chaincodeName}`);

      this.logger.log(
        `Connected to Fabric gateway as ${this.config.userId} (${this.config.mspId}) [fabric-gateway v3]`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to connect to Fabric network: ${errorMessage}`, error);
      throw error;
    }
  }

  /**
   * Get gateway instance
   */
  getGateway(): Gateway {
    if (!this.gateway) throw new Error('Gateway not connected. Call connect() first.');
    return this.gateway;
  }

  /**
   * Get network instance
   */
  getNetwork(): Network {
    if (!this.network) throw new Error('Network not initialized. Call connect() first.');
    return this.network;
  }

  /**
   * Get contract instance
   */
  getContract(): Contract {
    if (!this.contract) throw new Error('Contract not initialized. Call connect() first.');
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
      this.gateway.close();
      this.gateway = null;
      this.network = null;
      this.contract = null;
    }
    if (this.grpcClient) {
      this.grpcClient.close();
      this.grpcClient = null;
    }
    this.logger.log('Disconnected from Fabric gateway');
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
