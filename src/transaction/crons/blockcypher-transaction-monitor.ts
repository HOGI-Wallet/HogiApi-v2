import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  TransactionModel,
  TransactionsEntity,
} from '../../entities/transactions.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Promise } from 'mongoose';
import { TransactionHelper } from '../helpers/transaction.helper';
import { BlockcypherService } from '../../blockcypher/blockcypher.service';
import { WalletHelper } from '../../wallet/helpers/wallet.helper';
import { SocketsService } from '../../webhooks/sockets.service';
import { WalletEntity, WalletModel } from '../../entities/wallet.entity';

@Injectable()
export class BlockcypherTransactionMonitor {
  constructor(
    @InjectModel(TransactionsEntity.name)
    private readonly transactionModel: TransactionModel,
    private readonly transactionHelper: TransactionHelper,
    private readonly blockypherService: BlockcypherService,
    private readonly walletHelper: WalletHelper,
    private readonly socketService: SocketsService,
    @InjectModel(WalletEntity.name)
    private readonly walletModel: WalletModel,
  ) {
    // this.monitorBTCLikeTxs();
  }
  @Cron(CronExpression.EVERY_30_SECONDS)
  async monitorBTCLikeTxs() {
    console.log('started monitoring blockcypher trxs');
    const txs = await this.transactionHelper.getAllBlockCypherUnconfirmedTxs();
    for (const tx of txs) {
      console.log('checking tx on blockcypher =>', tx);
      const details = await this.blockypherService.getTxDetails(
        tx.coinSymbol,
        tx.txId,
      );
      // update number of confirmations
      await this.transactionModel.updateConfirmations(
        tx._id,
        details.confirmations,
      );
      // update wallet balance of to and from of txs
      await this.walletHelper.updateBTCLikeWalletsBalance(tx.coinSymbol, tx.to);
      await this.walletHelper.updateBTCLikeWalletsBalance(
        tx.coinSymbol,
        tx.from,
      );
      // send data to tx., and tx.from
      this.socketService.emit({ coinSymbol: tx.coinSymbol }, tx.to);
      this.socketService.emit({ coinSymbol: tx.coinSymbol }, tx.from);
    }
  }
}
