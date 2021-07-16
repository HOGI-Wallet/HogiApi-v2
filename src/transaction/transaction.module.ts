import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { BlockcypherModule } from '../blockcypher/blockcypher.module';
import { WalletModule } from '../wallet/wallet.module';
import { TransactionHelper } from './helpers/transaction.helper';
import { TransactionRepo } from './transaction.repo';
import { InfuraModule } from '../infura/infura.module';
import { SubmitTransactionValidationPipe } from '../globals/submit-transaction.validation.pipe';
import { BlockcypherTransactionMonitor } from './crons/blockcypher-transaction-monitor';
import { ConfigService } from '../config/config.service';
import Web3 from 'web3';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { Web3TransactionsMonitor } from './crons/web3-transactions-monitor';
import { SyncEthTransactions } from './crons/sync-eth-transactions';
import { EtherScanService } from './ether-scan.service';

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
    Web3TransactionsMonitor,
    SyncEthTransactions,
    EtherScanService,
    {
      provide: 'Web3',
      useFactory: (config: ConfigService) => {
        return new Web3(new Web3.providers.HttpProvider(config.infuraNetwork));
      },
      inject: [ConfigService],
    },
  ],
  exports: [TransactionHelper, EtherScanService],
})
export class TransactionModule {}
