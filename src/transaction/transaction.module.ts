import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { BlockcypherModule } from '../blockcypher/blockcypher.module';
import { WalletModule } from '../wallet/wallet.module';
import { TransactionHelper } from './helpers/transaction.helper';
import { TransactionRepo } from './transaction.repo';
import { InfuraModule } from '../infura/infura.module';
import { SubmitTransactionValidationPipe } from '../globals/pipes/submit-transaction.validation.pipe';
import { BlockcypherTransactionMonitor } from './crons/blockcypher-transaction-monitor';
import { ConfigService } from '../config/config.service';
import Web3 from 'web3';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { Web3EthTransactionsMonitor } from './crons/web3-eth-transactions-monitor';
import { SyncEthTransactions } from './crons/sync-eth-transactions';
import { EtherScanService } from './etherscan.service';
import { SyncBnbTransactions } from './crons/sync-bnb-transactions';
import { BscScanService } from './bscscan.service';
import { Web3BnbTransactionsMonitor } from './crons/web3-bnb-transactions-monitor';

@Module({
  imports: [
    HttpModule,
    BlockcypherModule,
    WalletModule,
    InfuraModule,
    forwardRef(() => WebhooksModule),
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionHelper,
    TransactionRepo,
    SubmitTransactionValidationPipe,
    BlockcypherTransactionMonitor,
    Web3EthTransactionsMonitor,
    Web3BnbTransactionsMonitor,
    SyncEthTransactions,
    SyncBnbTransactions,
    EtherScanService,
    BscScanService,
    {
      provide: 'Web3',
      useFactory: (config: ConfigService) => {
        return new Web3(new Web3.providers.HttpProvider(config.infuraNetwork));
      },
      inject: [ConfigService],
    },
    {
      provide: 'BinanceWeb3',
      useFactory: (config: ConfigService) => {
        return new Web3(new Web3.providers.HttpProvider(config.binanceRpcUrl));
      },
      inject: [ConfigService],
    },
  ],
  exports: [TransactionHelper, BscScanService, EtherScanService],
})
export class TransactionModule {}
