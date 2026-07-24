import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import type { FabricFunctionName, FabricGateway } from '../fabric.types';
import { FabricSDK, getFabricConfig } from '../../fabric-sdk';

@Injectable()
export class SdkFabricGateway implements FabricGateway, OnModuleInit {
  private readonly logger = new Logger(SdkFabricGateway.name);
  private sdk: FabricSDK;

  constructor() {
    // Initialize SDK with Lloyds config by default
    const config = getFabricConfig('lloyds');
    this.sdk = new FabricSDK(config);
  }

  async onModuleInit() {
    try {
      this.logger.log('Initializing Fabric SDK...');
      await this.sdk.initialize();
      this.logger.log('Fabric SDK initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Fabric SDK: ${error.message}`, error);
      // Don't throw - allow app to start but SDK won't be available
    }
  }

  async submit(functionName: FabricFunctionName, payload: unknown) {
    try {
      const contractService = this.sdk.getContractService();
      
      // Map function names to contract methods
      if (typeof payload === 'object' && payload !== null) {
        const args = Object.values(payload);
        const result = await contractService.executeFunction(functionName, ...args.map(String));
        return result;
      }
      
      throw new Error('Invalid payload format');
    } catch (error) {
      this.logger.error(`Submit transaction failed: ${error.message}`, error);
      throw error;
    }
  }

  async evaluate(functionName: FabricFunctionName, payload: unknown) {
    try {
      const contractService = this.sdk.getContractService();
      
      // Map function names to contract methods
      if (typeof payload === 'object' && payload !== null) {
        const args = Object.values(payload);
        const result = await contractService.queryFunction(functionName, ...args.map(String));
        return result;
      }
      
      throw new Error('Invalid payload format');
    } catch (error) {
      this.logger.error(`Evaluate transaction failed: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get SDK instance for direct access
   */
  getSDK(): FabricSDK {
    return this.sdk;
  }
}
