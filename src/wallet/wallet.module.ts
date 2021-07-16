import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { WalletCore } from './wallet-core.service';
import { WalletController } from './wallet.controller';
import { BlockcypherModule } from '../blockcypher/blockcypher.module';
import { WalletHelper } from './helpers/wallet.helper';
import { WalletService } from './wallet.service';
import { CoinRatesModule } from '../coin-rates/coin-rates.module';
import { ConfigService } from '../config/config.service';
import Web3 from 'web3';
import { BlockcypherService } from '../blockcypher/blockcypher.service';
import { TransactionModule } from '../transaction/transaction.module';
import { EtherScanService } from '../transaction/ether-scan.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    forwardRef(() => BlockcypherModule),
    HttpModule,
    forwardRef(() => CoinRatesModule),
    forwardRef(() => ConfigModule),
  ],
  controllers: [WalletController],
  providers: [
    WalletCore,
    WalletHelper,
    WalletService,
    EtherScanService,
    {
      provide: 'Web3',
      useFactory: (config: ConfigService) => {
        return new Web3(new Web3.providers.HttpProvider(config.infuraNetwork));
      },
      inject: [ConfigService],
    },
  ],
  exports: [WalletCore, WalletHelper, WalletService],
})
export class WalletModule {}
