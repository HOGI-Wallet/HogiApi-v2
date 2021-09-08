import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RatesDocument, RatesEntity } from '../entities/rates.entity';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CoinDocument, CoinEntity } from '../entities/coin.entity';
import { CurrencyDocument, CurrencyEntity } from '../entities/currency.entity';
import { RatesHelper } from './helpers/rates.helper';
import { SocketsService } from '../webhooks/sockets.service';
import { BlockExplorerUtils } from '../globals/utils/blockExplorerUtils';
import moment from 'moment';

@Injectable()
export class CoinRatesService {
  constructor(
    @InjectModel(RatesEntity.name)
    private readonly ratesModel: Model<RatesDocument>,
    @InjectModel(CoinEntity.name)
    private readonly coinModel: Model<CoinDocument>,
    @InjectModel(CurrencyEntity.name)
    private readonly currencyModel: Model<CurrencyDocument>,
    private readonly ratesHelper: RatesHelper,
    private readonly socketService: SocketsService,
  ) {}

  async getCoinRate(coinSymbol: string, vs_currency: string): Promise<any> {
    try {
      const rate: RatesEntity = await this.ratesModel
        .findOne({
          coinSymbol: BlockExplorerUtils.getBCTestCoin(coinSymbol),
          currencyCode: new RegExp(vs_currency, 'i'),
        })
        .lean();
      const coin = await this.coinModel.findById(rate.coinId).lean();
      return {
        ...rate,
        coin,
      };
    } catch (e) {
      // throw new Error("couldn't fetch rates from db");
    }
  }

