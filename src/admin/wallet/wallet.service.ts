import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Wallet } from 'ethers';
import { WalletEntity, WalletModel } from '../../entities/wallet.entity';
import { GetWalletsQueryDto } from './dto/get-wallets.query.dto';
import { WalletHelper } from './helpers/wallet.helper';
import { DailyWalletGenerationCountDto } from './dto/daily-wallet-generation-count.dto';
import { dailyWalletGeneratedAgg } from './mongo-queries/daily-wallet-generated.aggregation';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(WalletEntity.name)
    private readonly walletModel: WalletModel,
    private readonly walletHelper: WalletHelper,
  ) {}

  async getWallets(query: GetWalletsQueryDto) {
    /** where clause*/
    const where = query.coinSymbol ? { coinSymbol: query.coinSymbol } : {};
    return this.walletModel.find(where).lean();
  }

  async getTotalWalletBalance(query: GetWalletsQueryDto) {
    /** where clause*/
    const where = query.coinSymbol ? { coinSymbol: query.coinSymbol } : {};
    const wallets = await this.walletModel
      .find(where)
      .select({ balance: 1 })
      .lean();
    return this.walletHelper.getTotalBalance(wallets);
  }

  async getTotalWalletCount(query: GetWalletsQueryDto) {
    /** where clause*/
    const where = query.coinSymbol ? { coinSymbol: query.coinSymbol } : {};
    return this.walletModel.count(where).lean();
  }

  async getDailyWalletGeneratedCount(query: DailyWalletGenerationCountDto) {
    return this.walletModel.aggregate(
      dailyWalletGeneratedAgg(query.from, query.to),
    );
  }
}
