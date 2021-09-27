import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { Moralis } from 'moralis/node';
import {
  TransactionsDocument,
  TransactionsEntity,
} from '../entities/transactions.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Promise } from 'mongoose';
import { WalletEntity, WalletModel } from '../entities/wallet.entity';
import { CoinDocument, CoinEntity } from '../entities/coin.entity';
import { BscScanService } from '../transaction/bscscan.service';
import { EtherScanService } from '../transaction/etherscan.service';

@Injectable()
export class MoralisService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(TransactionsEntity.name)
    private readonly transactionModel: Model<TransactionsDocument>,
    @InjectModel(WalletEntity.name)
    private readonly walletModel: WalletModel,
    @InjectModel(CoinEntity.name)
    private readonly coinModel: Model<CoinDocument>,
    private readonly bscscanService: BscScanService,
    private readonly etherscanService: EtherScanService,
  ) {}

  async watchBscAddress(address: string) {
    Moralis.initialize(this.configService.moralisAppId);
    Moralis.serverURL = this.configService.moralisServerUrl;
    await Moralis.Cloud.run('watchBscAddress', {
      address,
    });
  }

  async watchEthAddress(address: string) {
    Moralis.initialize(this.configService.moralisAppId);
    Moralis.serverURL = this.configService.moralisServerUrl;
    await Moralis.Cloud.run('watchEthAddress', {
      address,
    });
  }

  async transformBscTx(trx: any, coinSymbol: string) {
    return {
      coinSymbol,
      amount: trx.object.value / Math.pow(10, 18),
      timeStamp: new Date(trx.object.createdAt),
      infoURL: this.configService.bscScanExplorerUrl + '/tx/' + trx.hash,
      confirmations: trx.object.confirmations,
      from: trx.object.from_address.toLowerCase(),
      to: trx.object.to_address.toLowerCase(),
      txId: trx.object.hash,
      blockHeight: String(trx.object.block_number).includes('x')
        ? parseInt(trx.object.block_number, 16) // sometimes its hex, other times its not
        : trx.object.block_number,
      explorer: 'bscscan',
      explorerUrl: trx.object.hash,
    };
  }

  async transformEthTx(trx: any, coinSymbol: string) {
    return {
      coinSymbol,
      amount: trx.object.value / Math.pow(10, 18),
      timeStamp: new Date(trx.object.createdAt),
      infoURL: this.configService.etherScanExplorerUrl + '/tx/' + trx.hash,
      confirmations: trx.object.confirmations,
      from: trx.object.from_address.toLowerCase(),
      to: trx.object.to_address.toLowerCase(),
      txId: trx.object.hash,
      blockHeight: String(trx.object.block_number).includes('x')
        ? parseInt(trx.object.block_number, 16) // sometimes its hex, other times its not
        : trx.object.block_number,
      explorer: 'etherscan',
      explorerUrl: trx.object.hash,
    };
  }

  async createTX(tx) {
    try {
      return await this.transactionModel
        .findOneAndUpdate({ txId: tx.txId }, tx, {
          upsert: true,
          new: true,
        })
        .lean();
    } catch (e) {
      throw new Error("couldn't create tx in DB");
    }
  }

  async updateBalance(address: string, balance: string, coinSymbol: string) {
    await this.walletModel.updateAddressBalance(address, balance, coinSymbol);
  }

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
    return txs;
  }

  async tokenWebhook(trx: any) {
    const coin: CoinEntity = await this.coinModel
      .findOne({ contractAddress: trx.token_address })
      .lean();
    // console.log('coin in tokenWebhook =>', coin);
    const balance = String(trx.balance / Math.pow(10, coin.decimal ?? 18));
    // console.log('balance in tokenWebhook =>', balance);
    await this.updateBalance(trx.address, balance, coin.coinSymbol);
    if (coin.coinSymbol === 'bnb' || coin.isBep20 === true) {
      const trxs = await this.bscscanService.getBEP20Txs(
        trx.address,
        coin.contractAddress,
      );
      const transformedTrxs = await this.bscscanService.transformTxs(
        trxs,
        trx.address,
        coin,
      );
      await this.syncTrxsWithDb(transformedTrxs);
    }
    if (coin.coinSymbol === 'eth' || coin.isErc20 === true) {
      const trxs = await this.etherscanService.getERC20Txs(
        trx.address,
        coin.contractAddress,
      );
      const transformedTrxs = await this.etherscanService.transformTxs(
        trxs,
        trx.address,
        coin,
      );
      await this.syncTrxsWithDb(transformedTrxs);
    }
    return {
      coinSymbol: coin.coinSymbol,
      address: trx.address,
    };
  }

  async syncMoralisWithDb(update: boolean) {
    if (update) {
      const wallets: WalletEntity[] = await this.walletModel.find().lean();
      await wallets.map(async (wallet) => {
        if (wallet.coinSymbol === 'eth' || wallet.isERC20 === true) {
          await this.watchEthAddress(wallet.address);
        }
        if (wallet.coinSymbol === 'bnb' || wallet.isBEP20 === true) {
          await this.watchBscAddress(wallet.address);
        }
      });

      return 'wallets synced with moralis!';
    }
  }
}
