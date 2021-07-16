import coininfo from 'coininfo';
export class BlockExplorerUtils {
  static getInforUrl(coinSymbol, hash) {
    try {
      coinSymbol = coinSymbol.toUpperCase();
      let isErc20 = true;
      const blockCypherCoins = ['BTC', 'LTC', 'DOGE', 'DASH', 'BTCTEST'];
      if (blockCypherCoins.includes(coinSymbol)) {
        isErc20 = false;
      }

      const bcypherBaseUrl = 'https://live.blockcypher.com/';
      let result;
      if (process.env.NODE_ENV !== 'production') {
        //} process.env.VUE_APP_ENVIRONMENT == "DEV") {
        if (isErc20) {
          result = 'https://rinkeby.etherscan.io/tx/' + hash;
        } else {
          result =
            bcypherBaseUrl +
            `${BlockExplorerUtils.blockCypherNet(coinSymbol)}/tx/` +
            hash;
        }
      } else {
        if (isErc20) {
          result = 'https://etherscan.io/tx/' + hash;
        } else {
          result = bcypherBaseUrl + coinSymbol.toLowerCase() + '/tx/' + hash;
        }
      }
      return result;
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * block cypher has different nets for block explorer
   * @param coinSymbol
   */
  static blockCypherNet(coinSymbol: string) {
    if (process.env.NODE_ENV === 'development') {
      if (coinSymbol.toLowerCase() === 'btc') return 'btc-testnet';
      else return 'bcy';
    } else return coinSymbol.toLowerCase();
  }

  static getBCTestCoin(coinSymbol) {
    const coin = coininfo(coinSymbol);
    /** if btc like coin and is test coin the return bcy */
    if (coinSymbol === 'btc-test') return 'btctest';
    if (coin && coinSymbol !== 'btc-test' && coinSymbol.includes('test'))
      return 'bcy';
    else return coinSymbol;
  }

  static getBCTestCoinForBC(coinsymbol) {
    if (coinsymbol === 'btctest') return 'btc';
    else return coinsymbol;
  }

  static getBCNetwork(coinSymbol) {
    if (coinSymbol === 'bcy') return 'test';
    if (coinSymbol === 'btctest') return 'test3';
    if (!coinSymbol.includes('test')) return 'main';
  }
}
