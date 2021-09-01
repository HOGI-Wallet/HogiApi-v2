import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { BlockcypherService } from '../blockcypher/blockcypher.service';
import { CoinDocument, CoinEntity } from '../entities/coin.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Mode } from 'fs';
import { Model } from 'mongoose';
import { SendTransactionDto } from './dto/send-transaction.dto';
import { WalletHelper } from '../wallet/helpers/wallet.helper';
import { TransactionRepo } from './transaction.repo';
import { TransactionHelper } from './helpers/transaction.helper';
import { InfuraService } from '../infura/infura.service';
import { Transaction as EthereumTx } from 'ethereumjs-tx';
import { BlockExplorerUtils } from '../globals/utils/blockExplorerUtils';
import { EtherScanService } from './ether-scan.service';
import { BscScanService } from './bscscan.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly blockcypherService: BlockcypherService,
    private readonly infuraService: InfuraService,
    private readonly transactionRepo: TransactionRepo,
    private readonly transactionHelper: TransactionHelper,
    private readonly walletHelper: WalletHelper,
    @InjectModel(CoinEntity.name)
    private readonly coinModel: Model<CoinDocument>,
    private readonly etherScanService: EtherScanService,
    private readonly bscScanService: BscScanService,
  ) {}

  async createTx(coinSymbol: string, tx: CreateTransactionDto) {
    /** get coin info , this info will be used to use the underlying sdk for account recovery*/
    const coin: CoinEntity = await this.coinModel
      .findOne({
        coinSymbol: BlockExplorerUtils.getBCTestCoin(coinSymbol),
      })
      .lean();

    if (!coin) throw new NotFoundException('coin not found in db');

    /** create tx to send on the basis of cointype */
    const coinType = await this.walletHelper.getCoinType(coin);

    if (coinType === 'isEth' || coinType === 'isERC20') {
      /** get balance from etherscan*/
      return await this.infuraService.createNewEthTx(coin, tx);
    } else if (coinType === 'btcLike') {
      /** ge balance from blockcypher*/
      try {
        return await this.blockcypherService.createNewTx(
          coin.coinSymbol,
          tx.from,
          tx.to,
          (tx.amount as unknown) as number,
        );
      } catch (e) {
        throw new UnprocessableEntityException({
          message: e.message,
        });
      }
    } else if (coinType === 'stellar') {
      /** get balance from stellar  */
    }
  }

  async sendTx(coinSymbol, data: SendTransactionDto) {
    const cointype = await this.walletHelper.getCoinType(coinSymbol);
    try {
      if (cointype === 'btcLike') {
        const tx = await this.blockcypherService.sendSignedTx(
          data.tx,
          data.signatures,
          data.pubKeys,
          coinSymbol,
        );

        // log tx in db
        await this.transactionRepo.createTx(
          this.transactionHelper.transformBCTx(coinSymbol, tx.tx),
        );
        return tx;
      } else if (cointype === 'isEth' || cointype === 'isERC20') {
        return this.infuraService.submitTx(data.serializedTX);
      } else if (cointype === 'isBnb' || cointype === 'isBNB20') {
        // TODO: Integrate some platform to listen transactions on Binance Chain
        console.log('Submit Transaction For Listening Here');
      }
    } catch (e) {
      throw new UnprocessableEntityException({ message: e.message });
    }
  }

  async createSentTxInDb(txHash: string, coinSymbol: string) {
    const coin = await this.coinModel.findOne({ coinSymbol }).lean();
    const coinType = await this.walletHelper.getCoinType(coin);
    switch (coinType) {
      case 'isEth': {
        const tx = await this.etherScanService.getEthTransactionByHash(txHash);
        const dbTxPayload = await this.etherScanService.transformTxs(
          [tx],
          '',
          coin,
        );
        const dbTx = await this.transactionRepo.createTx(dbTxPayload);
        return dbTx;
      }
      case 'isERC20': {
        const tx = await this.etherScanService.getEthTransactionByHash(txHash);
        const {
          toAddress,
          amount,
        } = await this.transactionHelper.decodeERC20Transfer(tx);
        const _tx = { ...tx, to: toAddress, value: amount };
        const dbTxPayload = await this.etherScanService.transformTxs(
          [_tx],
          '',
          coin,
        );
        const dbTx = await this.transactionRepo.createTx(dbTxPayload);
        return dbTx;
      }
      case 'isBnb': {
        const tx = await this.bscScanService.getBnbTransactionByHash(txHash);
        const dbTxPayload = await this.bscScanService.transformTxs(
          [tx],
          '',
          coin,
        );
        const dbTx = await this.transactionRepo.createTx(dbTxPayload);
        return dbTx;
      }
      case 'isBEP20': {
        const tx = await this.bscScanService.getBnbTransactionByHash(txHash);
        const {
          toAddress,
          amount,
        } = await this.transactionHelper.decodeBEP20Transfer(tx);
        const _tx = { ...tx, to: toAddress, value: amount };
        const dbTxPayload = await this.bscScanService.transformTxs(
          [_tx],
          '',
          coin,
        );
        const dbTx = await this.transactionRepo.createTx(dbTxPayload);
        return dbTx;
      }
      case 'btcLike': {
        const tx = await this.blockcypherService.getTxDetails(
          coin.coinSymbol,
          txHash,
        );
        const dbTxPayload = await this.transactionHelper.transformBCTx(
          coin.coinSymbol,
          tx,
        );
        const dbTx = await this.transactionRepo.createTx(dbTxPayload);
        return dbTx;
      }
    }
  }
}
