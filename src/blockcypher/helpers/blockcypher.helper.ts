import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { WalletHelper } from '../../wallet/helpers/wallet.helper';

@Injectable()
export class BlockcypherHelper {
  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}
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

  async registerWebhook(address: string, coinSymbol: string) {
    // register the coin webhook on blockcypher
    // TODO register for confirmed tx event
    const data = {
      event: 'unconfirmed-tx',
      address,
      url: `${this.config.webhookCallbackBaseUrl}/webhooks/${coinSymbol}`,
    };

    try {
      const endpoint = 'hooks';
      const res = await this.http
        .post(BlockcypherHelper.buildApiUrl(coinSymbol, endpoint), data)
        .toPromise();
      return res.data;
    } catch (e) {
      console.log('error creating webhook: ', e.message);
    }
    // store webhook in firestore webhooks collection. where public key as user id
  }

  async getBalance(coin: string, address: string) {
    try {
      const url = BlockcypherHelper.buildApiUrl(coin, `addr/${address}`);
      const res = await this.http.get(url).toPromise();
      return res.data?.balance;
    } catch (e) {
      throw new Error("couldn't get balance");
    }
  }
}
