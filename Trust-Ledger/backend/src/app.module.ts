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
import { AuthModule } from './auth/auth.module';
import { KycRequestsModule } from './kyc-requests/kyc-requests.module';
import { CredentialShareModule } from './credential-share/credential-share.module';
import { KycCredential } from './database/entities/kyc-credential.entity';
import { LoanApplication } from './database/entities/loan-application.entity';
import { LedgerEvent } from './database/entities/ledger-event.entity';
import { User } from './database/entities/user.entity';
import { KycRequest } from './database/entities/kyc-request.entity';
import { CredentialShareRequest } from './database/entities/credential-share-request.entity';
import { BlockchainCustomer } from './database/entities/blockchain-customer.entity';

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
        entities: [KycCredential, LoanApplication, LedgerEvent, User, KycRequest, CredentialShareRequest, BlockchainCustomer],
        synchronize: true,
        logging: false,
      }),
    }),
    CustomersModule,
    FabricModule,
    KycModule,
    PresentationApiModule,
    UploadsModule,
    AuthModule,
    KycRequestsModule,
    CredentialShareModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
