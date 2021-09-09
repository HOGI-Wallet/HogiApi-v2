import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CoinDocument, CoinEntity } from '../entities/coin.entity';
import { Model } from 'mongoose';
import { BlockcypherService } from '../blockcypher/blockcypher.service';
import { CoinRatesService } from '../coin-rates/coin-rates.service';
import { CreatePublicinfoDto } from './dto/create-publicinfo.dto';
import { WalletDocument, WalletEntity } from '../entities/wallet.entity';
import { WalletHelper } from './helpers/wallet.helper';
import { BlockExplorerUtils } from '../globals/utils/blockExplorerUtils';
import { ConfigService } from '../config/config.service';
import { GenerateWalletsDto } from './dto/generate-wallets.dto';
import { WalletInterface } from './types/wallet.interface';
import { WalletCore } from './wallet-core.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(CoinEntity.name)
    private readonly coinModel: Model<CoinDocument>,
    private readonly blockcypherService: BlockcypherService,
    private readonly coinRateService: CoinRatesService,
    @InjectModel(WalletEntity.name)
    private readonly walletModel: Model<WalletDocument>,
    private readonly walletHelper: WalletHelper,
    private readonly config: ConfigService,
    private readonly walletCore: WalletCore,
  ) {}

  async getMyWalletBalance(
    coinSymbol: string,
    address: string,
    vs_currency = 'usd',
  ) {
    const coin = await this.coinModel.findOne({
      coinSymbol: new RegExp(BlockExplorerUtils.getBCTestCoin(coinSymbol), 'i'),
    });

    const info = await this.walletModel.findOne({ address, coinSymbol });

    if (!info)
      throw new UnprocessableEntityException({
        message: 'user info not found in DB',
      });

    // get conversion rate
    const coinRate = await this.coinRateService.getCoinRate(
      coin.coinSymbol,
      vs_currency,
    );

    return this.walletHelper.balanceInOtherCurrency(
      coinSymbol,
      coinRate?.rate ?? 1,
      info.balance,
    );
  }
  async addPublicInfo(data: CreatePublicinfoDto) {
    const coin = await this.coinModel
      .findOne({
        coinSymbol: new RegExp(data.coinSymbol),
      })
      .lean();

    try {
      const walletAdded = await this.walletModel.updateOne(
        {
          address: new RegExp(`^${data.address}$`, 'i'),
          coinSymbol: new RegExp(`^${coin.coinSymbol}$`),
        },
        {
          ...data,
          isERC20: coin.isErc20,
          isBEP20: coin.isBep20,
          coinId: coin._id.toString(),
          balance: await this.walletHelper.getBalance(data.address, coin),
          // lastTxUpdate in now() - 6 mins, so that synx tx cron job process that wallet early
          lastTxUpdate: new Date(
            new Date().getTime() - 1000 * 60 * 6,
          ).toISOString(),
        },
        { upsert: true },
      );

      // todo register webhooks
      const coinType = await this.walletHelper.getCoinType(coin);
      if (coinType === 'btcLike') {
        await this.blockcypherService.registerWebhook(
          data.address,
          coin.coinSymbol,
        );
      }
      return { ...walletAdded, isErc20: coin.isErc20 };
    } catch (e) {
      //
    }
  }
  async getCoinInfo(coinSymbol: string): Promise<CoinEntity> {
    try {
      const coin = await this.coinModel
        .findOne({
          coinSymbol: new RegExp(
            BlockExplorerUtils.getBCTestCoin(coinSymbol),
            'i',
          ),
        })
        .lean();
      return coin;
    } catch (e) {
      console.log(e);
    }
  }
  async generateWallets(body: GenerateWalletsDto) {
    const coins = await this.coinModel.find().lean();
    const wallets = await coins.map(async (coinEntity) => {
      const coin = await this.getCoinInfo(coinEntity.coinSymbol);
      let symbol = coinEntity.coinSymbol;
      if (coin.isErc20) {
        symbol = 'eth';
      }
      if (coin.isBep20) {
        symbol = 'bnb';
      }
      if (!body.recovery) {
        try {
          const wallet: WalletInterface = await WalletCore.createHdWallet(
            symbol,
            body.mnemonics,
          );

          /** add public info in db for realtime balances update */
          const pubInfo = await this.addPublicInfo({
            coinSymbol: coinEntity.coinSymbol,
            hdPath: wallet.path,
            address: wallet.address,
          });

          return { ...wallet, isErc20: coin?.isErc20, isBep20: coin?.isBep20 };
        } catch (e) {
          throw new UnprocessableEntityException(e.message);
        }
      } else {
        try {
          const wallet = await this.walletCore.accountRecovery(
            coin,
            body.mnemonics,
            2,
            null,
          );
          /** add public info in db for realtime balances update */
          const pubInfo = await this.addPublicInfo({
            coinSymbol: coinEntity.coinSymbol,
            hdPath: wallet.path,
            address: wallet.address,
          });

          return { ...wallet, isErc20: coin?.isErc20, isBep20: coin?.isBep20 };
        } catch (e) {
          throw new UnprocessableEntityException(e.message);
        }
      }
    });
    return wallets;
  }
}
