import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CoinEntity, CoinSchema } from './coin.entity';
import { CurrencyEntity, CurrencySchema } from './currency.entity';

export type RatesDocument = RatesEntity &
  Document & {
    _id?: any;
  };

@Schema({ timestamps: true })
export class RatesEntity {
  _id?: any;

  @Prop({ ref: CoinEntity.name })
  coinId: string;

  @Prop({ ref: CurrencyEntity.name })
  currencyId: string;

  @Prop()
  rate: number;

  @Prop()
  marketCap: number;

  @Prop()
  totalVolume: number;

  @Prop()
  low24h: number;

  @Prop()
  high24h: number;

  @Prop()
  networkFeeMin: number;

  @Prop()
  networkFeeMax: number;

  @Prop()
  networkFeeAvg: number;

  @Prop()
  coinSymbol: string; // to search coin rates with coin symbol

  @Prop()
  currencyCode: string; // to search with currency code

  @Prop()
  change24h: number;

  @Prop()
  changePercentage24h: number;
}

export const RatesSchema = SchemaFactory.createForClass(RatesEntity);
