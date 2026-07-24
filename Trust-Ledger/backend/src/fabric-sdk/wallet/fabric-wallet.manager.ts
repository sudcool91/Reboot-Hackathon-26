/**
 * Fabric Wallet Manager
 * 
 * Manages user identities and credentials for Fabric network access
 */

import * as fs from 'fs';
import * as path from 'path';
import { Wallets, Wallet, Identity, X509Identity } from 'fabric-network';
import { Logger } from '@nestjs/common';
import type { FabricNetworkConfig } from '../config/fabric-sdk.config';

export class FabricWalletManager {
  private readonly logger = new Logger(FabricWalletManager.name);
  private wallet: Wallet | null = null;

  constructor(private readonly config: FabricNetworkConfig) {}

  /**
   * Initialize wallet
   */
  async initialize(): Promise<void> {
    try {
      this.wallet = await Wallets.newFileSystemWallet(this.config.walletPath);
      this.logger.log(
        `Wallet initialized at ${this.config.walletPath}`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize wallet', error);
      throw error;
    }
  }

  /**
   * Get wallet instance
   */
  getWallet(): Wallet {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Call initialize() first.');
    }
    return this.wallet;
  }

  /**
   * Check if identity exists in wallet
   */
  async identityExists(userId: string): Promise<boolean> {
    const wallet = this.getWallet();
    const identity = await wallet.get(userId);
    return !!identity;
  }

  /**
   * Get identity from wallet
   */
  async getIdentity(userId: string): Promise<Identity | undefined> {
    const wallet = this.getWallet();
    return await wallet.get(userId);
  }

  /**
   * Import admin identity from certificate and private key
   */
  async importAdminIdentity(): Promise<void> {
    const wallet = this.getWallet();
    const { userId, mspId } = this.config;

    // Check if identity already exists
    const exists = await this.identityExists(userId);
    if (exists) {
      this.logger.log(`Identity ${userId} already exists in wallet`);
      return;
    }

    try {
      const orgDomain = this.config.connectionProfilePath.includes('org2.example.com')
        ? 'org2.example.com'
        : 'org1.example.com';

      const workspaceRoot = path.resolve(process.cwd(), '..');

      // Construct paths to cert and key
      const credPath = path.join(
        workspaceRoot,
        'fabric-network',
        'organizations',
        'peerOrganizations',
        orgDomain,
        'users',
        `Admin@${orgDomain}`,
        'msp',
      );

      const certPath = path.join(credPath, 'signcerts', 'cert.pem');
      const keyPath = path.join(
        credPath,
        'keystore',
        fs.readdirSync(path.join(credPath, 'keystore'))[0],
      );

      // Read certificate and private key
      const certificate = fs.readFileSync(certPath).toString();
      const privateKey = fs.readFileSync(keyPath).toString();

      // Create X.509 identity
      const identity: X509Identity = {
        credentials: {
          certificate,
          privateKey,
        },
        mspId,
        type: 'X.509',
      };

      // Import into wallet
      await wallet.put(userId, identity);
      this.logger.log(`Admin identity ${userId} imported successfully`);
    } catch (error) {
      this.logger.error(`Failed to import admin identity: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Import user identity (for future user enrollment)
   */
  async importUserIdentity(
    userId: string,
    certificate: string,
    privateKey: string,
  ): Promise<void> {
    const wallet = this.getWallet();
    const { mspId } = this.config;

    const identity: X509Identity = {
      credentials: {
        certificate,
        privateKey,
      },
      mspId,
      type: 'X.509',
    };

    await wallet.put(userId, identity);
    this.logger.log(`User identity ${userId} imported successfully`);
  }

  /**
   * Remove identity from wallet
   */
  async removeIdentity(userId: string): Promise<void> {
    const wallet = this.getWallet();
    await wallet.remove(userId);
    this.logger.log(`Identity ${userId} removed from wallet`);
  }

  /**
   * List all identities in wallet
   */
  async listIdentities(): Promise<string[]> {
    const wallet = this.getWallet();
    const identities = await wallet.list();
    return identities;
  }
}
