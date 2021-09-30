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
import { RatesDocument, RatesEntity } from '../entities/rates.entity';
import { MoralisService } from '../moralis/moralis.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(CoinEntity.name)
    private readonly coinModel: Model<CoinDocument>,
    @InjectModel(RatesEntity.name)
    private readonly ratesModel: Model<RatesDocument>,
    private readonly blockcypherService: BlockcypherService,
    private readonly coinRateService: CoinRatesService,
    @InjectModel(WalletEntity.name)
    private readonly walletModel: Model<WalletDocument>,
    private readonly walletHelper: WalletHelper,
    private readonly moralisService: MoralisService,
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
      coinRate?.rate ?? 0,
      info.balance,
    );
  }

  async getMyWalletBalanceAndRates(
    coinSymbol: string,
    address: string,
    vs_currency = 'usd',
  ) {
    const info = await this.walletModel.findOne({ address, coinSymbol });

    if (!info)
      throw new UnprocessableEntityException({
        message: 'wallet info not found in DB',
      });

    // get conversion rate
    const coinRate = await this.coinRateService.getCoinRate(
      coinSymbol,
      vs_currency,
    );

    const balanceInOtherCurrency = await this.walletHelper.balanceInOtherCurrency(
      coinSymbol,
      coinRate?.rate ?? 1,
      info.balance,
    );
    return {
      ...balanceInOtherCurrency,
      ...coinRate,
    };
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

      // todo register addresses for watching
      const coinType = await this.walletHelper.getCoinType(coin);
      // if (coinType === 'btcLike') {
      //   await this.blockcypherService.registerWebhook(
      //     data.address,
      //     coin.coinSymbol,
      //   );
      // }
      if (coinType === 'isEth' || coinType === 'isERC20') {
        await this.moralisService.watchEthAddress(data.address);
      }
      if (coinType === 'isBnb' || coinType === 'isBEP20') {
        await this.moralisService.watchBscAddress(data.address);
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

  async addPublicInfoForAllCoins(publicinfoData: CreatePublicinfoDto[]) {
    const coinRates = await this.ratesModel
      .find({ currencyCode: 'USD' })
      .lean();
    let publicInfoDataAdded = [];
    for (const data of publicinfoData) {
      await this.addPublicInfo(data);
      const ratesInfo = await coinRates.find(
        (coin) => coin.coinSymbol === data.coinSymbol,
      );
      const walletInfo = await this.walletModel
        .findOne({ address: data.address, coinSymbol: data.coinSymbol })
        .lean();
      const balance = await this.walletHelper.balanceInOtherCurrency(
        ratesInfo.coinSymbol,
        ratesInfo?.rate ?? 0,
        walletInfo.balance,
      );
      publicInfoDataAdded.push({
        coinSymbol: data.coinSymbol,
        chart_data: {
          ...ratesInfo,
        },
        ...balance,
      });
    }
    return publicInfoDataAdded;
  }
}
