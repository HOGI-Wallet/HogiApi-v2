import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { BlockcypherService } from '../blockcypher/blockcypher.service';
import { CoinDocument, CoinEntity } from '../entities/coin.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Mode } from 'fs';
import { Model, Promise } from 'mongoose';
import { SendTransactionDto } from './dto/send-transaction.dto';
import { WalletHelper } from '../wallet/helpers/wallet.helper';
import { TransactionRepo } from './transaction.repo';
import { TransactionHelper } from './helpers/transaction.helper';
import { InfuraService } from '../infura/infura.service';
import { Transaction as EthereumTx } from 'ethereumjs-tx';
import { BlockExplorerUtils } from '../globals/utils/blockExplorerUtils';
import { EtherScanService } from './etherscan.service';
import { BscScanService } from './bscscan.service';
import { WalletDocument, WalletEntity } from '../entities/wallet.entity';
import {
  TransactionModel,
  TransactionsEntity,
} from '../entities/transactions.entity';
import { SocketsService } from '../webhooks/sockets.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly blockcypherService: BlockcypherService,
    private readonly infuraService: InfuraService,
    private readonly transactionRepo: TransactionRepo,
    private readonly transactionHelper: TransactionHelper,
    private readonly walletHelper: WalletHelper,
    @InjectModel(CoinEntity.name)
    private readonly coinModel: Model<CoinDocument>,
    private readonly etherScanService: EtherScanService,
    private readonly bscScanService: BscScanService,
    @InjectModel(WalletEntity.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(TransactionsEntity.name)
    private readonly transactionModel: TransactionModel,
    private readonly socket: SocketsService,
  ) {}

  async createTx(coinSymbol: string, tx: CreateTransactionDto) {
    /** get coin info , this info will be used to use the underlying sdk for account recovery*/
    const coin: CoinEntity = await this.coinModel
      .findOne({
        coinSymbol: BlockExplorerUtils.getBCTestCoin(coinSymbol),
      })
      .lean();

    if (!coin) throw new NotFoundException('coin not found in db');
    try {
      return await this.blockcypherService.createNewTx(
        coin.coinSymbol,
        tx.from,
        tx.to,
        tx.amount,
      );
    } catch (e) {
      throw new UnprocessableEntityException({
        message: e.message,
      });
    }
  }

  async sendTx(coinSymbol, data: SendTransactionDto) {
    try {
      const tx = await this.blockcypherService.sendSignedTx(
        data.tx,
        data.signatures,
        data.pubKeys,
        coinSymbol,
      );

      // log tx in db
      await this.transactionRepo.createTx(
        this.transactionHelper.transformBCTx(coinSymbol, tx.tx),
      );
      return tx;
    } catch (e) {
      throw new UnprocessableEntityException({ message: e.message });
    }
  }

  async createSentTxInDb(txHash: string, coinSymbol: string) {
    const coin = await this.coinModel.findOne({ coinSymbol }).lean();
    const coinType = await this.walletHelper.getCoinType(coin);
    switch (coinType) {
      case 'isEth': {
        const tx = await this.transactionHelper.getEthTransactionByRpc(txHash);
        const dbTxPayload = await this.etherScanService.transformTxs(
          [tx],
          '',
          coin,
        );
        const dbTx = await this.transactionRepo.createTx(dbTxPayload);
        return dbTx;
      }
      case 'isERC20': {
        const tx = await this.transactionHelper.getEthTransactionByRpc(txHash);
        const {
          toAddress,
          amount,
        } = await this.transactionHelper.decodeERC20Transfer(tx);
        const _tx = { ...tx, to: toAddress, value: amount };
        const dbTxPayload = await this.etherScanService.transformTxs(
          [_tx],
          '',
          coin,
        );
        const dbTx = await this.transactionRepo.createTx(dbTxPayload);
        return dbTx;
      }
      case 'isBnb': {
        const tx = await this.transactionHelper.getBscTransactionByRpc(txHash);
        const dbTxPayload = await this.bscScanService.transformTxs(
          [tx],
          '',
          coin,
        );
        const dbTx = await this.transactionRepo.createTx(dbTxPayload);
        return dbTx;
      }
      case 'isBEP20': {
        const tx = await this.transactionHelper.getBscTransactionByRpc(txHash);
        const {
          toAddress,
          amount,
        } = await this.transactionHelper.decodeBEP20Transfer(tx);
        const _tx = { ...tx, to: toAddress, value: amount };
        const dbTxPayload = await this.bscScanService.transformTxs(
          [_tx],
          '',
          coin,
        );
        const dbTx = await this.transactionRepo.createTx(dbTxPayload);
        return dbTx;
      }
      case 'btcLike': {
        const tx = await this.blockcypherService.getTxDetails(
          coin.coinSymbol,
          txHash,
        );
        const dbTxPayload = await this.transactionHelper.transformBCTx(
          coin.coinSymbol,
          tx,
        );
        const dbTx = await this.transactionRepo.createTx(dbTxPayload);
        return dbTx;
      }
    }
  }

  /**
   * this method with upsert trx in to db
   * @param trx
   */
  async syncTrxsWithDb(trxs: TransactionsEntity[]) {
    const dbPromises = [];
    const filteredTrx = trxs.filter((trx: TransactionsEntity) => {
      return String(trx.amount) !== '0';
    });
    for (const tx of filteredTrx) {
      dbPromises.push(
        this.transactionModel.findOneAndUpdate({ txId: tx.txId }, tx, {
          upsert: true,
        }),
      );
    }
    const txs = await Promise.all(dbPromises);
    // emit txs to sockets
    // this.socket.emitTxs(txs);
    return txs;
  }

  async sync(coinSymbol: string, address: string) {
    const coin: CoinEntity = await this.coinModel.findOne({ coinSymbol });
    if (coin) {
      const wallet: WalletEntity = await this.walletModel.findOne({
        address,
        coinSymbol: coin.coinSymbol,
      });
      if (wallet) {
        if (wallet.coinSymbol === 'bnb' || wallet.isBEP20 === true) {
          const txs = await this.bscScanService.getTxs(wallet.address, coin);
          /**
           * update balance
           */
          await this.walletHelper.updateBnbLikeWalletsBalance(
            wallet.address,
            wallet.coinSymbol,
          );

          /** update last transaction update time in wallet */
          await this.walletModel.findOneAndUpdate(
            { _id: wallet._id },
            { lastTxUpdate: new Date().toISOString() },
          );
          if (txs?.length) return await this.syncTrxsWithDb(txs);
        } else if (wallet.coinSymbol === 'eth' || wallet.isERC20 === true) {
          const txs = await this.etherScanService.getTxs(wallet.address, coin);

          /**
           * update balance
           */
          await this.walletHelper.updateEthLikeWalletsBalance(
            wallet.address,
            wallet.coinSymbol,
          );

          /** update last transaction update time in wallet */
          await this.walletModel.findOneAndUpdate(
            { _id: wallet._id },
            { lastTxUpdate: new Date().toISOString() },
          );
          if (txs?.length) return await this.syncTrxsWithDb(txs);
        } else {
          return 'Wallet sync not supported.';
        }
      } else {
        return 'Wallet not found in DB.';
      }
    } else {
      return 'Coin not found In DB.';
    }
  }
}
