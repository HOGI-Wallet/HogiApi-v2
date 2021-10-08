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
import { CoinBalanceDto } from './dto/coin-balance.dto';
import { TransactionHelper } from '../transaction/helpers/transaction.helper';
import {
  TransactionsDocument,
  TransactionsEntity,
} from '../entities/transactions.entity';

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
    private readonly moralisService: MoralisService, // private readonly transactionHelper: TransactionHelper,
    @InjectModel(TransactionsEntity.name)
    private readonly transactionModel: Model<TransactionsDocument>,
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

  async createTX(tx: TransactionsEntity) {
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
  transformBCTx(
    coinSymbol: string,
    tx,
    toAddress?: string,
  ): TransactionsEntity {
    if (!toAddress) {
      toAddress = tx.outputs[0].addresses[0];
    }
    return {
      coinSymbol,
      confirmations: tx.confirmations ?? 0,
      explorer: 'blockcypher',
      explorerUrl: tx.hash,
      fee: tx.fees,
      from: tx.inputs[0].addresses[0],
      timeStamp: tx.received,
      to: toAddress,
      txId: tx.hash,
      blockHeight: tx.block_height,
      //assuming p2pkh transaction from (and output consist one output)
      // amount: String(
      //   tx.outputs.find((out) => out?.addresses.includes(toAddress))?.value /
      //     Math.pow(10, 8),
      // ),
      amount: String(tx.outputs[0]?.value / Math.pow(10, 8)),
    };
  }

  async updateTxHistory(txs: any, coinSymbol: string, address: string) {
    txs.map(async (tx) => {
      await this.createTX(this.transformBCTx(coinSymbol, tx, address));
    });
  }

  async getMyWalletBalanceFromAllCoins(coinBalanceData: CoinBalanceDto) {
    const coinRates = await this.ratesModel
      .find({ currencyCode: coinBalanceData.currencyCode.toUpperCase() })
      .lean();
    let coinBalancesAdded = [];
    for (const data of coinBalanceData.walletsInfo) {
      const ratesInfo = await coinRates.find(
        (coin) => coin.coinSymbol === data.coinSymbol,
      );
      let walletInfo;
      if (data.coinSymbol === 'btc' || data.coinSymbol === 'doge') {
        const history = await this.blockcypherService.getHistory(
          data.coinSymbol,
          data.address,
        );
        const final_balance = String(history?.final_balance / Math.pow(10, 8));

        /**
         * update transactions history
         */
        this.updateTxHistory(history?.txs, data.coinSymbol, data.address);
        /**
         * update balance
         */
        await this.walletModel.findOneAndUpdate(
          { address: data.address, coinSymbol: data.coinSymbol },
          { balance: final_balance },
        );
        walletInfo = {
          balance: final_balance,
        };
      } else {
        walletInfo = await this.walletModel
          .findOne({ address: data.address, coinSymbol: data.coinSymbol })
          .lean();
      }

      const balance = await this.walletHelper.balanceInOtherCurrency(
        data.coinSymbol,
        ratesInfo?.rate ?? 0,
        walletInfo?.balance ?? 0,
      );
      coinBalancesAdded.push({
        coinSymbol: data.coinSymbol,
        address: data.address,
        ...balance,
      });
    }
    return coinBalancesAdded;
  }
}
