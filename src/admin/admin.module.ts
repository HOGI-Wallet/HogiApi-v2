import { Module } from '@nestjs/common';
import { CoinController } from './coin/coin.controller';
import { WalletController } from './wallet/wallet.controller';
import { CoinService } from './coin/coin.service';
import { WalletService } from './wallet/wallet.service';
import { WalletHelper } from './wallet/helpers/wallet.helper';
import { CoinRatesModule } from '../coin-rates/coin-rates.module';
import { NewsController } from './news/news.controller';
import { NewsService } from './news/news.service';
import { S3Service } from '../globals/services/s3.service';
import { DappLinksController } from './dapp-links/dapp-links.controller';
import { DappLinksService } from './dapp-links/dapp-links.service';

@Module({
  imports: [CoinRatesModule],
  controllers: [
    // CoinController,
    // WalletController,
    NewsController,
    DappLinksController,
  ],
  providers: [
    CoinService,
    WalletService,
    WalletHelper,
    NewsService,
    DappLinksService,
    S3Service,
  ],
})
export class AdminModule {}
