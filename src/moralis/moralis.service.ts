import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { Moralis } from 'moralis/node';
import {
  TransactionsDocument,
  TransactionsEntity,
} from '../entities/transactions.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WalletEntity, WalletModel } from '../entities/wallet.entity';

@Injectable()
export class MoralisService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(TransactionsEntity.name)
    private readonly transactionModel: Model<TransactionsDocument>,
    @InjectModel(WalletEntity.name)
    private readonly walletModel: WalletModel,
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
}
