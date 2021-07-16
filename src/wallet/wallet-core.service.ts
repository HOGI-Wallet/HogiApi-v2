import { Injectable } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { WalletInterface } from './types/wallet.interface';
import { BlockcypherService } from '../blockcypher/blockcypher.service';
import bip44Constants from 'bip44-constants';
import * as bip39 from 'bip39';
import crypto from 'crypto';
import HDKey from 'hdkey';
import coininfo from 'coininfo';
import wif from 'wif';
import { createHash } from 'crypto';
import bs58check from 'bs58check';
import { Address } from 'ethereumjs-util';
import StellarHDWallet from 'stellar-hd-wallet';
import { derivePath, getMasterKeyFromSeed, getPublicKey } from 'ed25519-hd-key';
import { Wallet } from 'ethers';
import { InjectModel } from '@nestjs/mongoose';
import { CoinDocument, CoinEntity } from '../entities/coin.entity';
import { Model } from 'mongoose';
import { WalletHelper } from './helpers/wallet.helper';
import { CreatePublicinfoDto } from './dto/create-publicinfo.dto';
import { WalletDocument, WalletEntity } from '../entities/wallet.entity';
import { EtherScanService } from '../transaction/ether-scan.service';
import { address } from 'bitcoinjs-lib';

/**
 * this service is responsible for creating HD wallets
 * supported coins
 *  bitcoin (btc)
 *  litecoin (ltc)
 *  dash (dash)
 *  dogecoin (dosge)
 *  ethereum /erc20 (eth)
 *  stellar (xlm)
 */

export const SigningAlgo = {
  ECDSA: 'ECDSA',
  EdDSA: 'EdDSA', //used in stellar
};

@Injectable()
export class WalletCore {
  constructor(
    @InjectModel(CoinEntity.name)
    private readonly coinModel: Model<CoinDocument>,
    @InjectModel(WalletEntity.name)
    private readonly walletModel: Model<WalletDocument>,
    private readonly blockcypherService: BlockcypherService,
    private readonly walletHelper: WalletHelper,
    private readonly etherScanService: EtherScanService,
  ) {}
  static hdPath(symbol: string, account_index = 0): string {
    const coinType = bip44Constants.findIndex(
      (item) => item[1] === symbol.toUpperCase(),
    );
    if (~coinType) {
      return `m/44'/${coinType}'/0'/0/${account_index}`;
    } else {
      throw new Error('not bip44 compliant');
    }
  }

  static hardenHdPath(symbol): string {
    const coinType = bip44Constants.findIndex((item) => item[1] === symbol);
    return `m/44'/${coinType}'/0'`;
  }

  static generateSeed(mnemonic?: string): Buffer {
    if (mnemonic) {
      return bip39.mnemonicToSeedSync(mnemonic);
    } else {
      /** create 512 bytes random seed*/
      return crypto.randomBytes(512);
    }
  }

  /**
   * generate master wallet from seed
   * we will use this master wallet to derive private/public keys
   * @param seed
   */
  static generateMasterHdWallet(seed: Buffer, symbol) {
    /**
     * version to prefix public and private keys for altcoins
     */
    const version = coininfo(symbol);

    /**
     * version for altcoins to get public priavte addresses
     * in case ethereum coins, ignore the version
     * */
    const hdkey = HDKey.fromMasterSeed(seed, version?.bip32);
    return hdkey;
  }

  /**
   * if not generating for altcoins, ignore the versions
   * @param masterWallet
   * @param path
   */
  static generateChild(masterWallet, path: string) {
    return masterWallet.derive(path);
  }

  /**
   * version
   * @param privateKey
   * @param version
   */
  static privateKeyToWif(privateKey, version, compressed = true) {
    return wif.encode(version, privateKey, compressed);
  }

  static deriveBtcLikeAddress(publicKey, symbol) {
    const sha256 = createHash('sha256').update(publicKey).digest();
    const rmd160 = createHash('rmd160').update(sha256).digest();

    const buffer = Buffer.allocUnsafe(21);
    /** get coin symbol to get version */
    const coin = coininfo(symbol);

    /** to support blockcypher testnet, all altcoins except btc test will have version byte 0x1B */
    const version = WalletHelper.btcLikeAddressVersion(symbol);
    buffer.writeUInt8(version, 0);

    rmd160.copy(buffer, 1);
    const address = bs58check.encode(buffer);
    return address;
  }

  /**
   * this method is used to create deposit addresses for each coin
   * @param symbol
   */
  static createECDSA(symbol: string, mnemonic: string, hdPath?: string) {
    /** get coin info */
    const coin = coininfo(symbol);
    /** step-1 generate seed */
    const seed = WalletCore.generateSeed(mnemonic);
    /** step-2 create master wallet */
    const masterWallet = WalletCore.generateMasterHdWallet(seed, symbol);
    /** step-3 get derivation path, this path wil return only 1 child */
    let path;
    if (coin?.testnet) path = WalletCore.hdPath('');
    else path = WalletCore.hdPath(symbol);
    /** overwrite the derivation path, use in account discovery */
    if (hdPath) path = hdPath;
    /** step-4 get child*/
    const child = WalletCore.generateChild(masterWallet, path);

    /** encode private keys wif format
     * https://en.bitcoin.it/wiki/Wallet_import_format
     * */
    if (coin) {
      const wif = WalletCore.privateKeyToWif(
        child.privateKey,
        coin.versions.private,
        true,
      );
      return {
        wif,
        path,
        _publicKey: child._publicKey.toString('hex'),
        _privateKey: child._privateKey.toString('hex'),
        seed: seed.toString('hex'),
        address: WalletCore.deriveBtcLikeAddress(child._publicKey, symbol),
      };
    } else {
      return {
        /** ignore versions*/
        path,
        seed: seed.toString('hex'),
        _publicKey: child._publicKey.toString('hex'),
        _privateKey: child._privateKey.toString('hex'),
        address: Address.fromPrivateKey(child._privateKey).toString(),
      };
    }
  }

