import { Module } from '@nestjs/common';
import { MoralisController } from './moralis.controller';
import { MoralisService } from './moralis.service';
import { ConfigModule } from '../config/config.module';
import { TransactionModule } from '../transaction/transaction.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [ConfigModule, TransactionModule, WebhooksModule, WalletModule],
  controllers: [MoralisController],
  providers: [MoralisService],
  exports: [MoralisService],
})
export class MoralisModule {}
