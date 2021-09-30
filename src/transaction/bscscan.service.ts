import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import * as _ from 'lodash';
import { CoinEntity } from '../entities/coin.entity';
function delay(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}
@Injectable()
export class BscScanService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * this is wrapper around http get, every get requset in this class will use this
   * @param url
   * @param params
   */
  async get(url: string, context: any) {
    try {
      await delay(1);
      const response = (await this.http.get(url).toPromise()).data;

      /** handling rate limit here */
      if (response.message && response.message !== 'OK') {
        // console.log(
        //   'error occured in bscscan get API at : ',
        //   context,
        //   url,
        //   response.message,
        //   response.result,
        // );
        delay(5);
        return;
      }

      return response;
    } catch (e) {
      console.log('BscScan get Request: ', e.message);
    }
  }

  /**
   * this method will get balance of addresses
   * @param contractAddress, if contractAddress is given it means we need to get balances of contract
   * @param addresses used to batch the request, etherscan allows 20 addresses to batch, but in getting contract balnce we cant batch
   * */
  async getBalance(
    addresses: string[],
    contractAddress?: string,
    coinSymbol?: string,
  ): Promise<any[]> {
    if (contractAddress) {
      // get bep20 balance
      return await this.getBEP20BalanceForAllAddresses(
        addresses,
        contractAddress,
        coinSymbol,
      );
    } else {
      // get bnb balance
      return await this.getBnbBalanceForAllAddresses(addresses);
    }
  }

  /**
   * max 20 addresses
   * @param addresses
   */
  async getBnbBalance(addresses: string[]) {
    if (addresses.length > 20) {
      return null;
    }
    const addressesString = addresses.join(',');

    const urlForBalance =
      this.config.bscScanApiUrl +
      '/api?module=account&action=balancemulti&address=' +
      addressesString +
      '&tag=latest&apikey=' +
      this.config.bscScanApiKey;

    try {
      return (await this.get(urlForBalance, 'getBnbBalance'))?.result.map(
        (account) => ({
          ...account,
          coinSymbol: 'bnb',
        }),
      );
    } catch (e) {
      console.log('Error getting Bnb Balance: ', e);
    }
  }

  /**
   * this method will create chunk of 20 addresses, and batch them on etherscan
   * @param addresses
   */
  async getBnbBalanceForAllAddresses(addresses: string[]) {
    let accounts = [];
    const chunks = _.chunk(addresses, 20);
    for (const chunk of chunks) {
      const account = await this.getBnbBalance(chunk);
      if (account) accounts = accounts.concat(...account);
    }
    return accounts;
  }

  async getBEP20Balance(address: string, contractAddress: string) {
    const url =
      this.config.bscScanApiUrl +
      '/api?module=account&action=tokenbalance&contractaddress=' +
      contractAddress +
      '&address=' +
      address +
      '&tag=latest&apikey=' +
      this.config.bscScanApiKey;
    try {
      return (await this.get(url, 'getBEP20Balance'))?.result;
    } catch (e) {
      console.log('Get Contract Balance failed', e);
    }
  }

  /**
   * this method gets all balances of ERC20
   * @param addresses
   * @param contractAddress
   */
  async getBEP20BalanceForAllAddresses(
    addresses: string[],
    contractAddress: string,
    coinSymbol,
  ) {
    const accounts = [];
    for (const address of addresses) {
      const balance = await this.getBEP20Balance(address, contractAddress);
      if (balance) accounts.push({ account: address, balance, coinSymbol });
    }
    return accounts;
  }

  /**
   * @param address
   * @param filterErc20
   */
  async getBnbTxs(address: string) {
    const url =
      this.config.bscScanApiUrl +
      '/api?module=account&action=txlist&address=' +
      address +
      '&startblock=0&endblock=99999999&sort=asc&apikey=' +
      this.config.bscScanApiKey;

    try {
      return (await this.get(url, 'getBnbTxs'))?.result;
    } catch (e) {
      console.log('error getting Bnb transactions for address');
    }
  }

  async getBEP20Txs(address: string, contractAddress: string) {
    const url =
      this.config.bscScanApiUrl +
      '/api?module=account&action=tokentx&contractaddress=' +
      contractAddress +
      '&address=' +
      address +
      '&page=1&offset=1000&sort=asc&apikey=' +
      this.config.bscScanApiKey;

    try {
      return (await this.get(url, 'getBEP20Txs'))?.result;
    } catch (e) {
      console.log('error getting BEP20 transactions for address');
    }
  }

  /**
   * this method will take txs input returned form calling ethereumTxs or ERC20 txs
   * @param txs
   */
  async transformTxs(
    txs: any[],
    address: string,
    coin: CoinEntity,
  ): Promise<any[]> {
    return txs.map((trx) => ({
      coinSymbol: coin.coinSymbol,
      amount: trx.value / Math.pow(10, coin.decimal ?? 18),
      timeStamp: new Date(trx.timeStamp * 1000),
      infoURL: this.config.bscScanExplorerUrl + '/tx/' + trx.hash,
      confirmations: trx.confirmations ?? 0,
      from: trx.from.toLowerCase(),
      to: trx.to.toLowerCase(),
      txId: trx.hash,
      blockHeight: String(trx.blockNumber).includes('x')
        ? parseInt(trx.blockNumber, 16) // sometimes its hex, other times its not
        : trx.blockNumber,
      explorer: 'bscscan',
      explorerUrl: trx.hash,
    }));
  }

  async getTxs(address: string, coin?: CoinEntity): Promise<any[]> {
    let txs;
    if (coin?.contractAddress) {
      txs = await this.getBEP20Txs(address, coin.contractAddress);
    } else {
      txs = await this.getBnbTxs(address);
    }
    if (txs) return await this.transformTxs(txs, address, coin);
    else return [];
  }

  async getBnbTransactionByHash(txHash: string) {
    const url =
      this.config.bscScanApiUrl +
      '/api?module=proxy&action=eth_getTransactionByHash&txhash=' +
      txHash +
      '&apikey=' +
      this.config.bscScanApiKey;

    try {
      return (await this.get(url, 'getBnbTransactionByHash'))?.result;
    } catch (e) {}
  }

  async getTxReceipt(txHash: string): Promise<string> {
    try {
      const url =
        this.config.bscScanApiUrl +
        '/api?module=transaction&action=gettxreceiptstatus&txhash=' +
        txHash +
        '&apikey=' +
        this.config.bscScanApiKey;
      return (await this.get(url, 'getTxReceipt'))?.result.status === '1'
        ? 'Pass'
        : 'Fail';
    } catch (e) {}
  }

  async getLatestBlock() {
    try {
      const url =
        this.config.bscScanApiUrl +
        '/api?module=proxy&action=eth_blockNumber&apikey=' +
        this.config.bscScanApiKey;
      const blockNumber = (await this.get(url, 'getLatestBlock'))?.result;
      // block number is in hex
      return parseInt(blockNumber, 16);
    } catch (e) {
      console.log('getting latest block failed', e.message);
    }
  }
}
