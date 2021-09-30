import { HttpService, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';

import { InjectModel } from '@nestjs/mongoose';
import { WalletEntity, WalletModel } from '../../entities/wallet.entity';
import { CoinDocument, CoinEntity } from '../../entities/coin.entity';
import { Model, Promise } from 'mongoose';
import * as _ from 'lodash';
import {
  TransactionModel,
  TransactionsEntity,
} from '../../entities/transactions.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import Web3 from 'web3';
import { SocketsService } from '../../webhooks/sockets.service';
import { EtherScanService } from '../etherscan.service';

@Injectable()
export class SyncEthTransactions {
  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    @InjectModel(WalletEntity.name)
    private readonly walletModel: WalletModel,
    @InjectModel(CoinEntity.name)
    private readonly coinModel: Model<CoinDocument>,
    @InjectModel(TransactionsEntity.name)
    private readonly transactionModel: TransactionModel,
    @Inject('Web3')
    private readonly web3: Web3,
    private readonly socket: SocketsService,
    private readonly etherScanService: EtherScanService,
  ) {
    // this.syncEthAddressAndTxs();
  }

  /**
   * get all eth and erc20 addresses
   */
  async getEthAddresses(): Promise<WalletEntity[]> {
    try {
      return await this.walletModel
        .find({
          $or: [{ coinSymbol: 'eth' }, { isERC20: true }],
          lastTxUpdate: {
            $lte: new Date(new Date().getTime() - 1000 * 60 * 5).toISOString(),
          },
        })
        .populate('coin')
        .lean();
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * syncAddresses this method is used to sync all ether base wallets with its blockchain using etherscan api via cron job
   */
  // @Cron(CronExpression.EVERY_MINUTE)
  async syncEthAddressAndTxs() {
    console.log('started syncing eth trxs');
    // get all erc20 and eth address
    const allWallets = await this.getEthAddresses();

    // filter out wallets whose balances are same as in our own db
    const wallets = await this.filterWalletWithUpdateBalance(allWallets);

    for (const wallet of wallets) {
      const txs = await this.etherScanService.getTxs(
        wallet.address,
        wallet.coin,
      );

      /** update last transaction update time in wallet*/
      await this.walletModel.findOneAndUpdate(
        { _id: wallet._id },
        { lastTxUpdate: new Date().toISOString() },
      );
      if (txs?.length) await this.syncTrxsWithDb(txs);
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

  /**
   * this method filters out all address whose balances are not updated
   * @param wallets
   */
  async filterWalletWithUpdateBalance(wallets: WalletEntity[]) {
    const ethWallets = wallets
      .filter((wallet) => !wallet.isERC20)
      .map((wallet) => wallet.address);
    const etherWalletBalances = await this.etherScanService.getBalance(
      ethWallets,
    );

    const transformedEthBalances = await etherWalletBalances.map((wallet) => {
      return {
        account: wallet.account,
        balance: this.web3.utils.fromWei(wallet.balance, 'ether'),
        coinSymbol: wallet.coinSymbol,
      };
    });

    // group wallets by coinId and then get ERC20 balances
    const ERC20Coins = _.groupBy(wallets, 'coin.contractAddress');
    const erc20Wallets = [];
    for (const coin of Object.keys(ERC20Coins).filter(
      (k) => k !== 'null' && k !== 'undefined',
    )) {
      const coinWithWallets = ERC20Coins[coin];
      const erc20WalletsBalances = await this.etherScanService.getBalance(
        coinWithWallets.map((wallet) => wallet.address),
        coin,
        coinWithWallets[0].coin.coinSymbol,
      );
      const transformedERC20Balances = await erc20WalletsBalances.map(
        (wallet) => {
          return {
            account: wallet.account,
            balance:
              wallet.balance /
              Math.pow(10, coinWithWallets[0].coin.decimal ?? 18),
            coinSymbol: wallet.coinSymbol,
          };
        },
      );
      erc20Wallets.push(transformedERC20Balances);
    }

    const walletBalances = transformedEthBalances.concat(...erc20Wallets);

    // filter wallets whose balances are changed
    const _wallets = wallets.filter((wallet) => {
      const _wallet = walletBalances.find(
        (w) =>
          w.account === wallet.address && w.coinSymbol === wallet.coinSymbol,
      );
      return (
        _wallet &&
        _wallet.balance !==
          String(
            wallet.coin.decimal === 1
              ? wallet.balance
              : parseFloat(wallet.balance) *
                  Math.pow(10, wallet.coin.decimal ?? 18),
          )
      );
    });

    // update balances in db
    const updatesDbPromises = [];
    for (const wallet of walletBalances) {
      const _wallet = wallets.find((w) => w.address === wallet.account);
      const _coin = _wallet.coin;
      updatesDbPromises.push(
        this.walletModel.findOneAndUpdate(
          { address: wallet.account, coinSymbol: wallet.coinSymbol },
          {
            // balance: this.web3.utils.fromWei(wallet.balance, 'ether'),
            // balance: String(wallet.balance / Math.pow(10, coinDecimal ?? 18)),
            balance: String(wallet.balance),
          },
          { new: true },
        ),
      );
    }

    const updateWallets = await Promise.all(updatesDbPromises);
    // emit to sockets
    // this.socket.emitWalletBalances(updateWallets);
    for (const wallet of updateWallets) {
      this.socket.emit({ coinSymbol: wallet.coinSymbol }, wallet.address);
    }

    return _wallets;
  }
}
