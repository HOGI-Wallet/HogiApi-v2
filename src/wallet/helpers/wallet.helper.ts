import { forwardRef, HttpService, Inject, Injectable } from '@nestjs/common';
import { BlockcypherService } from '../../blockcypher/blockcypher.service';
import { CoinDocument, CoinEntity } from '../../entities/coin.entity';
import { isInstance } from 'class-validator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { address } from 'bitcoinjs-lib';
import { WalletEntity, WalletModel } from '../../entities/wallet.entity';
import Web3 from 'web3';
import { BlockExplorerUtils } from '../../globals/utils/blockExplorerUtils';
import coininfo from 'coininfo';
import { ConfigService } from '../../config/config.service';
import { EtherScanService } from '../../transaction/ether-scan.service';

@Injectable()
export class WalletHelper {
  constructor(
    @InjectModel(CoinEntity.name)
    private readonly coinModel: Model<CoinDocument>,
    @Inject(forwardRef(() => BlockcypherService))
    private readonly blockcypherService: BlockcypherService,
    @InjectModel(WalletEntity.name)
    private readonly walletModel: WalletModel,
    private readonly http: HttpService,
    @Inject('Web3')
    private readonly web3: Web3,
    private readonly config: ConfigService,
    private readonly etherScanService: EtherScanService,
  ) {}

  /**
   *
   * @param coinType is used to identify from we need to get balance of that address
   * @param address
   */
  async checkIfAccountHasTxs(
    coinType: string,
    address: string,
    coinSymbol: string,
    contractAddress?: string,
  ) {
    if (coinType === 'isEth') {
      /** get balance from etherscan*/
      return this.getTxCountOfAddress(address);
    } else if (coinType === 'btcLike') {
      /** ge balance from blockcypher*/
      return this.blockcypherService.getTxCountOfAddress(address, coinSymbol);
    } else if (coinType === 'stellar') {
      /** get balance from stellar  */
    }
  }

  async checkEtherBalance(address): Promise<string> {
    this.http.axiosRef.defaults.headers.common['Content-Type'] =
      'application/json';
    try {
      const res = await this.http
        .get(
          this.config.etherScanApiUrl +
            '/api?module=account&action=balance' +
            '&address=' +
            address +
            '&tag=latest&apikey=' +
            this.config.etherScanApiKey,
        )
        .toPromise();
      return res.data.result;
    } catch (e) {
      throw new Error("couldn't get ether balance");
    }
  }

  async getErc20TokenBalance(contractaddress: string, address: string) {
    this.http.axiosRef.defaults.headers.common['Content-Type'] =
      'application/json';
    try {
      const res = await this.http
        .get(
          this.config.etherScanApiUrl +
            '/api?module=account&action=tokenbalance&contractaddress=' +
            contractaddress +
            '&address=' +
            address +
            '&tag=latest&apikey=' +
            this.config.etherScanApiKey,
        )
        .toPromise();
      return res.data.result;
    } catch (e) {
      throw new Error("couldn't get erc20 balance");
    }
  }

  async getTxCountOfAddress(address: string) {
    try {
      const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.ETHERSCAN_API_KEY}`;
      const res = await this.http.get(url).toPromise();
      if (res.data) {
        return res.data.status === '0' ? false : true;
      }
    } catch (e) {
      throw new Error("couldn't get erc20 balance");
    }
  }

  async getCoinType(coin: CoinEntity | string) {
    if (coin?.hasOwnProperty('_id')) {
      return this.getCoinBlockchain(coin as CoinEntity);
    } else {
      const coininfo: CoinEntity = await this.coinModel.findOne({
        coinSymbol: new RegExp(BlockExplorerUtils.getBCTestCoin(coin), 'i'),
      });
      return this.getCoinBlockchain(coininfo);
    }
  }

  getCoinBlockchain(coin: CoinEntity) {
    let coinType;
    if (coin.coinSymbol == 'xlm') coinType = 'xlm';
    else if (coin.coinSymbol === 'eth') coinType = 'isEth';
    else if (coin.isErc20) coinType = 'isERC20';
    else coinType = 'btcLike';
    return coinType;
  }

  async updateBTCLikeWalletsBalance(coin: string, address: string) {
    // get balance from blockcypher
    const balance = await this.blockcypherService.getBalance(coin, address);
    await this.walletModel.updateAddressBalance(
      address,
      // String(balance.final_balance),
      String(balance.final_balance / Math.pow(10, 8)),
      coin,
    );
  }

  async updateEthLikeWalletsBalance(address: string, coinSymbol: string) {
    try {
      // get balance from infura
      if (coinSymbol === 'eth') {
        const balance = await this.web3.eth.getBalance(address);
        await this.walletModel.updateAddressBalance(
          this.web3.utils.toChecksumAddress(address.toLowerCase()),
          this.web3.utils.fromWei(balance, 'ether'),
          coinSymbol,
        );
      } else {
        await this.updateERC20WalletsBalance(coinSymbol, address);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async updateERC20WalletsBalance(coinSymbol: string, address: string) {
    try {
      // get balance from infuraupdateERC20WalletsBalance

      const coin: CoinEntity = await this.coinModel.findOne({
        coinSymbol: new RegExp('^' + coinSymbol + '$', 'i'),
      });
      const contract = new this.web3.eth.Contract(
        coin.contractAbi,
        coin.contractAddress,
      );
      const balance = await this.etherScanService.getERC20Balance(
        address,
        coin.contractAddress,
      );

      await this.walletModel.updateCoinBalance(
        this.web3.utils.toChecksumAddress(address.toLowerCase()),
        `${balance / Math.pow(10, coin.decimal ?? 18)}`,
        coinSymbol,
      );
    } catch (e) {
      console.log(e);
    }
  }

  async balanceInOtherCurrency(
    coinSymbol: string,
    coinRate: number,
    balance: string,
  ) {
    const coinType = await this.getCoinType(coinSymbol);
    let _balance;
    if (coinType === 'isEth' || coinType === 'isERC20')
      _balance = parseFloat(balance);
    else if (coinType === 'btcLike')
      _balance = parseFloat(balance) / Math.pow(10, 8);

    // balance in vs_currency
    return {
      balance: _balance,
      vs_currency_balance: _balance * coinRate,
    };
  }

  async getBalance(address: string, coin: CoinEntity) {
    try {
      const coinType = await this.getCoinType(coin);
      if (coinType === 'isEth') {
        const ethBalance = await this.checkEtherBalance(address);
        return this.web3.utils.fromWei(ethBalance, 'ether').toString();
      } else if (coinType === 'isERC20') {
        const erc20Balance = await this.getErc20TokenBalance(
          coin.contractAddress,
          address,
        );
        return this.web3.utils.fromWei(erc20Balance, 'ether').toString();
      } else {
        const altcoinBalance = await this.blockcypherService.getBalance(
          coin.coinSymbol,
          address,
        );
        return String(altcoinBalance?.final_balance);
      }
    } catch (e) {
      console.log(e);
      return '0';
    }
  }

  static btcLikeAddressVersion(symbol) {
    if (process.env.NODE_ENV === 'development') {
      if (symbol !== 'btc') {
        return 0x1b;
      } else {
        const coin = coininfo(symbol + '-test');
        return coin.versions.public;
      }
    } else {
      const coin = coininfo(symbol);
      return coin.versions.public;
    }
  }

  static BCNetwork(symbol) {
    if (process.env.NODE_ENV === 'development') {
      return 'bcy/test';
    } else {
      return symbol + '/main';
    }
  }
}
