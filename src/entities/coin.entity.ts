import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { S3ImageEntity, S3ImageSchema } from './s3-image.entity';
import {
  FixedRateHistoryEntity,
  FixedRateHistorySchema,
} from './fixed-rate-history.entity';

export type CoinDocument = CoinEntity &
  Document & {
    _id?: any;
  };

@Schema({ timestamps: true })
export class CoinEntity {
  _id?: any;

  @Prop({ type: S3ImageEntity })
  icon?: S3ImageEntity;

  @Prop({ type: [FixedRateHistorySchema] })
  fixedRateHistory?: FixedRateHistoryEntity[];

  @Prop({ required: true })
  coinSymbol: string;

  @Prop({ default: 0 })
  orderIndex?: number;

  @Prop()
  coinColor: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  blockchain: string; // e.g stellar, ethereum, bitcoin

  @Prop()
  networkFeeMin: number;

  @Prop()
  networkFeeMax: number;

  @Prop()
  networkFeeAverage: number;

  @Prop()
  masterWallet: string;

  @Prop({ Type: Boolean, default: false })
  isErc20?: boolean;

  @Prop({ Type: Boolean, default: false })
  isBep20?: boolean;

  @Prop({ type: Boolean, default: false })
  isTrc20?: boolean;

  @Prop()
  contractAddress?: string;

  @Prop({ type: Object })
  contractAbi?: any;

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;

  @Prop()
  decimal: number;

  @Prop()
  coingeckoId: string;

  @Prop({ default: 0 })
  fixedRate?: number;

  @Prop({ default: false })
  isFixedRate: boolean;

  @Prop()
  feeReceivingAccount: string;

  @Prop()
  processingFee: string; // processing fee of coin that will be given to company

  @Prop()
  description?: string;
}

export const CoinSchema = SchemaFactory.createForClass(CoinEntity);