  /**
   * not using anywhere
   * hardened key derivation
   * @param symbol
   */
  static createEdDSA(symbol) {
    const seed = WalletCore.generateSeed().toString('hex');
    const path = this.hardenHdPath(symbol);
    const { key, chainCode } = derivePath(path, seed);
    const pub = getPublicKey(key);
    return {
      key,
      path: '',
      chainCode,
      pub,
    };
  }
  /**
   *
   * @param symbol
   * @param algo
   */
  static createHdWallet(
    symbol: string,
    mnemonic: string,
    path?: string,
    algo = SigningAlgo.ECDSA,
  ): WalletInterface {
    /** use stellar sdk for keys */
    if (symbol.toLowerCase() === 'xlm') {
      const seed = WalletCore.generateSeed(mnemonic);

      return WalletCore.createStellarHdWallet(seed, path);
    }
    if (algo === SigningAlgo.ECDSA) {
      return WalletCore.createECDSA(symbol, mnemonic, path);
    }
  }

  static createStellarHdWallet(
    seed?: Buffer | string,
    path?: string,
  ): WalletInterface {
    const wallet = StellarHDWallet.fromSeed(seed);
    return {
      seed: seed.toString('hex'),
      path: path ?? `m/44'/148'/0'`,
      _publicKey: wallet.getPublicKey(0),
      _privateKey: wallet.getSecret(0),
      address: wallet.getPublicKey(0),
    };
  }

  async accountDiscovery(coinSymbol: string, mnemonic: string) {
    /** get coin info , this info will be used to use the underlying sdk for account recovery*/
    const coin: CoinEntity = await this.coinModel
      .findOne({
        coinSymbol: coinSymbol.toLowerCase(),
      })
      .lean();
    let coinType;

    if (coinSymbol == 'xlm') coinType = 'xlm';
    else if (coinSymbol === 'eth' || coin?.isErc20) coinType = 'isEth';
    else coinType = 'btcLike';

    /** create external chaincode addresses here */

    const GAP_LIMIT = 20;
    for (let i = 0; i < GAP_LIMIT; i++) {
      const path = WalletCore.hdPath(
        coinSymbol.includes('test') ? '' : coinSymbol,
        i,
      );
      const wallet = WalletCore.createHdWallet(coinSymbol, mnemonic, path);
      const tx = await this.walletHelper.checkIfAccountHasTxs(
        coinType,
        wallet.address,
        'btc',
      );
      if (tx) {
        return wallet;
      }
    }
    /** if not found than returns first child  */
    const path = WalletCore.hdPath(
      coinSymbol.includes('test') ? '' : coinSymbol,
    );
    const wallet = WalletCore.createHdWallet(coinSymbol, mnemonic, path);
    return wallet;
  }

  async accountRecovery(
    coin: CoinEntity,
    mnemonic: string,
    iteration = 2,
    validAddress: WalletInterface | null,
    accountIndex = 0,
  ) {
    if (coin.isErc20) {
      coin.coinSymbol = 'eth';
    }
    if (iteration <= 0) return validAddress;

    const newAddress = await this.createAddress(coin, accountIndex, mnemonic);
    const isValidAddress = await this.checkValidAddress(
      coin,
      newAddress.address,
    );
    if (!isValidAddress) {
      /** valid address is null for first time*/
      if (!validAddress) validAddress = newAddress;

      return await this.accountRecovery(
        coin,
        mnemonic,
        --iteration,
        validAddress,
        ++accountIndex,
      );
    } else {
      return newAddress;
    }
  }

  async createAddress(
    coin: CoinEntity,
    accountIndex: number,
    mnemonic: string,
  ): Promise<WalletInterface> {
    if (coin.isErc20) {
      coin.coinSymbol = 'eth';
    }
    return WalletCore.createHdWallet(coin.coinSymbol, mnemonic);
  }

  /**
   * this method will check if that address has any transactions on blockchain
   * @param coin
   * @param address
   */
  async checkValidAddress(coin: CoinEntity, address: string) {
    const coinType = await this.walletHelper.getCoinType(coin);
    if (coinType === 'isEth' || coinType === 'isERC20') {
      const txs = await this.etherScanService.getEthereumTxs(address);
      return txs?.length > 0 ? true : false;
    } else {
      const txs = await this.blockcypherService.getTxCountOfAddress(
        address,
        coin.coinSymbol,
      );
      return txs > 0 ? true : false;
    }
  }

  async addPublicInfo(data: CreatePublicinfoDto) {
    const coin = await this.coinModel
      .findOne({ coinSymbol: new RegExp(data.coinSymbol, 'i') })
      .lean();

    try {
      const walletAdded = await this.walletModel.create({
        addresses: { ...data, coinId: coin._id.toString() },
      });

      // todo register webhooks
      const coinType = await this.walletHelper.getCoinType(coin);
      if (coinType === 'btcLike') {
        await this.blockcypherService.registerWebhook(
          data.address,
          coin.coinSymbol,
        );
      }
      return walletAdded;
    } catch (e) {
      //
    }
  }
}
