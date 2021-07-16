import { BadRequestException, HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { ECPair, script, Transaction } from 'bitcoinjs-lib';
import { IBalanceEndPointResponse } from './types/interfaces/api.responses';
import { BlockExplorerUtils } from '../globals/utils/blockExplorerUtils';
import { WalletHelper } from '../wallet/helpers/wallet.helper';

function delay(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}
@Injectable()
export class BlockcypherService {
  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  public static convertTestCoinsForBC(coinSymbol: string) {
    if (coinSymbol.match(new RegExp('test', 'i')))
      return coinSymbol.slice(0, coinSymbol.length - 4);
    else return coinSymbol;
  }
  /**
   * buildApiUrl
   */
  public static buildApiUrl(coin, endpoint) {
    const url = `${process.env.BLOCKCYPHER_URL}/${
      process.env.BLOCKCYPHER_API_VERSION
    }/${WalletHelper.BCNetwork(coin)}/${endpoint}?token=${
      process.env.BLOCKCYPHER_API_TOKEN
    }`;
    return url;
  }

  async get(url: string, context: string) {
    try {
      await delay(0.5);
      return (await this.http.get(url).toPromise()).data;
    } catch (e) {
      console.log('error occurred at ', context, ' ', e.message);
    }
  }

  async getTxCountOfAddress(address: string, coinSymbol: string) {
    try {
      const tx = await this.http
        .get(
          BlockcypherService.buildApiUrl(
            coinSymbol,
            `addrs/${address}/balance`,
          ),
        )
        .toPromise();
      return tx.data?.n_tx;
    } catch (e) {
      throw new Error("couldn't get balance transactions");
    }
  }

  async registerWebhook(address: string, coinSymbol: string) {
    // register the coin webhook on blockcypher
    // TODO register for confirmed tx event
    const data = {
      event: 'unconfirmed-tx',
      address,
      url: `${this.config.webhookCallbackBaseUrl}/webhooks/blockCypher/hooks/callback/${coinSymbol}/${address}`,
    };

    try {
      const endpoint = 'hooks';
      const res = await this.http
        .post(BlockcypherService.buildApiUrl(coinSymbol, endpoint), data)
        .toPromise();
      return res.data;
    } catch (e) {
      console.log('error creating webhook: ', e.message);
    }
  }

  /**
   * @returns tx hash to be signed locally and then submitting the tx;
   * @param from
   * @param to
   * @param amount in satoshis
   * @param symbol is coin(btc and altcoins) symbol
   * TODO satoshi conversions
   */
  async createNewTx(
    symbol: string,
    from: string,
    to: string,
    amount: number,
  ): Promise<NewTXEndPoint.INewTx> {
    const body = {
      inputs: [{ addresses: [from] }],
      outputs: [{ addresses: [to], value: amount }],
    };

    try {
      const tx = await this.http
        .post(BlockcypherService.buildApiUrl(symbol, 'txs/new'), body)
        .toPromise();

      return tx.data;
    } catch (e) {
      // create log in the db for api failed
      throw new Error(
        JSON.stringify({
          message: "couldn't get transaction to sign",
          data: e.response?.data?.errors ?? e.response?.data?.error,
        }),
      );
    }
  }

  /**
   *
   * @param tx is returned from `createNewTx` method
   * @param privateKey
   */
  signTx(
    tx: NewTXEndPoint.INewTx,
    privateKey: string,
  ): { pubKeys: string[]; signatures: string[] } {
    const keys = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    const pubKeys = [];
    const signatures = tx.tosign.map((toSign) => {
      pubKeys.push(keys.publicKey.toString('hex'));
      const signature = keys.sign(Buffer.from(toSign, 'hex'));
      const encodedSignature = script.signature.encode(
        signature,
        Transaction.SIGHASH_ALL,
      );
      return encodedSignature.toString('hex').slice(0, -2);
    });

    return { pubKeys, signatures };
  }

  async sendSignedTx(
    tx: NewTXEndPoint.INewTx,
    signatures: string[],
    pubKeys: string[],
    symbol: string,
  ) {
    const body = {
      tx,
      pubKeys,
      signatures,
    };

    try {
      const submitted = await this.http
        .post(BlockcypherService.buildApiUrl(symbol, 'txs/send'), body)
        .toPromise();
      return submitted.data;
    } catch (e) {
      throw new Error(
        JSON.stringify({
          message: 'submitting signed transaction failed',
          data: e.response?.data?.errors ?? e.response?.data?.error,
        }),
      );
    }
  }

  /**
   * if the coin is not erc20, the we have to h=get prices from blockcypher
   * @param coin
   */
  async getPriceFromBC(coin) {
    const url = BlockcypherService.buildApiUrl(coin, '');
    const response = await this.http.get(url).toPromise();
    if (response.data) {
      const data = response.data;
      const appendZeros = Math.pow(10, 8);
      const networkFeeMin = data.low_fee_per_kb / appendZeros;
      const networkFeeAvg = data.medium_fee_per_kb / appendZeros;
      const networkFeeMax = data.high_fee_per_kb / appendZeros;
      return { networkFeeAvg, networkFeeMax, networkFeeMin };
    }
  }

  async getBalance(
    coinSymbol: string,
    address: string,
  ): Promise<IBalanceEndPointResponse> {
    try {
      return await this.get(
        BlockcypherService.buildApiUrl(coinSymbol, `addrs/${address}/balance`),
        'getBalance',
      );
    } catch (e) {
      throw new Error("couldn't get balance from blockcypher");
    }
  }

  async getTxDetails(coin: string, txhash: string) {
    try {
      return (
        await this.http
          .get(BlockcypherService.buildApiUrl(coin, `txs/${txhash}`))
          .toPromise()
      ).data;
    } catch (e) {
      throw new Error("couldn't get tx details from blockypher");
    }
  }
}
