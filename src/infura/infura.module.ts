import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { InfuraService } from './infura.service';
import { ConfigService } from '../config/config.service';
import Web3 from 'web3';
import { TransactionModule } from '../transaction/transaction.module';
import { WalletModule } from '../wallet/wallet.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => TransactionModule),
    forwardRef(() => WalletModule),
    forwardRef(() => WebhooksModule),
  ],

  providers: [
    InfuraService,
    {
      provide: 'Web3',
      useFactory: (config: ConfigService) => {
        return new Web3(new Web3.providers.HttpProvider(config.infuraNetwork));
      },
      inject: [ConfigService],
    },
    {
      provide: 'Web3Socket',
      useFactory: (config: ConfigService) => {
        return new Web3(new Web3.providers.WebsocketProvider(config.infuraWS));
      },
      inject: [ConfigService],
    },
  ],
  exports: [InfuraService],
})
export class InfuraModule {}
