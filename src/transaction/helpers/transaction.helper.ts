import { Inject, Injectable } from '@nestjs/common';
import {
  TransactionsDocument,
  TransactionsEntity,
} from '../../entities/transactions.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from 'web3-core';
import { WalletDocument, WalletEntity } from '../../entities/wallet.entity';
import { BlockExplorerUtils } from '../../globals/utils/blockExplorerUtils';
import Web3 from 'web3';
import { CoinDocument, CoinEntity } from '../../entities/coin.entity';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const abiDecoder = require('abi-decoder');

@Injectable()
export class TransactionHelper {
  constructor(
    @InjectModel(TransactionsEntity.name)
    private readonly transactionModel: Model<TransactionsDocument>,
    @InjectModel(CoinEntity.name)
    private readonly coinModel: Model<CoinDocument>,
    @InjectModel(WalletEntity.name)
    private readonly walletModel: Model<WalletDocument>,
    @Inject('Web3')
    private readonly web3: Web3,
    @Inject('BinanceWeb3')
    private readonly binanceWeb3: Web3,
  ) {}

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

  /**
   * get transaction from DB through hash of transaction (btc hash or ethereum hash)
   * @param txHash
   */
  async getTxByHash(txHash: string) {
    try {
      return await this.transactionModel.findOne({ txId: txHash }).lean();
    } catch (e) {
      return;
    }
  }

  async makeEthTxPayload(tx: Transaction): Promise<TransactionsEntity> {
    // const coin: CoinEntity = await this.coinModel.findOne({
    //   contractAddress: new RegExp(`^${tx.to}$`, 'i'),
    // });
    // let toAddress = tx.to?.toLowerCase();
    // let amount = this.web3.utils.fromWei(tx.value, 'ether');
    //
    // if (coin.isErc20) {
    //   abiDecoder.addABI(coin.contractAbi);
    //   const decodedData = abiDecoder.decodeMethod(tx.input);
    //   /** get decoded params */
    //   const params = decodedData.params;
    //   toAddress = params.find((p) => p.name === 'to')?.value;
    //   amount = params.find((p) => p.name === 'tokens')?.value;
    //   amount = this.web3.utils.fromWei(amount, 'ether');
    // }

    const { toAddress, amount, coin } = await this.decodeERC20Transfer(tx);
    return {
      coinSymbol: coin ? coin.coinSymbol : 'eth', //TODO check tx.to for ERC20 transfers
      amount: amount,
      confirmations: 0, // because listening to pending tx
      explorer: 'etherscan',
      explorerUrl: tx.hash,
      fee: tx.gas,
      from: tx.from.toLowerCase(),
      timeStamp: new Date().toISOString(),
      to: toAddress,
      txId: tx.hash,
      blockHeight: tx.blockNumber,
    };
  }

  /**
   * @param tx
   */
  async validateEthereumTransaction(tx: Transaction) {
    /** check if tx.to or from is in wallet table*/
    // case insensitive hash (hex string)
    try {
      return await this.walletModel.findOne({
        $or: [
          {
            address: new RegExp(`^${tx?.to}$`, 'i'),
          },
          {
            address: new RegExp(`^${tx?.from}$`, 'i'),
          },
        ],
      });
    } catch (e) {
      throw new Error('No wallet associated with this transaction');
    }
  }

  async getAllBlockCypherUnconfirmedTxs() {
    try {
      return await this.transactionModel
        .find({
          confirmations: { $lt: 10 },
          explorer: 'blockcypher',
        })
        .lean();
    } catch (e) {
      throw new Error("couldn't get unconfrimed blockcypher txs from Db");
    }
  }

  async getAllWeb3UnconfirmedTxs() {
    try {
      return await this.transactionModel
        .find({
          confirmations: { $lt: 6 },
          explorer: 'etherscan',
        })
        .lean();
    } catch (e) {
      throw new Error("couldn't get unconfrimed etherscan txs from Db");
    }
  }

  async getAllBscScanUnconfirmedTxs() {
    try {
      return await this.transactionModel
        .find({
          confirmations: { $lt: 6 },
          explorer: 'bscscan',
        })
        .lean();
    } catch (e) {
      throw new Error("couldn't get unconfrimed bscscan txs from Db");
    }
  }

  /**
   * transform tx to send to FE
   * @param tx
   */
  async transformTransaction(txs: TransactionsEntity[]) {
    return txs.map((tx) => ({
      ...tx,
      explorerUrl: BlockExplorerUtils.getInforUrl(tx.coinSymbol, tx.txId),
      status: tx.confirmations < 6 ? 'Pending' : 'Completed',
    }));
  }

  async decodeERC20Transfer(tx) {
    const coin: CoinEntity = await this.coinModel.findOne({
      contractAddress: new RegExp(`^${tx.to}$`, 'i'),
    });
    let toAddress = tx.to?.toLowerCase();
    let amount = this.web3.utils.fromWei(tx.value, 'ether');

    if (coin?.isErc20) {
      abiDecoder.addABI(coin.contractAbi);
      const decodedData = abiDecoder.decodeMethod(tx.input);
      /** get decoded params */
      if (decodedData.name === 'transfer') {
        const params = decodedData.params;
        toAddress = params.find((p) => p.name === 'to')?.value;
        amount = params.find((p) => p.name === 'tokens')?.value;
        // amount = this.web3.utils.fromWei(amount, 'ether');
      }
    }
    return { toAddress, amount, coin: coin ?? null };
  }
  async decodeBEP20Transfer(tx) {
    const coin: CoinEntity = await this.coinModel.findOne({
      contractAddress: new RegExp(`^${tx.to}$`, 'i'),
    });
    let toAddress = tx.to?.toLowerCase();
    let amount = this.web3.utils.fromWei(tx.value, 'ether');

    if (coin?.isBep20) {
      abiDecoder.addABI(coin.contractAbi);
      const decodedData = abiDecoder.decodeMethod(tx.input);
      /** get decoded params */
      if (decodedData.name === 'transfer') {
        const params = decodedData.params;
        toAddress = params.find((p) => p.name === 'recipient')?.value;
        amount = params.find((p) => p.name === 'amount')?.value;
        // amount = this.web3.utils.fromWei(amount, 'ether');
      }
    }
    return { toAddress, amount, coin: coin ?? null };
  }

  async getEthTransactionByRpc(txHash: string) {
    return await this.web3.eth.getTransaction(txHash);
  }

  async getBscTransactionByRpc(txHash: string) {
    return await this.binanceWeb3.eth.getTransaction(txHash);
  }
}
