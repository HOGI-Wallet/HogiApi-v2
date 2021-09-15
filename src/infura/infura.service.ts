import {
  BadRequestException,
  HttpService,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import Web3 from 'web3';
import { CreateTransactionDto } from '../transaction/dto/create-transaction.dto';
import { Transaction } from 'web3-core';
import { BlockHeader } from 'web3-eth';
import { TransactionHelper } from '../transaction/helpers/transaction.helper';
import { CoinEntity } from '../entities/coin.entity';
import { SocketsService } from '../webhooks/sockets.service';
import { WalletHelper } from '../wallet/helpers/wallet.helper';
import { Transaction as EthereumTx } from 'ethereumjs-tx';
@Injectable()
export class InfuraService {
  constructor(
    @Inject('Web3')
    private readonly web3: Web3,
    @Inject('Web3Socket')
    private readonly web3Socket: Web3,
    private readonly http: HttpService,
    private readonly transactionHelper: TransactionHelper,
    private readonly socketService: SocketsService,
    private readonly walletHelper: WalletHelper,
  ) {
    // this.web3Socket.eth.subscribe('newBlockHeaders', (err, blockHeader) =>
    //   this.onBlockHeaders(err, blockHeader),
    // );
  }

  onModuleInits() {
    this.web3Socket.eth.subscribe('newBlockHeaders', (err, blockHeader) =>
      this.onBlockHeaders(err, blockHeader),
    );
  }

  async onBlockHeaders(err, blockHeaders: BlockHeader) {
    if (err) return;
    const block = await this.web3.eth.getBlock(blockHeaders.hash);
    block.transactions.forEach((txHash) =>
      this.onPendingTransaction(null, txHash),
    );
  }

  async onPendingTransaction(err, txHash: string) {
    if (err) return;

    /** check if transaction table already has this transaction */
    if (await this.transactionHelper.getTxByHash(txHash)) return;

    const tx = await this.getTransactionDetail(txHash);

    // if there is deposit address
    if (tx) {
      const {
        toAddress,
        coin,
        amount,
      } = await this.transactionHelper.decodeERC20Transfer(tx);
      const txTo = tx.to;
      if (toAddress) tx.to = toAddress;

      const isValid = await this.transactionHelper.validateEthereumTransaction(
        tx,
      );

      if (isValid) {
        tx.to = txTo;
        // create transaction in db;
        const txPayload = await this.transactionHelper.makeEthTxPayload(tx);
        try {
          const txDB = await this.transactionHelper.createTX(txPayload);
          // update balance here
          await this.walletHelper.updateEthLikeWalletsBalance(
            txTo,
            txDB.coinSymbol,
          );
          await this.walletHelper.updateEthLikeWalletsBalance(
            tx.from,
            txDB.coinSymbol,
          );
          // send data to tx., and tx.from
          // transform tx;
          const _tx = await this.transactionHelper.transformTransaction([txDB]);
          // this.socketService.emit(_tx[0], tx.to);
          // this.socketService.emit(_tx[0], tx.from);
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  async getTransactionDetail(txHash: string): Promise<Transaction> {
    try {
      const tx = await this.web3.eth.getTransaction(txHash);
      return tx;
    } catch (e) {
      throw new Error("couldn't get transaction detail");
    }
  }

  /**
   * get gas price from ethgasstation
   */
  async getCurrentGasPrices() {
    const response = await this.http
      .get('https://ethgasstation.info/json/ethgasAPI.json')
      .toPromise();
    const prices = {
      low: response.data.safeLow / 10,
      medium: response.data.average / 10,
      high: response.data.fast / 10,
    };
    return prices;
  }

  /**
   * method to send ethereum
   * @param data
   */
  async createNewEthTx(coin: CoinEntity, data: CreateTransactionDto) {
    const nonce = await this.web3.eth.getTransactionCount(
      this.web3.utils.toChecksumAddress(data.from),
    );

    /** get gas prices */
    const gasPrices = await this.getCurrentGasPrices();

    /** create tx payload */
    const trx = {
      from: this.web3.utils.toChecksumAddress(data.from),
      to: this.web3.utils.toChecksumAddress(data.to),
      value: this.web3.utils.toHex(this.web3.utils.toWei(data.amount, 'ether')),
      gas: 80000,
      gasPrice: gasPrices.low * 1000000000,
      nonce: nonce,
      chainId: 4, // EIP 155 chainId - mainnet: 1, rinkeby: 4
    };

    // ERC20 tokens
    if (coin.coinSymbol !== 'eth') {
      const contract = new this.web3.eth.Contract(
        coin.contractAbi,
        coin?.contractAddress,
        { from: this.web3.utils.toChecksumAddress(data.from) },
      );
      trx['data'] = contract.methods
        .transfer(data.to, this.web3.utils.toWei(data.amount, 'ether'))
        .encodeABI();
      trx.to = coin.contractAddress;
      delete trx.value;
      delete trx.from;
    }

    const transaction = new EthereumTx(trx, { chain: 'rinkeby' });
    return {
      ...trx,
      toSign: [transaction.serialize().toString('hex')],
    };
  }

  /**
   * send signed ethereum trx
   * @param address
   * @param publicKey
   * @param privateKey
   * @param to
   * @param amountInEther
   */
  async sendEthereum(transaction) {
    try {
      /** send tx */
      const serializedTransaction = transaction.serialize();
      const tx = await this.web3.eth.sendSignedTransaction(
        '0x' + serializedTransaction.toString('hex'),
      );

      // TODO log tx in db
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * @param tx serialized hex representation of transaction (EIP155)
   */
  async submitTx(tx: string) {
    try {
      return await this.web3.eth.sendSignedTransaction(tx);
    } catch (e) {
      throw new BadRequestException({ message: JSON.stringify(e?.message) });
    }
  }

  // async signTx() {
  //   const privateKey =
  //     '2352a0e6de222c680f7d16277ed70d77faa41f58339cfd68eae2d881f87ae92c';
  //   const data =
  //     'f86a77852dde1d72008301388094aff4481d10270f50f203e0763e2597776068cbc580b844a9059cbb0000000000000000000000001e3f98ff0e1a0dd1d9ea32b2a0bbe2c7d93af14e00000000000000000000000000000000000000000000000821ab0d4414980000808080';
  //
  //   try {
  //     const tx = new EthereumTx(data, { chain: 'rinkeby' });
  //     const txx = tx.sign(Buffer.from(privateKey, 'hex'));
  //     return await this.web3.eth.sendSignedTransaction(
  //       '0x' + tx.serialize().toString('hex'),
  //     );
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }
}
