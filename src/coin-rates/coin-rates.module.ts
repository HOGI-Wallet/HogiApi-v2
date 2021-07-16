import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { CoinRatesService } from './coin-rates.service';
import { CoinRatesController } from './coin-rates.controller';
import CoinGecko from 'coingecko-api';
import { MongooseModule } from '@nestjs/mongoose';
import { RatesHelper } from './helpers/rates.helper';
import { WalletModule } from '../wallet/wallet.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    MongooseModule,
    HttpModule,
    forwardRef(() => WalletModule),
    forwardRef(() => WebhooksModule),
  ],
  providers: [
    CoinRatesService,
    RatesHelper,
    {
      provide: 'CoinGeckoClient',
      useValue: new CoinGecko(),
    },
  ],
  controllers: [CoinRatesController],
  exports: [CoinRatesService],
})
export class CoinRatesModule {}
