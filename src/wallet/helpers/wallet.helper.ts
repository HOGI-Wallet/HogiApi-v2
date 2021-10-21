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
import { EtherScanService } from '../../transaction/etherscan.service';
import { BscScanService } from '../../transaction/bscscan.service';

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
    @Inject('BinanceWeb3')
    private readonly binanceWeb3: Web3,
    private readonly config: ConfigService,
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
      return this.getTxCountOfAddressOnEtherScan(address);
    } else if (coinType === 'isBnb') {
      /** get balance from bscscan*/
      return this.getTxCountOfAddressOnBscScan(address);
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

  async checkBnbBalance(address): Promise<string> {
    this.http.axiosRef.defaults.headers.common['Content-Type'] =
      'application/json';
    try {
      const res = await this.http
        .get(
          this.config.bscScanApiUrl +
            '/api?module=account&action=balance' +
            '&address=' +
            address +
            '&tag=latest&apikey=' +
            this.config.bscScanApiKey,
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

  async getBep20TokenBalance(contractaddress: string, address: string) {
    this.http.axiosRef.defaults.headers.common['Content-Type'] =
      'application/json';
    try {
      const res = await this.http
        .get(
          this.config.bscScanApiUrl +
            '/api?module=account&action=tokenbalance&contractaddress=' +
            contractaddress +
            '&address=' +
            address +
            '&tag=latest&apikey=' +
            this.config.bscScanApiKey,
        )
        .toPromise();
      return res.data.result;
    } catch (e) {
      throw new Error("couldn't get erc20 balance");
    }
  }

  async getTxCountOfAddressOnEtherScan(address: string) {
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

  async getTxCountOfAddressOnBscScan(address: string) {
    try {
      const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.BSCSCAN_API_KEY}`;
      const res = await this.http.get(url).toPromise();
      if (res.data) {
        return res.data.status === '0' ? false : true;
      }
    } catch (e) {
      throw new Error("couldn't get bep20 balance");
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
    else if (coin.coinSymbol === 'bnb') coinType = 'isBnb';
    else if (coin.isErc20) coinType = 'isERC20';
    else if (coin.isBep20) coinType = 'isBEP20';
    else coinType = 'btcLike';
    return coinType;
  }

  async updateBTCLikeWalletsBalance(coin: string, address: string) {
    // get balance from blockcypher
    const balance = await this.blockcypherService.getBalance(coin, address);
    await this.walletModel.updateAddressBalance(
      address,
      String(balance.balance / Math.pow(10, 8)),
      coin,
    );
  }

  async updateEthLikeWalletsBalance(address: string, coinSymbol: string) {
    try {
      // get balance from infura
      if (coinSymbol === 'eth') {
        const balance = await this.getEthBalanceRpc(address);
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
      // get balance from infura
      const coin: CoinEntity = await this.coinModel.findOne({
        coinSymbol: new RegExp('^' + coinSymbol + '$', 'i'),
      });
      const balance = await this.getERC20BalanceRpc(
        coin.contractAbi,
        coin.contractAddress,
        address,
      );

      await this.walletModel.updateCoinBalance(
        this.web3.utils.toChecksumAddress(address.toLowerCase()),
        `${Number(balance) / Math.pow(10, coin.decimal ?? 18)}`,
        coinSymbol,
      );
    } catch (e) {
      console.log(e);
    }
  }

  async updateBnbLikeWalletsBalance(address: string, coinSymbol: string) {
    try {
      // get balance from binance data seed
      if (coinSymbol === 'bnb') {
        const balance = await this.getBscBalanceRpc(address);
        await this.walletModel.updateAddressBalance(
          this.web3.utils.toChecksumAddress(address.toLowerCase()),
          this.web3.utils.fromWei(balance, 'ether'),
          coinSymbol,
        );
      } else {
        await this.updateBEP20WalletsBalance(coinSymbol, address);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async updateBEP20WalletsBalance(coinSymbol: string, address: string) {
    try {
      const coin: CoinEntity = await this.coinModel.findOne({
        coinSymbol: new RegExp('^' + coinSymbol + '$', 'i'),
      });
      const balance = await this.getBEP20BalanceRpc(
        coin.contractAbi,
        coin.contractAddress,
        address,
      );

      await this.walletModel.updateCoinBalance(
        this.web3.utils.toChecksumAddress(address.toLowerCase()),
        `${Number(balance) / Math.pow(10, coin.decimal ?? 18)}`,
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
    if (
      coinType === 'isEth' ||
      coinType === 'isERC20' ||
      coinType === 'isBnb' ||
      coinType === 'isBEP20'
    ) {
      _balance = parseFloat(balance);
    } else if (coinType === 'btcLike') {
      _balance = parseFloat(balance);
    }
    return {
      balance: _balance,
      vs_currency_balance: _balance * coinRate,
    };
  }

  async getBalance(address: string, coin: CoinEntity) {
    try {
      const coinType = await this.getCoinType(coin);
      if (coinType === 'isEth') {
        // const ethBalance = await this.checkEtherBalance(address);
        const ethBalance = await this.getEthBalanceRpc(address);
        return this.web3.utils.fromWei(ethBalance, 'ether').toString();
      } else if (coinType === 'isERC20') {
        // const erc20Balance = await this.getErc20TokenBalance(
        //   coin.contractAddress,
        //   address,
        // );
        const erc20Balance = await this.getERC20BalanceRpc(
          coin.contractAbi,
          coin.contractAddress,
          address,
        );
        return `${Number(erc20Balance) / Math.pow(10, coin.decimal ?? 18)}`;
      } else if (coinType === 'isBnb') {
        // console.log('checking bnb balance on bscscan');
        // const bnbBalance = await this.checkBnbBalance(address);
        const bnbBalance = await this.getBscBalanceRpc(address);
        return this.web3.utils.fromWei(bnbBalance, 'ether').toString();
      } else if (coinType === 'isBEP20') {
        // console.log('checking bep20 balance on bscscan');
        // const bep20Balance = await this.getBep20TokenBalance(
        //   coin.contractAddress,
        //   address,
        // );
        const bep20Balance = await this.getBEP20BalanceRpc(
          coin.contractAbi,
          coin.contractAddress,
          address,
        );
        return `${Number(bep20Balance) / Math.pow(10, coin.decimal ?? 18)}`;
      } else {
        const altcoinBalance = await this.blockcypherService.getBalance(
          coin.coinSymbol,
          address,
        );
        return String(altcoinBalance?.balance / Math.pow(10, 8));
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
      return 'btc/test3';
    } else {
      return symbol + '/main';
    }
  }

  async getEthBalanceRpc(walletAddress: string) {
    const balance = await this.web3.eth.getBalance(walletAddress);
    return String(balance);
  }

  async getERC20BalanceRpc(
    tokenABI,
    contractAddress: string,
    walletAddress: string,
  ) {
    const contract = new this.web3.eth.Contract(tokenABI, contractAddress);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    return String(balance);
  }

  async getBscBalanceRpc(walletAddress: string) {
    const balance = await this.binanceWeb3.eth.getBalance(walletAddress);
    return String(balance);
  }

  async getBEP20BalanceRpc(
    tokenABI,
    contractAddress: string,
    walletAddress: string,
  ) {
    const contract = new this.binanceWeb3.eth.Contract(
      tokenABI,
      contractAddress,
    );
    const balance = await contract.methods.balanceOf(walletAddress).call();
    return String(balance);
  }
}
