/**
 * Fabric Connection Profile Manager
 * 
 * Manages connection profiles for Fabric network
 */

import * as fs from 'fs';
import * as path from 'path';
import * as grpc from '@grpc/grpc-js';
import { Logger } from '@nestjs/common';
import type { FabricNetworkConfig } from '../config/fabric-sdk.config';

export interface ConnectionProfile {
  name: string;
  version: string;
  client: {
    organization: string;
    connection: {
      timeout: {
        peer: {
          endorser: string;
        };
        orderer: string;
      };
    };
  };
  channels: Record<string, any>;
  organizations: Record<string, any>;
  peers: Record<string, any>;
  certificateAuthorities?: Record<string, any>;
  [key: string]: any; // Index signature for fabric-network compatibility
}

export class FabricConnectionManager {
  private readonly logger = new Logger(FabricConnectionManager.name);
  private connectionProfile: ConnectionProfile | null = null;
  private tlsCredentials: grpc.ChannelCredentials | null = null;

  constructor(private readonly config: FabricNetworkConfig) {}

  /**
   * Load connection profile from file
   */
  loadConnectionProfile(): ConnectionProfile {
    try {
      const profilePath = path.resolve(process.cwd(), this.config.connectionProfilePath);

      if (!fs.existsSync(profilePath)) {
        throw new Error(`Connection profile not found at ${profilePath}`);
      }

      const profileData = fs.readFileSync(profilePath, 'utf8');
      this.connectionProfile = JSON.parse(profileData) as ConnectionProfile;

      this.logger.log(`Connection profile loaded from ${profilePath}`);
      return this.connectionProfile;
    } catch (error) {
      this.logger.error(
        `Failed to load connection profile: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get connection profile
   */
  getConnectionProfile(): ConnectionProfile {
    if (!this.connectionProfile) {
      return this.loadConnectionProfile();
    }
    return this.connectionProfile!;
  }

  /**
   * Load TLS credentials for peer connection
   */
  loadTLSCredentials(): grpc.ChannelCredentials {
    if (this.tlsCredentials) {
      return this.tlsCredentials;
    }

    try {
      const tlsCertPath = path.resolve(process.cwd(), this.config.tlsCertPath);

      if (!fs.existsSync(tlsCertPath)) {
        throw new Error(`TLS certificate not found at ${tlsCertPath}`);
      }

      const tlsCert = fs.readFileSync(tlsCertPath);
      this.tlsCredentials = grpc.credentials.createSsl(tlsCert);

      this.logger.log('TLS credentials loaded successfully');
      return this.tlsCredentials;
    } catch (error) {
      this.logger.error(`Failed to load TLS credentials: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get peer endpoint information
   */
  getPeerEndpoint(): { url: string; tlsCACerts: Buffer; hostnameOverride: string } {
    const tlsCertPath = path.resolve(process.cwd(), this.config.tlsCertPath);

    return {
      url: `grpcs://${this.config.peerEndpoint}`,
      tlsCACerts: fs.readFileSync(tlsCertPath),
      hostnameOverride: this.config.peerHostAlias,
    };
  }

  /**
   * Validate connection profile
   */
  validateConnectionProfile(): boolean {
    const profile = this.getConnectionProfile();

    if (!profile.channels || !profile.channels[this.config.channelName]) {
      this.logger.warn(
        `Channel ${this.config.channelName} not declared in connection profile; continuing and relying on gateway channel access.`,
      );
    }

    if (!profile.organizations || Object.keys(profile.organizations).length === 0) {
      this.logger.error(
        'No organizations found in connection profile',
      );
      return false;
    }

    const orgMatchesMsp = Object.values(profile.organizations).some(
      (org: any) => org?.mspid === this.config.mspId,
    );

    if (!orgMatchesMsp) {
      this.logger.warn(
        `No organization with mspid ${this.config.mspId} found in profile; continuing with configured identity.`,
      );
    }

    this.logger.log('Connection profile validation passed');
    return true;
  }
}
