import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomersModule } from './customers/customers.module';
import { KycModule } from './kyc/kyc.module';
import { FabricModule } from './fabric/fabric.module';
import { PresentationApiModule } from './presentation-api/presentation-api.module';
import { UploadsModule } from './uploads/uploads.module';
import { KycCredential } from './database/entities/kyc-credential.entity';
import { LoanApplication } from './database/entities/loan-application.entity';
import { LedgerEvent } from './database/entities/ledger-event.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST') || 'localhost',
        port: parseInt(config.get<string>('DB_PORT') || '5432', 10),
        username: config.get<string>('DB_USER') || 'trustledger',
        password: config.get<string>('DB_PASS') || 'trustledger',
        database: config.get<string>('DB_NAME') || 'trustledger',
        entities: [KycCredential, LoanApplication, LedgerEvent],
        synchronize: true,
        logging: false,
      }),
    }),
    CustomersModule,
    FabricModule,
    KycModule,
    PresentationApiModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
