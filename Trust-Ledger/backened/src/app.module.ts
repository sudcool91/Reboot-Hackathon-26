import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomersModule } from './customers/customers.module';
import { KycModule } from './kyc/kyc.module';
import { FabricModule } from './fabric/fabric.module';
import { PresentationApiModule } from './presentation-api/presentation-api.module';

@Module({
  imports: [CustomersModule, FabricModule, KycModule, PresentationApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