  async getAllCoinRates(vs_currency: string) {
    try {
      return await this.ratesModel.find({
        currencyCode: new RegExp(vs_currency, 'i'),
      });
    } catch (e) {
      throw new Error("couldn't fetch rates from db");
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateCoinRates(_coins?: CoinEntity[]) {
    console.log('started update coin rate job');
    /** get supported coins */
    let coins;
    if (_coins?.length) coins = _coins;
    else coins = await this.coinModel.find().lean();

    /** filtering coin and removing coins with fixed rates*/
    const coinWithMarketRates = await coins.filter((coin) => {
      return !coin.isFixedRate;
    });

    const tetherPrice = await this.ratesHelper.getTetherRates();

    /** get supported currencies */
    const currencies = await this.currencyModel.find().lean();

    const _marketData = await this.getMarketData(
      coinWithMarketRates,
      currencies,
    );
    /** get each currency and coins*/
    for (const coin of coins) {
      for (const currency of currencies) {
        try {
          if (!coin.isFixedRate) {
            /** get market data */
            let marketData;
            marketData = _marketData.find(
              (_data) =>
                _data.id === coin.coingeckoId &&
                _data.currency === currency.code,
            );

            /** update data in db*/
            const rate = {
              coinSymbol: coin.coinSymbol,
              currencyCode: currency.code,
              coinId: coin._id.toString(),
              currencyId: currency._id.toString(),
              high24h: marketData.high_24h,
              low24h: marketData.low_24h,
              marketCap: marketData.market_cap,
              rate: marketData.current_price,
              totalVolume: marketData.total_volume,
              change24h: marketData.market_cap_change_24h,
              changePercentage24h: marketData.market_cap_change_percentage_24h,
            };

            /** update */
            const updatedRate = await this.ratesModel.findOneAndUpdate(
              { coinId: coin._id, currencyId: currency._id },
              rate,
              { upsert: true },
            );
          } else {
            const ago24h = await moment().subtract(24, 'hours').valueOf();
            const history24h = await coin.fixedRateHistory.filter((history) => {
              return history.timestamp > ago24h;
            });
            const sortedHistory24h = history24h.sort(function (x, y) {
              return x.timestamp - y.timestamp;
            });
            const high24h = await Math.max.apply(
              Math,
              history24h.map(function (history) {
                return (
                  history.price *
                  tetherPrice.tether[currency.code.toLowerCase()]
                );
              }),
            );

            const low24h = await Math.min.apply(
              Math,
              history24h.map(function (history) {
                return (
                  history.price *
                  tetherPrice.tether[currency.code.toLowerCase()]
                );
              }),
            );

            const sortedEnd = await sortedHistory24h[
              sortedHistory24h.length - 1
            ].price;
            const sortedStart = await sortedHistory24h[0].price;

            const changePercentage24h =
              (await ((sortedEnd - sortedStart) * 100)) /
              sortedHistory24h[0].price;

            /** update data in db*/
            const rate = {
              coinSymbol: coin.coinSymbol,
              currencyCode: currency.code,
              coinId: coin._id.toString(),
              currencyId: currency._id.toString(),
              high24h: history24h.length
                ? high24h
                : coin.fixedRate *
                  tetherPrice.tether[currency.code.toLowerCase()],
              low24h: history24h.length
                ? low24h
                : coin.fixedRate *
                  tetherPrice.tether[currency.code.toLowerCase()],
              marketCap: 0,
              rate:
                coin.fixedRate *
                tetherPrice.tether[currency.code.toLowerCase()],
              totalVolume: 0,
              change24h: 0,
              changePercentage24h:
                sortedHistory24h.length > 1 ? changePercentage24h : 0,
            };

            /** update */
            const updatedRate = await this.ratesModel.findOneAndUpdate(
              { coinId: coin._id, currencyId: currency._id },
              rate,
              { upsert: true },
            );
          }
        } catch (e) {
          // safely ignore
        }
      }
    }

    // send updated data on sockets
    this.socketService.emit(
      { message: 'please get latest coin data' },
      'charts',
    );
    return;
  }

  async getMarketData(
    coins: CoinEntity[],
    currencies: CurrencyEntity[],
  ): Promise<any[]> {
    let marketData = [];
    for (const currency of currencies) {
      const _marketData = await this.ratesHelper.getMarketData(
        coins
          .filter((c) => !c.isFixedRate)
          .map((c) => c.coingeckoId)
          .join(','),
        currency.code,
      );

      marketData = [
        ...marketData,
        ..._marketData.map((data) => ({ ...data, currency: currency.code })),
      ];
    }
    return marketData;
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateSparkLines(_coins?: CoinEntity[]) {
    console.log('started update sparkline  job');
    /** get supported coins */
    let coins;
    if (!_coins?.length) coins = await this.coinModel.find().lean();
    else coins = _coins;

    /** get supported currencies */
    const currencies = await this.currencyModel.find().lean();

    /** get each currency and coins*/
    for (const coin of coins) {
      for (const currency of currencies) {
        try {
          if (!coin.isFixedRate) {
            /**  get sparkline for evey coin and currency */
            const sparklines = await this.ratesHelper.getMarketChart(
              coin.coingeckoId,
              currency.code,
            );

            /** update data in db*/
            const rate = {
              spark_line_1_day: sparklines.spark_line_1_day,
              spark_line_30_day: sparklines.spark_line_30_day,
              spark_line_7_day: sparklines.spark_line_7_day,
              spark_line_90_day: sparklines.spark_line_90_day,
            };

            /** update */
            await this.ratesModel.findOneAndUpdate(
              { coinId: coin._id, currencyId: currency._id },
              rate,
              { upsert: true },
            );
          } else {
            const spark_line_1_day = await this.ratesHelper.fixedAssetSparkline(
              coin,
              1,
            );
            const spark_line_7_day = await this.ratesHelper.fixedAssetSparkline(
              coin,
              7,
            );
            const spark_line_30_day = await this.ratesHelper.fixedAssetSparkline(
              coin,
              30,
            );
            const spark_line_90_day = await this.ratesHelper.fixedAssetSparkline(
              coin,
              90,
            );
            await this.ratesModel.findOneAndUpdate(
              { coinId: coin._id, currencyId: currency._id },
              {
                spark_line_1_day,
                spark_line_7_day,
                spark_line_30_day,
                spark_line_90_day,
              },
              { upsert: true },
            );
          }
        } catch (e) {
          // safely ignore
        }
      }
    }

    // send updated data on sockets
    this.socketService.emit(
      { message: 'please get latest coin data' },
      'charts',
    );
    return;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateNetworkFee(_coins?: CoinEntity[]) {
    console.log('started update network fee');
    let coins;
    if (_coins?.length) coins = _coins;
    else coins = await this.coinModel.find().lean();

    /** get supported currencies */
    const currencies = await this.currencyModel.find().lean();

    for (const coin of coins) {
      /** get network fee */
      const networkFee = await this.getNetworkFee(coin);
      const fee = {
        networkFeeAvg: networkFee.networkFeeAvg,
        networkFeeMax: networkFee.networkFeeMax,
        networkFeeMin: networkFee.networkFeeMin,
      };

      for (const currency of currencies) {
        const updatedRate = await this.ratesModel.findOneAndUpdate(
          { coinId: coin._id, currencyId: currency._id },
          fee,
          { upsert: true },
        );
      }
    }
  }

  async getNetworkFee(coin: CoinEntity) {
    if (
      coin.isBep20 ||
      coin.isErc20 ||
      coin.coinSymbol.toLowerCase() == 'eth' ||
      coin.coinSymbol.toLowerCase() == 'bnb'
    )
      return this.ratesHelper.erc20NetworkFee();
    else return this.ratesHelper.getPriceFromBC(coin.coinSymbol);
  }

  async getAllActiveCoins() {
    return this.coinModel.find().lean();
  }

  // async onModuleInit() {
  //   this.updateRates();
  // }
}
