import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  TransactionModel,
  TransactionsDocument,
  TransactionsEntity,
} from '../../entities/transactions.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionHelper } from '../helpers/transaction.helper';
import { BlockcypherService } from '../../blockcypher/blockcypher.service';
import { WalletHelper } from '../../wallet/helpers/wallet.helper';
import Web3 from 'web3';
import { SocketsService } from '../../webhooks/sockets.service';
import { EtherScanService } from '../etherscan.service';
import { BscScanService } from '../bscscan.service';

@Injectable()
export class Web3BnbTransactionsMonitor {
  constructor(
    @InjectModel(TransactionsEntity.name)
    private readonly transactionModel: TransactionModel,
    private readonly transactionHelper: TransactionHelper,
    private readonly blockypherService: BlockcypherService,
    private readonly walletHelper: WalletHelper,
    private readonly socketService: SocketsService,
    private readonly bscScanService: BscScanService,
  ) {
    // this.monitorBnbTx();
  }
  @Cron(CronExpression.EVERY_MINUTE)
  async monitorBnbTx() {
    console.log('started monitoring bnb trxs');
    const txs = await this.transactionHelper.getAllBscScanUnconfirmedTxs();
    for (const tx of txs) {
      try {
        const receipt = await this.bscScanService.getTxReceipt(tx.txId);
        if (receipt === 'Pass') {
          const currentBlockNumber = await this.bscScanService.getLatestBlock();
          // update number of confirmations
          const txDB = await this.transactionModel.updateConfirmations(
            tx._id,
            currentBlockNumber - tx.blockHeight,
          );
          // update wallet balance of to and from of txs
          await this.walletHelper.updateBnbLikeWalletsBalance(
            tx.to,
            txDB.coinSymbol,
          );
          await this.walletHelper.updateBnbLikeWalletsBalance(
            tx.from,
            txDB.coinSymbol,
          );
          // send data to tx., and tx.from
          const _tx = await this.transactionHelper.transformTransaction([txDB]);
          this.socketService.emit({ coinSymbol: _tx[0].coinSymbol }, tx.to);
          this.socketService.emit({ coinSymbol: _tx[0].coinSymbol }, tx.from);
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
}
