import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type TransactionsDocument = TransactionsEntity & Document;

export type TransactionModel = Model<TransactionsDocument> & {
  updateConfirmations: (
    id: string,
    confirmations: number,
  ) => TransactionsEntity;
};

@Schema({ timestamps: true })
export class TransactionsEntity {
  @Prop()
  coinSymbol: string;

  @Prop()
  to: string; // public address

  @Prop()
  from: string; // public address

  @Prop()
  amount: string; //output amount

  @Prop()
  fee: number; // may be number

  @Prop()
  txId: string; // transaction id of blockchain

  @Prop()
  confirmations: number; // monitor confirmations, or poll confirmations on user request

  @Prop()
  timeStamp: string; // transaction sent on blockchain timetamp

  @Prop()
  explorer: string; // blockcypher, etherscan, etc

  @Prop()
  explorerUrl: string; // blockcypher/txid, to support test tx

  @Prop()
  blockHeight: number;
}

export const TransactionSchema = SchemaFactory.createForClass(
  TransactionsEntity,
);

TransactionSchema.statics.updateConfirmations = async function (
  id: string,
  confirmations: number,
) {
  return this.findByIdAndUpdate(id, { confirmations }, { new: true });
};
