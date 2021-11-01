import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoinRatesModule } from './coin-rates/coin-rates.module';
import { BlockcypherModule } from './blockcypher/blockcypher.module';
import { MongooseModule } from '@nestjs/mongoose';
import { EntitiesModule } from './entities/enitities.module';
import { DatabaseModule } from './database/database.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { InfuraModule } from './infura/infura.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './admin/admin.module';
import { AddressBookModule } from './address-book/address-book.module';
import { AuthModule } from './auth/auth.module';
import { MoralisModule } from './moralis/moralis.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';

@Module({
  imports: [
    CoinRatesModule,
    BlockcypherModule,
    MongooseModule,
    EntitiesModule,
    DatabaseModule,
    WalletModule,
    TransactionModule,
    WebhooksModule,
    InfuraModule,
    ScheduleModule.forRoot(),
    AdminModule,
    AuthModule,
    AddressBookModule,
    MoralisModule,
    PushNotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
