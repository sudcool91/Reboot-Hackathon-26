import { Module } from '@nestjs/common';
import { FabricController } from './fabric.controller';
import { FabricService } from './fabric.service';
import { FABRIC_GATEWAY } from './fabric.types';
import { InMemoryFabricGateway } from './gateways/in-memory-fabric.gateway';
import { SdkFabricGateway } from './gateways/sdk-fabric.gateway';

@Module({
  controllers: [FabricController],
  providers: [
    FabricService,
    InMemoryFabricGateway,
    SdkFabricGateway,
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
  exports: [FabricService],
})
export class FabricModule {}
