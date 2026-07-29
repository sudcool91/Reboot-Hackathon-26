import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FabricController } from './fabric.controller';
import { FabricSdkController } from './fabric-sdk.controller';
import { FabricService } from './fabric.service';
import { FABRIC_GATEWAY } from './fabric.types';
import { InMemoryFabricGateway } from './gateways/in-memory-fabric.gateway';
import { SdkFabricGateway } from './gateways/sdk-fabric.gateway';
import { BlockchainCustomer } from '../database/entities/blockchain-customer.entity';
import { BlockchainCustomerService } from './blockchain-customer.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlockchainCustomer])],
  controllers: [FabricController, FabricSdkController],
  providers: [
    FabricService,
    InMemoryFabricGateway,
    SdkFabricGateway,
    BlockchainCustomerService,
    {
      provide: FABRIC_GATEWAY,
      useFactory: (
        inMemoryGateway: InMemoryFabricGateway,
        sdkGateway: SdkFabricGateway,
      ) => {
        const mode = process.env.FABRIC_GATEWAY_MODE ?? 'inmemory';
        return mode === 'sdk' ? sdkGateway : inMemoryGateway;
      },
      inject: [InMemoryFabricGateway, SdkFabricGateway],
    },
  ],
  exports: [FabricService, SdkFabricGateway],
})
export class FabricModule {}
