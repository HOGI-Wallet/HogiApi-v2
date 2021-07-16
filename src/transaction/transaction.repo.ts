/**
 * this is database layer responsible db operation on transaction table
 */
import { InjectModel } from '@nestjs/mongoose';
import {
  TransactionsDocument,
  TransactionsEntity,
} from '../entities/transactions.entity';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { isArray } from 'class-validator';

@Injectable()
export class TransactionRepo {
  constructor(
    @InjectModel(TransactionsEntity.name)
    private readonly transactionsModel: Model<TransactionsDocument>,
  ) {}

  async createTx(
    tx: TransactionsEntity | TransactionsEntity[],
  ): Promise<TransactionsEntity> {
    try {
      const newTx = await this.transactionsModel.create(tx);
      if (isArray(newTx)) return newTx;
      else return newTx.toObject();
    } catch (e) {
      throw new Error("couldn't create tx in db");
    }
  }

  /**
   * list txs of address, all txs, sent txs, received txs
   * @param address
   * @param txType
   */
  async getTx(address, coinSymbol: string, txType?: string) {
    /** query to fetch from db*/
    let query: any = { from: address, coinSymbol };
    if (!txType)
      query = {
        $or: [
          { to: new RegExp(`^${address}$`, 'i'), coinSymbol },
          { from: new RegExp(`^${address}$`, 'i'), coinSymbol },
        ],
      };
    if (txType === 'sent') query = { from: new RegExp(`^${address}$`, 'i') };
    else if (txType === 'received')
      query = { to: new RegExp(`^${address}$`, 'i') };

    return this.transactionsModel.find(query).lean();
  }
}
